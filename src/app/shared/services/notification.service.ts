import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from './shared-supabase.service';
import { environment } from 'src/environments/environment';

/**
 * Notification Service
 *
 * Handles all notification delivery (email, in-app, push)
 * Integrates with Supabase Edge Functions for email delivery
 */

export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase = inject(SharedSupabaseService);

  constructor() {
    console.log('✅ Notification service initialized');
  }

  /**
   * Send data room share notification
   */
  sendShareNotification(
    recipientEmail: string,
    dataRoomTitle: string,
    sharedByName: string,
    permissionLevel: string
  ): Observable<void> {
    if (!environment.notifications.email.enabled) {
      console.log('📧 Email notifications disabled - skipping');
      return from([undefined]);
    }

    return this.sendEmail({
      to: recipientEmail,
      subject: `${sharedByName} shared a data room with you`,
      template: 'data-room-share',
      data: {
        dataRoomTitle,
        sharedByName,
        permissionLevel,
        actionUrl: `${window.location.origin}/data-room/shared`
      }
    });
  }

  /**
   * Send access request notification to data room owner
   */
  sendAccessRequestNotification(
    ownerEmail: string,
    requesterName: string,
    requesterEmail: string,
    dataRoomTitle: string,
    requestReason: string
  ): Observable<void> {
    if (!environment.notifications.email.enabled) {
      console.log('📧 Email notifications disabled - skipping');
      return from([undefined]);
    }

    return this.sendEmail({
      to: ownerEmail,
      subject: `New access request for ${dataRoomTitle}`,
      template: 'access-request',
      data: {
        requesterName,
        requesterEmail,
        dataRoomTitle,
        requestReason,
        actionUrl: `${window.location.origin}/data-room/access-requests`
      }
    });
  }

  /**
   * Send access request approval notification
   */
  sendAccessApprovedNotification(
    requesterEmail: string,
    dataRoomTitle: string,
    permissionLevel: string
  ): Observable<void> {
    if (!environment.notifications.email.enabled) {
      console.log('📧 Email notifications disabled - skipping');
      return from([undefined]);
    }

    return this.sendEmail({
      to: requesterEmail,
      subject: `Your access request was approved`,
      template: 'access-approved',
      data: {
        dataRoomTitle,
        permissionLevel,
        actionUrl: `${window.location.origin}/data-room/shared`
      }
    });
  }

  /**
   * Send access request rejection notification
   */
  sendAccessRejectedNotification(
    requesterEmail: string,
    dataRoomTitle: string,
    rejectionReason?: string
  ): Observable<void> {
    if (!environment.notifications.email.enabled) {
      console.log('📧 Email notifications disabled - skipping');
      return from([undefined]);
    }

    return this.sendEmail({
      to: requesterEmail,
      subject: `Access request update`,
      template: 'access-rejected',
      data: {
        dataRoomTitle,
        rejectionReason: rejectionReason || 'No reason provided'
      }
    });
  }

  /**
   * Send email via Supabase Edge Function
   */
  private sendEmail(notification: EmailNotification): Observable<void> {
    return from(
      this.supabase.functions.invoke('send-email', {
        body: notification
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Email sent successfully:', notification.to);
      }),
      catchError((error) => {
        console.error('❌ Failed to send email:', error);
        // Don't fail the operation if email fails
        return from([undefined]);
      })
    );
  }

  /**
   * Create in-app notification
   */
  createInAppNotification(notification: InAppNotification): Observable<void> {
    if (!environment.notifications.inApp.enabled) {
      console.log('🔔 In-app notifications disabled - skipping');
      return from([undefined]);
    }

    return from(
      this.supabase.from('notifications').insert({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.actionUrl,
        metadata: notification.metadata || {},
        is_read: false,
        created_at: new Date().toISOString()
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log('✅ In-app notification created');
      }),
      catchError((error) => {
        console.error('❌ Failed to create in-app notification:', error);
        return from([undefined]);
      })
    );
  }

  /**
   * Get user's unread notifications
   */
  getUnreadNotifications(userId: string): Observable<InAppNotification[]> {
    return from(
      this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(item => ({
          userId: item.user_id,
          title: item.title,
          message: item.message,
          type: item.type,
          actionUrl: item.action_url,
          metadata: item.metadata
        }));
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<void> {
    return from(
      this.supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
