import { Injectable, inject, OnDestroy } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface MessageUser {
  id: string;
  name: string;
  initials: string;
  role?: string;
  avatar?: string;
  user_type?: 'sme' | 'funder' | 'consultant';
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  message_type:
    | 'message'
    | 'update'
    | 'comment'
    | 'file'
    | 'system'
    | 'broadcast';
  content: string;
  file_attachments: any[];
  created_at: string;
  is_system_message: boolean;
  metadata?: any;
  user?: MessageUser;
  // Template compatibility properties
  type?: 'message' | 'update' | 'comment' | 'file' | 'system' | 'broadcast';
  timestamp?: Date;
  projectName?: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_broadcast: boolean;
  metadata?: any;
  messages: Message[];
  participants: MessageUser[];
  messageCount: number;
  unreadCount: number;
  lastMessage?: Message;
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  can_reply: boolean;
}

/**
 * MessagingService
 * - Integrates with SharedSupabaseService for auth
 * - Caches current user instead of fetching on every operation
 * - Proper realtime subscription management
 * - Full cleanup on destroy
 * - Maintains all existing method signatures
 */
@Injectable({
  providedIn: 'root',
})
export class MessagingService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // State management
  private threadsSubject = new BehaviorSubject<MessageThread[]>([]);
  private currentUserSubject = new BehaviorSubject<MessageUser | null>(null);

  // Public observables
  public threads$ = this.threadsSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  // Realtime subscription
  private realtimeChannel?: RealtimeChannel;

  constructor() {
    this.initializeMessaging();
  }

  /**
   * Initialize messaging service
   */
  private initializeMessaging(): void {
    // console.log('📨 Initializing messaging service...');

    // Subscribe to session changes to update current user
    this.supabase.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (session) => {
        if (session?.user) {
          await this.loadCurrentUser(session.user.id);
          this.setupRealtimeSubscription();
        } else {
          this.clearMessagingState();
        }
      });
  }

  /**
   * Load current user from database (called once per session)
   */
  private async loadCurrentUser(userId: string): Promise<void> {
    try {
      const { data: userData, error } = await this.supabase
        .from('users')
        .select('id, first_name, last_name, user_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Failed to load current user:', error);
        return;
      }

      if (userData) {
        const messageUser: MessageUser = {
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`.trim() || 'You',
          initials: this.generateInitials(
            userData.first_name,
            userData.last_name
          ),
          user_type: userData.user_type,
        };
        this.currentUserSubject.next(messageUser);
        //   console.log('✅ Current user loaded:', messageUser.name);
      }
    } catch (error) {
      console.error('❌ Error loading current user:', error);
    }
  }

  /**
   * Set up realtime subscriptions for messages
   */
  private setupRealtimeSubscription(): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    try {
      this.realtimeChannel = this.supabase
        .channel('user_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            this.handleNewMessage(payload.new as Message);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'thread_participants',
          },
          (payload) => {
            this.handleParticipantUpdate(payload.new as ThreadParticipant);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            //  console.log('✅ Realtime messaging subscribed');
          }
        });
    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error);
    }
  }

  /**
   * Handle new message from realtime subscription
   */
  private handleNewMessage(newMessage: Message): void {
    const currentThreads = this.threadsSubject.value;
    const currentUser = this.currentUserSubject.value;

    const updatedThreads = currentThreads.map((thread) => {
      if (thread.id === newMessage.thread_id) {
        // Enrich message with user info
        this.enrichMessageWithUser(newMessage);

        return {
          ...thread,
          messages: [...thread.messages, newMessage],
          messageCount: thread.messageCount + 1,
          unreadCount:
            newMessage.sender_id !== currentUser?.id
              ? thread.unreadCount + 1
              : thread.unreadCount,
          lastMessage: newMessage,
          updated_at: newMessage.created_at,
        };
      }
      return thread;
    });

    this.threadsSubject.next(updatedThreads);
  }

  /**
   * Handle participant update from realtime subscription
   */
  private handleParticipantUpdate(participant: ThreadParticipant): void {
    const currentUser = this.currentUserSubject.value;
    if (participant.user_id === currentUser?.id) {
      this.loadThreads(); // Refresh to update unread counts
    }
  }

  /**
   * Load all threads for current user
   */
  async loadThreads(): Promise<void> {
    try {
      //    console.log('📨 Loading message threads...');

      // Get threads with participants
      const { data: threadsData, error: threadsError } = await this.supabase
        .from('message_threads')
        .select(
          `
          *,
          thread_participants!inner(
            user_id,
            last_read_at,
            can_reply,
            users(id, first_name, last_name, user_type)
          )
        `
        )
        .order('updated_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Transform and enrich threads
      const enrichedThreads: MessageThread[] = await Promise.all(
        (threadsData || []).map((threadData) => this.enrichThread(threadData))
      );

      this.threadsSubject.next(enrichedThreads);
      console.log('✅ Loaded', enrichedThreads.length, 'threads');
    } catch (error) {
      console.error('❌ Error loading threads:', error);
    }
  }

  /**
   * Enrich thread with messages and metadata
   */
  private async enrichThread(threadData: any): Promise<MessageThread> {
    try {
      // Get messages for this thread
      const { data: messagesData } = await this.supabase
        .from('messages')
        .select(
          `
          *,
          users(id, first_name, last_name, user_type)
        `
        )
        .eq('thread_id', threadData.id)
        .order('created_at', { ascending: true });

      // Process participants
      const participants: MessageUser[] = threadData.thread_participants.map(
        (tp: any) => ({
          id: tp.users.id,
          name:
            `${tp.users.first_name} ${tp.users.last_name}`.trim() || 'Unknown',
          initials: this.generateInitials(
            tp.users.first_name,
            tp.users.last_name
          ),
          user_type: tp.users.user_type,
        })
      );

      // Process messages with user enrichment
      const messages: Message[] = (messagesData || []).map((msg) =>
        this.transformMessage(msg)
      );

      // Calculate unread count
      const currentUser = this.currentUserSubject.value;
      const currentParticipant = threadData.thread_participants.find(
        (tp: any) => tp.user_id === currentUser?.id
      );

      const lastReadAt = currentParticipant?.last_read_at
        ? new Date(currentParticipant.last_read_at)
        : null;

      const unreadCount = lastReadAt
        ? messages.filter(
            (m) =>
              new Date(m.created_at) > lastReadAt &&
              m.sender_id !== currentUser?.id
          ).length
        : messages.filter((m) => m.sender_id !== currentUser?.id).length;

      return {
        id: threadData.id,
        subject: threadData.subject,
        created_by: threadData.created_by,
        created_at: threadData.created_at,
        updated_at: threadData.updated_at,
        is_broadcast: threadData.is_broadcast,
        metadata: threadData.metadata,
        messages,
        participants,
        messageCount: messages.length,
        unreadCount,
        lastMessage: messages[messages.length - 1],
      };
    } catch (error) {
      console.error('Error enriching thread:', error);
      // Return minimal thread on error
      return {
        id: threadData.id,
        subject: threadData.subject,
        created_by: threadData.created_by,
        created_at: threadData.created_at,
        updated_at: threadData.updated_at,
        is_broadcast: threadData.is_broadcast,
        metadata: threadData.metadata,
        messages: [],
        participants: [],
        messageCount: 0,
        unreadCount: 0,
      };
    }
  }

  /**
   * Transform message with user info and template compatibility
   */
  private transformMessage(msg: any): Message {
    const currentUser = this.currentUserSubject.value;

    const message: Message = {
      id: msg.id,
      thread_id: msg.thread_id,
      sender_id: msg.sender_id,
      message_type: msg.message_type,
      content: msg.content,
      file_attachments: msg.file_attachments || [],
      created_at: msg.created_at,
      is_system_message: msg.is_system_message,
      metadata: msg.metadata,
      // Template compatibility
      type: msg.message_type,
      timestamp: new Date(msg.created_at),
      projectName: msg.metadata?.projectName,
    };

    // Add user info
    if (msg.users) {
      message.user = {
        id: msg.users.id,
        name:
          msg.users.id === currentUser?.id
            ? 'You'
            : `${msg.users.first_name} ${msg.users.last_name}`.trim() ||
              'Unknown',
        initials:
          msg.users.id === currentUser?.id
            ? 'YU'
            : this.generateInitials(msg.users.first_name, msg.users.last_name),
        user_type: msg.users.user_type,
        role: this.getUserRole(msg.users.user_type),
      };
    } else {
      message.user = {
        id: 'system',
        name: 'System',
        initials: 'SY',
        role: 'System',
      };
    }

    return message;
  }

  /**
   * Create a new message thread
   */
  async createThread(
    subject: string,
    participantIds: string[]
  ): Promise<string | null> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (!currentUser) throw new Error('No authenticated user');

      // Create thread
      const { data: threadData, error: threadError } = await this.supabase
        .from('message_threads')
        .insert([
          {
            subject,
            created_by: currentUser.id,
            metadata: {},
          },
        ])
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants (including creator)
      const allParticipantIds = [
        currentUser.id,
        ...participantIds.filter((id) => id !== currentUser.id),
      ];

      const participantInserts = allParticipantIds.map((userId) => ({
        thread_id: threadData.id,
        user_id: userId,
        can_reply: true,
      }));

      const { error: participantsError } = await this.supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      //  console.log('✅ Thread created:', threadData.id);
      await this.loadThreads();

      return threadData.id;
    } catch (error) {
      console.error('❌ Error creating thread:', error);
      return null;
    }
  }

  /**
   * Send message to thread
   */
  async sendMessage(
    threadId: string,
    content: string,
    messageType: Message['message_type'] = 'message',
    fileAttachments: any[] = []
  ): Promise<boolean> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (!currentUser) throw new Error('No authenticated user');

      const { error } = await this.supabase.from('messages').insert([
        {
          thread_id: threadId,
          sender_id: currentUser.id,
          message_type: messageType,
          content,
          file_attachments: fileAttachments,
          is_system_message: false,
          metadata: {},
        },
      ]);

      if (error) throw error;

      //   console.log('✅ Message sent');
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  /**
   * Mark thread as read
   */
  async markThreadAsRead(threadId: string): Promise<void> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (!currentUser) return;

      const { error } = await this.supabase
        .from('thread_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      const currentThreads = this.threadsSubject.value;
      const updatedThreads = currentThreads.map((thread) => {
        if (thread.id === threadId) {
          return { ...thread, unreadCount: 0 };
        }
        return thread;
      });
      this.threadsSubject.next(updatedThreads);

      console.log('✅ Thread marked as read');
    } catch (error) {
      console.error('❌ Error marking thread as read:', error);
    }
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): MessageThread | null {
    return (
      this.threadsSubject.value.find((thread) => thread.id === threadId) || null
    );
  }

  /**
   * Get threads for a specific application
   */
  async getApplicationThreads(applicationId: string): Promise<MessageThread[]> {
    try {
      //    console.log('📨 Loading application threads for:', applicationId);

      const { data: threadsData, error: threadsError } = await this.supabase
        .from('message_threads')
        .select(
          `
          *,
          thread_participants!inner(
            user_id,
            last_read_at,
            can_reply,
            users(id, first_name, last_name, user_type)
          )
        `
        )
        .contains('metadata', { application_id: applicationId })
        .order('updated_at', { ascending: false });

      if (threadsError) throw threadsError;

      const enrichedThreads: MessageThread[] = await Promise.all(
        (threadsData || []).map((threadData) => this.enrichThread(threadData))
      );

      console.log('✅ Loaded', enrichedThreads.length, 'application threads');
      return enrichedThreads;
    } catch (error) {
      console.error('❌ Error loading application threads:', error);
      return [];
    }
  }

  /**
   * Create thread for application
   * FIXED: Uses RPC call with proper auth context
   */
  async createApplicationThread(
    applicationId: string,
    subject: string,
    additionalParticipantIds: string[] = []
  ): Promise<string | null> {
    try {
      console.log('📝 Creating application thread for:', applicationId);

      // Get current user ID from session (not via callback)
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        console.error('❌ ERROR: No authenticated user');
        throw new Error('Authentication failed');
      }

      // Get application details
      const { data: applicationData, error: appError } = await this.supabase
        .from('applications')
        .select('id, title, applicant_id, opportunity_id')
        .eq('id', applicationId)
        .single();

      if (appError || !applicationData) {
        console.error('❌ ERROR: Application not found:', appError);
        throw new Error('Application not found');
      }

      // Use RPC call to create thread with auth context
      const threadSubject = subject || `Re: ${applicationData.title}`;

      const { data: threadData, error: threadError } = await this.supabase.rpc(
        'create_message_thread',
        {
          thread_subject: threadSubject,
          thread_metadata: {
            application_id: applicationId,
            opportunity_id: applicationData.opportunity_id,
            application_title: applicationData.title,
          },
        }
      );

      if (threadError) {
        console.error('❌ ERROR: Thread creation failed:', threadError);
        throw threadError;
      }

      const threadId = threadData;

      // Add participants
      const participantIds = [
        userId,
        applicationData.applicant_id,
        ...additionalParticipantIds.filter(
          (id) => id !== userId && id !== applicationData.applicant_id
        ),
      ];

      const participantInserts = participantIds.map((participantId) => ({
        thread_id: threadId,
        user_id: participantId,
        can_reply: true,
      }));

      const { error: participantsError } = await this.supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error(
          '❌ ERROR: Participants insert failed:',
          participantsError
        );
        throw participantsError;
      }

      // console.log('✅ SUCCESS: Application thread created:', threadId);
      return threadId;
    } catch (error) {
      console.error('❌ Error creating application thread:', error);
      return null;
    }
  }

  /**
   * Get application context for messaging
   */
  async getApplicationContext(applicationId: string): Promise<any> {
    try {
      // Get application details
      const { data: applicationData, error: appError } = await this.supabase
        .from('applications')
        .select(
          `
          id,
          title,
          status,
          stage,
          applicant_id,
          opportunity_id
        `
        )
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Get applicant user details
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          user_type,
          company_name
        `
        )
        .eq('id', applicationData.applicant_id)
        .single();

      if (userError) {
        console.warn('Could not fetch user details:', userError);
        return applicationData;
      }

      return {
        ...applicationData,
        users: userData,
      };
    } catch (error) {
      console.error('Error getting application context:', error);
      return null;
    }
  }

  // ===================================
  // PRIVATE UTILITIES
  // ===================================

  /**
   * Generate user initials
   */
  private generateInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }

  /**
   * Get user role display name
   */
  private getUserRole(userType?: string): string {
    const roleMap: Record<string, string> = {
      funder: 'Funder',
      sme: 'SME',
      consultant: 'Consultant',
    };
    return roleMap[userType || ''] || 'User';
  }

  /**
   * Enrich message with user info (for realtime messages)
   */
  private async enrichMessageWithUser(message: Message): Promise<void> {
    if (message.sender_id && !message.user) {
      try {
        const { data: userData } = await this.supabase
          .from('users')
          .select('id, first_name, last_name, user_type')
          .eq('id', message.sender_id)
          .single();

        if (userData) {
          const currentUser = this.currentUserSubject.value;
          message.user = {
            id: userData.id,
            name:
              userData.id === currentUser?.id
                ? 'You'
                : `${userData.first_name} ${userData.last_name}`.trim() ||
                  'Unknown',
            initials:
              userData.id === currentUser?.id
                ? 'YU'
                : this.generateInitials(
                    userData.first_name,
                    userData.last_name
                  ),
            user_type: userData.user_type,
            role: this.getUserRole(userData.user_type),
          };
        }
      } catch (error) {
        console.warn('Error enriching message with user:', error);
      }
    }
  }

  /**
   * Clear messaging state
   */
  private clearMessagingState(): void {
    console.log('🧹 Clearing messaging state');
    this.threadsSubject.next([]);
    this.currentUserSubject.next(null);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 MessagingService destroyed');

    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    this.destroy$.next();
    this.destroy$.complete();
    this.threadsSubject.complete();
    this.currentUserSubject.complete();
  }
}
