// src/app/shared/services/messaging.service.ts
import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, } from 'rxjs';
 
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
  message_type: 'message' | 'update' | 'comment' | 'file' | 'system' | 'broadcast';
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

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private supabase = inject(SharedSupabaseService);
  private threadsSubject = new BehaviorSubject<MessageThread[]>([]);
  private currentUserSubject = new BehaviorSubject<MessageUser | null>(null);
  private realtimeChannel?: RealtimeChannel;

  public threads$ = this.threadsSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    
    this.initializeCurrentUser();
  }

  private async initializeCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const { data: userData } = await this.supabase
          .from('users')
          .select('id, first_name, last_name, user_type')
          .eq('id', user.id)
          .single();

        if (userData) {
          const messageUser: MessageUser = {
            id: userData.id,
            name: `${userData.first_name} ${userData.last_name}`.trim() || 'You',
            initials: this.generateInitials(userData.first_name, userData.last_name),
            user_type: userData.user_type
          };
          this.currentUserSubject.next(messageUser);
          this.setupRealtimeSubscription();
        }
      }
    } catch (error) {
      console.error('Error initializing current user:', error);
    }
  }

  private generateInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return (first + last) || 'U';
  }

  private getUserRole(userType?: string): string {
    const roleMap: Record<string, string> = {
      'funder': 'Funder',
      'sme': 'SME',
      'consultant': 'Consultant'
    };
    return roleMap[userType || ''] || 'User';
  }

  private setupRealtimeSubscription() {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    this.realtimeChannel = this.supabase
      .channel('user_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        this.handleNewMessage(payload.new as Message);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'thread_participants'
      }, (payload) => {
        this.handleParticipantUpdate(payload.new as ThreadParticipant);
      })
      .subscribe();
  }

  private handleNewMessage(newMessage: Message) {
    const currentThreads = this.threadsSubject.value;
    const updatedThreads = currentThreads.map(thread => {
      if (thread.id === newMessage.thread_id) {
        // Add message user info if needed
        this.enrichMessageWithUser(newMessage);
        
        return {
          ...thread,
          messages: [...thread.messages, newMessage],
          messageCount: thread.messageCount + 1,
          unreadCount: newMessage.sender_id !== this.currentUserSubject.value?.id 
            ? thread.unreadCount + 1 
            : thread.unreadCount,
          lastMessage: newMessage,
          updated_at: newMessage.created_at
        };
      }
      return thread;
    });

    this.threadsSubject.next(updatedThreads);
  }

  private handleParticipantUpdate(participant: ThreadParticipant) {
    // Handle read status updates
    if (participant.user_id === this.currentUserSubject.value?.id) {
      this.refreshThreads();
    }
  }

  async loadThreads(): Promise<void> {
    try {
      // Get threads with participants and messages
      const { data: threadsData, error: threadsError } = await this.supabase
        .from('message_threads')
        .select(`
          *,
          thread_participants!inner(
            user_id,
            last_read_at,
            can_reply,
            users(id, first_name, last_name, user_type)
          )
        `)
        .order('updated_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Transform and enrich threads
      const enrichedThreads: MessageThread[] = await Promise.all(
        (threadsData || []).map(async (threadData) => {
          // Get messages for this thread
          const { data: messagesData } = await this.supabase
            .from('messages')
            .select(`
              *,
              users(id, first_name, last_name, user_type)
            `)
            .eq('thread_id', threadData.id)
            .order('created_at', { ascending: true });

          // Process participants
          const participants: MessageUser[] = threadData.thread_participants.map((tp: any) => ({
            id: tp.users.id,
            name: `${tp.users.first_name} ${tp.users.last_name}`.trim() || 'Unknown',
            initials: this.generateInitials(tp.users.first_name, tp.users.last_name),
            user_type: tp.users.user_type
          }));

          // Process messages
          const messages: Message[] = (messagesData || []).map((msg: any) => ({
            ...msg,
            created_at: msg.created_at,
            // Template compatibility properties
            type: msg.message_type,
            timestamp: new Date(msg.created_at),
            projectName: msg.metadata?.projectName,
            user: msg.users ? {
              id: msg.users.id,
              name: msg.users.id === this.currentUserSubject.value?.id 
                ? 'You' 
                : `${msg.users.first_name} ${msg.users.last_name}`.trim() || 'Unknown',
              initials: msg.users.id === this.currentUserSubject.value?.id
                ? 'YU'
                : this.generateInitials(msg.users.first_name, msg.users.last_name),
              user_type: msg.users.user_type,
              role: this.getUserRole(msg.users.user_type)
            } : {
              id: 'system',
              name: 'System',
              initials: 'SY',
              role: 'System'
            }
          }));

          // Calculate unread count
          const currentParticipant = threadData.thread_participants.find(
            (tp: any) => tp.user_id === this.currentUserSubject.value?.id
          );
          
          const lastReadAt = currentParticipant?.last_read_at 
            ? new Date(currentParticipant.last_read_at) 
            : null;
          
          const unreadCount = lastReadAt 
            ? messages.filter(m => 
                new Date(m.created_at) > lastReadAt && 
                m.sender_id !== this.currentUserSubject.value?.id
              ).length
            : messages.filter(m => m.sender_id !== this.currentUserSubject.value?.id).length;

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
            lastMessage: messages[messages.length - 1]
          };
        })
      );

      this.threadsSubject.next(enrichedThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }

  private async enrichMessageWithUser(message: Message) {
    if (message.sender_id && !message.user) {
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, first_name, last_name, user_type')
        .eq('id', message.sender_id)
        .single();

      if (userData) {
        message.user = {
          id: userData.id,
          name: userData.id === this.currentUserSubject.value?.id 
            ? 'You' 
            : `${userData.first_name} ${userData.last_name}`.trim() || 'Unknown',
          initials: userData.id === this.currentUserSubject.value?.id
            ? 'YU'
            : this.generateInitials(userData.first_name, userData.last_name),
          user_type: userData.user_type
        };
      }
    }
  }

  async createThread(subject: string, participantIds: string[]): Promise<string | null> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (!currentUser) throw new Error('No authenticated user');

      // Create thread
      const { data: threadData, error: threadError } = await this.supabase
        .from('message_threads')
        .insert([{
          subject,
          created_by: currentUser.id,
          metadata: {}
        }])
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants (including creator)
      const allParticipantIds = [currentUser.id, ...participantIds.filter(id => id !== currentUser.id)];
      const participantInserts = allParticipantIds.map(userId => ({
        thread_id: threadData.id,
        user_id: userId,
        can_reply: true
      }));

      const { error: participantsError } = await this.supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      // Refresh threads
      await this.loadThreads();
      
      return threadData.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }

  async sendMessage(threadId: string, content: string, messageType: Message['message_type'] = 'message', fileAttachments: any[] = []): Promise<boolean> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (!currentUser) throw new Error('No authenticated user');

      const { error } = await this.supabase
        .from('messages')
        .insert([{
          thread_id: threadId,
          sender_id: currentUser.id,
          message_type: messageType,
          content,
          file_attachments: fileAttachments,
          is_system_message: false,
          metadata: {}
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

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
      const updatedThreads = currentThreads.map(thread => {
        if (thread.id === threadId) {
          return { ...thread, unreadCount: 0 };
        }
        return thread;
      });
      this.threadsSubject.next(updatedThreads);
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  }

  getThread(threadId: string): MessageThread | null {
    return this.threadsSubject.value.find(thread => thread.id === threadId) || null;
  }

  private refreshThreads() {
    this.loadThreads();
  }

  // src/app/shared/services/messaging.service.ts - ADD these methods to your existing MessagingService

// Add these methods to your existing MessagingService class

/**
 * Get all threads related to a specific application
 */
async getApplicationThreads(applicationId: string): Promise<MessageThread[]> {
  try {
    // Get threads with application metadata
    const { data: threadsData, error: threadsError } = await this.supabase
      .from('message_threads')
      .select(`
        *,
        thread_participants!inner(
          user_id,
          last_read_at,
          can_reply,
          users(id, first_name, last_name, user_type)
        )
      `)
      .contains('metadata', { application_id: applicationId })
      .order('updated_at', { ascending: false });

    if (threadsError) throw threadsError;

    // Transform and enrich threads (reuse existing logic)
    const enrichedThreads: MessageThread[] = await Promise.all(
      (threadsData || []).map(async (threadData) => {
        // Get messages for this thread
        const { data: messagesData } = await this.supabase
          .from('messages')
          .select(`
            *,
            users(id, first_name, last_name, user_type)
          `)
          .eq('thread_id', threadData.id)
          .order('created_at', { ascending: true });

        // Process participants
        const participants: MessageUser[] = threadData.thread_participants.map((tp: any) => ({
          id: tp.users.id,
          name: `${tp.users.first_name} ${tp.users.last_name}`.trim() || 'Unknown',
          initials: this.generateInitials(tp.users.first_name, tp.users.last_name),
          user_type: tp.users.user_type
        }));

        // Process messages with user info
        const messages: Message[] = (messagesData || []).map((msg: any) => ({
          ...msg,
          type: msg.message_type,
          timestamp: new Date(msg.created_at),
          user: msg.users ? {
            id: msg.users.id,
            name: msg.users.id === this.currentUserSubject.value?.id 
              ? 'You' 
              : `${msg.users.first_name} ${msg.users.last_name}`.trim() || 'Unknown',
            initials: msg.users.id === this.currentUserSubject.value?.id
              ? 'YU'
              : this.generateInitials(msg.users.first_name, msg.users.last_name),
            user_type: msg.users.user_type
          } : {
            id: 'system',
            name: 'System',
            initials: 'SY'
          }
        }));

        // Calculate unread count
        const currentParticipant = threadData.thread_participants.find(
          (tp: any) => tp.user_id === this.currentUserSubject.value?.id
        );
        
        const lastReadAt = currentParticipant?.last_read_at 
          ? new Date(currentParticipant.last_read_at) 
          : null;
        
        const unreadCount = lastReadAt 
          ? messages.filter(m => 
              new Date(m.created_at) > lastReadAt && 
              m.sender_id !== this.currentUserSubject.value?.id
            ).length
          : messages.filter(m => m.sender_id !== this.currentUserSubject.value?.id).length;

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
          lastMessage: messages[messages.length - 1]
        };
      })
    );

    return enrichedThreads;
  } catch (error) {
    console.error('Error loading application threads:', error);
    return [];
  }
}

/**
 * Create a new thread for an application, automatically including the applicant
 */
// Replace your createApplicationThread method with this fixed version
async createApplicationThread(
  applicationId: string, 
  subject: string, 
  additionalParticipantIds: string[] = []
): Promise<string | null> {
  try {
    console.log('🐛 DEBUG: Starting createApplicationThread');
    
    // CRITICAL FIX: Use the Supabase client directly with proper auth context
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    console.log('🐛 Supabase auth user:', user?.id, authError);
    
    if (authError || !user) {
      console.error('🐛 ERROR: Supabase auth failed:', authError);
      throw new Error('Authentication failed');
    }

    // Get application details
    console.log('🐛 Fetching application:', applicationId);
    const { data: applicationData, error: appError } = await this.supabase
      .from('applications')
      .select('id, title, applicant_id, opportunity_id')
      .eq('id', applicationId)
      .single();

    console.log('🐛 Application data:', applicationData, appError);
    
    if (appError || !applicationData) {
      console.error('🐛 ERROR: Application not found:', appError);
      throw new Error('Application not found');
    }

    // CRITICAL FIX: Use a direct SQL call with auth context
    const threadSubject = subject || `Re: ${applicationData.title}`;
    
    // Use RPC call instead of direct INSERT to ensure auth context
    const { data: threadData, error: threadError } = await this.supabase.rpc(
      'create_message_thread',
      {
        thread_subject: threadSubject,
        thread_metadata: {
          application_id: applicationId,
          opportunity_id: applicationData.opportunity_id,
          application_title: applicationData.title
        }
      }
    );

    console.log('🐛 Thread RPC result:', threadData, threadError);

    if (threadError) {
      console.error('🐛 ERROR: Thread creation failed:', threadError);
      throw threadError;
    }

    const threadId = threadData;

    // Add participants
    const participantIds = [
      user.id,
      applicationData.applicant_id,
      ...additionalParticipantIds.filter(id => 
        id !== user.id && id !== applicationData.applicant_id
      )
    ];

    console.log('🐛 Participant IDs:', participantIds);

    const participantInserts = participantIds.map(userId => ({
      thread_id: threadId,
      user_id: userId,
      can_reply: true
    }));

    console.log('🐛 Participant inserts:', participantInserts);

    const { error: participantsError } = await this.supabase
      .from('thread_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('🐛 ERROR: Participants insert failed:', participantsError);
      throw participantsError;
    }

    console.log('🐛 SUCCESS: Thread created:', threadId);
    return threadId;
    
  } catch (error) {
    console.error('🐛 FULL ERROR in createApplicationThread:', error);
    return null;
  }
}

/**
 * Get application details for messaging context
 */
async getApplicationContext(applicationId: string): Promise<any> {
  try {
    // First get the application
    const { data: applicationData, error: appError } = await this.supabase
      .from('applications')
      .select(`
        id,
        title,
        status,
        stage,
        applicant_id,
        opportunity_id
      `)
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Then get the applicant user details
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        user_type,
        company_name
      `)
      .eq('id', applicationData.applicant_id)
      .single();

    if (userError) {
      console.warn('Could not fetch user details:', userError);
      // Return application data without user details
      return applicationData;
    }

    // Combine the data
    return {
      ...applicationData,
      users: userData
    };
  } catch (error) {
    console.error('Error getting application context:', error);
    return null;
  }
}
  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }
}