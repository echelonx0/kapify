import { Injectable, inject } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface AuditLogEntry {
  user_id?: string;
  action: string; // e.g., 'account_delete', 'password_change', 'logout_all'
  entity_type: string; // e.g., 'account', 'session', 'profile'
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * AuditLogService
 * Logs all account-related actions for compliance and debugging
 * Integrates with Supabase audit_logs table
 */
@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Log an action to the audit trail
   * Non-critical: failures don't block operations
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ AuditLogService: No authenticated user');
        return;
      }

      // Get request context
      const ipAddress = await this.getClientIpAddress();
      const userAgent = navigator.userAgent;

      const auditEntry = {
        user_id: userId,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        old_data: entry.old_data || null,
        new_data: entry.new_data || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.warn('⚠️ Failed to log audit entry:', error);
        // Don't throw - audit logging is non-critical
      } else {
        console.log('✅ Audit logged:', entry.action);
      }
    } catch (error) {
      console.warn('⚠️ Audit logging error (non-critical):', error);
    }
  }

  /**
   * Get audit logs for current user
   */
  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
      }

      return (data || []).map((log) => ({
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        old_data: log.old_data,
        new_data: log.new_data,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get client's IP address (best effort)
   * In production, this would come from backend headers
   */
  private async getClientIpAddress(): Promise<string | undefined> {
    try {
      // This is a simplified approach - in production use backend to get real IP
      // Public API fallback (remove in production, use backend instead)
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (error) {
      // Silently fail - IP is not critical
    }
    return undefined;
  }

  /**
   * Log specific account actions with templates
   */
  async logPasswordChange(): Promise<void> {
    await this.logAction({
      action: 'password_changed',
      entity_type: 'account',
    });
  }

  async logTwoFactorEnabled(): Promise<void> {
    await this.logAction({
      action: '2fa_enabled',
      entity_type: 'account',
    });
  }

  async logTwoFactorDisabled(): Promise<void> {
    await this.logAction({
      action: '2fa_disabled',
      entity_type: 'account',
    });
  }

  async logLogoutAll(): Promise<void> {
    await this.logAction({
      action: 'logout_all_devices',
      entity_type: 'session',
    });
  }

  async logProfileUpdated(oldData?: any, newData?: any): Promise<void> {
    await this.logAction({
      action: 'profile_updated',
      entity_type: 'account',
      old_data: oldData,
      new_data: newData,
    });
  }

  async logAccountDeleteInitiated(): Promise<void> {
    await this.logAction({
      action: 'delete_initiated',
      entity_type: 'account',
    });
  }

  async logAccountDeleted(): Promise<void> {
    await this.logAction({
      action: 'account_deleted',
      entity_type: 'account',
    });
  }

  async logDataExported(): Promise<void> {
    await this.logAction({
      action: 'data_exported',
      entity_type: 'account',
    });
  }
}
