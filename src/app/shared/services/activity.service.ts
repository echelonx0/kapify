import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Activity {
  id: number;
  type: 'funding' | 'partnership' | 'milestone' | 'system';
  message: string;
  amount?: number; // stored in cents
  status: 'completed' | 'pending' | 'failed';
  method?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly baseUrl = '/api/activities';

  constructor(private http: HttpClient) {}

  /**
   * Fetch the latest activities - returns dummy AngelList-style data
   */
  getActivities(): Observable<Activity[]> {
    const activities: Activity[] = [
      {
        id: 1,
        type: 'milestone',
        message: 'Time extended for Kapify Growth Fund',
        status: 'completed',
        createdAt: '2025-08-09T14:30:00Z'
      },
      {
        id: 2,
        type: 'funding',
        message: 'Funding limit raised for Prosperi Equity Fund',
        status: 'completed',
        createdAt: '2025-08-09T13:15:00Z'
      },
      {
        id: 3,
        type: 'partnership',
        message: 'De Meyer Family Fund joins Kapify platform',
        status: 'completed',
        createdAt: '2025-08-09T12:45:00Z'
      },
      {
        id: 4,
        type: 'funding',
        message: 'R3 million funding approved for Soso SME',
        amount: 300000000, // stored in cents
        status: 'completed',
        createdAt: '2025-08-09T11:20:00Z'
      },
      {
        id: 5,
        type: 'funding',
        message: 'Seed round opened for MobiTech Africa',
        amount: 50000000, // R500,000 in cents
        status: 'pending',
        createdAt: '2025-08-09T10:00:00Z'
      },
      {
        id: 6,
        type: 'milestone',
        message: 'GreenWave Capital surpasses R10 million raised',
        amount: 1000000000, // R10,000,000 in cents
        status: 'completed',
        createdAt: '2025-08-08T16:30:00Z'
      },
      {
        id: 7,
        type: 'system',
        message: 'Quarterly investment report generated successfully',
        status: 'completed',
        createdAt: '2025-08-08T09:00:00Z'
      }
    ];

    return of(activities);
  }

  getActivitiesPaged(page: number, pageSize: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }

  getActivityById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.baseUrl}/${id}`);
  }

  createActivity(activity: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(this.baseUrl, activity);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Format amount for display in Rand
   */
  formatAmount(amount: number): string {
    return `R${(Math.abs(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }
}
