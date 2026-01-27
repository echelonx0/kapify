// src/app/admin/backup-management/backup-management.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

interface BackupStatus {
  isConfigured: boolean;
  lastBackupTime: string | null;
  nextBackupTime: string;
  totalBackups: number;
  retentionDays: number;
  backupSize: string;
}

interface BackupHistory {
  date: string;
  time: string;
  status: 'success' | 'failed';
  recordCount: number;
  duration: string;
  size: string;
}

@Component({
  selector: 'app-backup-management',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent],
  templateUrl: './backup-management.component.html',
})
export class BackupManagementComponent implements OnInit {
  private supabase = inject(SharedSupabaseService);

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Data signals
  backupStatus = signal<BackupStatus>({
    isConfigured: true,
    lastBackupTime: null,
    nextBackupTime: '02:00 SAST (Tonight)',
    totalBackups: 0,
    retentionDays: 30,
    backupSize: 'Calculating...',
  });

  backupHistory = signal<BackupHistory[]>([]);

  // Computed properties
  statusColor = computed(() => {
    const status = this.backupStatus();
    if (!status.isConfigured) return 'red';
    if (!status.lastBackupTime) return 'amber';
    return 'green';
  });

  statusText = computed(() => {
    const status = this.backupStatus();
    if (!status.isConfigured) return 'Not Configured';
    if (!status.lastBackupTime) return 'Pending First Backup';
    return 'Active';
  });

  statusIcon = computed(() => {
    const status = this.backupStatus();
    if (!status.isConfigured) return 'alert-circle';
    if (!status.lastBackupTime) return 'clock';
    return 'check-circle';
  });

  ngOnInit() {
    this.loadBackupStatus();
    this.loadBackupHistory();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  async loadBackupStatus() {
    this.isLoading.set(true);
    try {
      // Check if cron job exists
      const { data: cronJob, error: cronError } = await this.supabase
        .from('cron.job')
        .select('*')
        .eq('jobname', 'daily-platform-backup')
        .single();

      if (cronError) {
        console.warn('Cron job not found:', cronError);
        this.backupStatus.update((s) => ({ ...s, isConfigured: false }));
        return;
      }

      // Get backup folder info from storage
      const { data: files } = await this.supabase.storage
        .from('platform-backups')
        .list('backups', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      const totalBackups = files?.length || 0;
      const totalSize =
        files?.reduce((sum, f) => sum + (f.metadata?.['size'] || 0), 0) || 0;

      this.backupStatus.update((s) => ({
        ...s,
        isConfigured: true,
        totalBackups,
        backupSize: this.formatBytes(totalSize),
      }));
    } catch (error) {
      console.error('Failed to load backup status:', error);
      this.error.set('Could not load backup information');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadBackupHistory() {
    try {
      // Get recent cron job executions
      const { data: executions } = await this.supabase
        .from('cron.job_run_details')
        .select('*')
        .eq('jobid', 2) // Your job ID
        .order('start_time', { ascending: false })
        .limit(10);

      if (executions) {
        const history: BackupHistory[] = executions.map((exec) => ({
          date: new Date(exec.start_time).toLocaleDateString('en-ZA'),
          time: new Date(exec.start_time).toLocaleTimeString('en-ZA', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: exec.status === 'succeeded' ? 'success' : 'failed',
          recordCount: 0, // Parse from return_message if needed
          duration: this.calculateDuration(exec.start_time, exec.end_time),
          size: 'N/A',
        }));

        this.backupHistory.set(history);

        // Update last backup time
        if (history.length > 0 && history[0].status === 'success') {
          this.backupStatus.update((s) => ({
            ...s,
            lastBackupTime: `${history[0].date} at ${history[0].time}`,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }

  // ===============================
  // ACTIONS
  // ===============================

  async triggerManualBackup() {
    this.isLoading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const response = await fetch(
        'https://hsilpedhzelahseceats.supabase.co/functions/v1/daily-backup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manual: true }),
        },
      );

      if (!response.ok) {
        throw new Error('Backup failed');
      }

      const result = await response.json();

      if (result.success) {
        this.successMessage.set(
          `Backup completed successfully! ${result.summary.successCount} tables backed up.`,
        );

        // Reload status and history
        await this.loadBackupStatus();
        await this.loadBackupHistory();
      } else {
        throw new Error(result.error || 'Backup failed');
      }
    } catch (error: any) {
      console.error('Manual backup failed:', error);
      this.error.set(
        error.message || 'Failed to create backup. Please try again.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async downloadBackup(backup: BackupHistory) {
    this.error.set(null);
    try {
      // Find backup folder matching this date/time
      const { data: files } = await this.supabase.storage
        .from('platform-backups')
        .list('backups');

      // Download manifest or create zip
      alert(
        'Backup download will be implemented - navigates to Storage bucket',
      );
    } catch (error) {
      console.error('Download failed:', error);
      this.error.set('Could not download backup');
    }
  }

  openStorageBucket() {
    window.open(
      'https://supabase.com/dashboard/project/hsilpedhzelahseceats/storage/buckets/platform-backups',
      '_blank',
    );
  }

  testEmailNotification() {
    alert(
      'Test email will be sent to admin@kapify.africa\n\nCheck your inbox in 1-2 minutes.',
    );
    this.triggerManualBackup();
  }

  // ===============================
  // UTILITIES
  // ===============================

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  calculateDuration(start: string, end: string): string {
    if (!end) return 'In progress...';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s`;
  }

  getDaysUntilDeletion(backupDate: string): number {
    const backup = new Date(backupDate);
    const now = new Date();
    const retention = this.backupStatus().retentionDays;
    const deleteDate = new Date(
      backup.getTime() + retention * 24 * 60 * 60 * 1000,
    );
    const daysLeft = Math.ceil(
      (deleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.max(0, daysLeft);
  }
}
