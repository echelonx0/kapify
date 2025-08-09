import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Activity {
  id: number;
  type: 'donation' | 'withdrawal' | 'campaign' | 'user' | 'system';
  message: string;
  amount?: number;
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
   * Fetch the latest activities - returns dummy data for now
   */
  getActivities(): Observable<Activity[]> {
    // Return dummy fundraising platform activities
    const activities: Activity[] = [
      {
        id: 1,
        type: 'donation',
        message: 'Donation received from John Smith',
        amount: 50000, // €500.00 in cents
        status: 'completed',
        method: 'Credit Card',
        createdAt: '2024-12-03T14:30:00Z',
        user: {
          id: 1,
          name: 'John Smith',
          avatarUrl: undefined
        }
      },
      {
        id: 2,
        type: 'campaign',
        message: 'New campaign "Save the Forest" created',
        status: 'completed',
        createdAt: '2024-12-03T13:15:00Z',
        user: {
          id: 2,
          name: 'Environmental Fund',
          avatarUrl: undefined
        }
      },
      {
        id: 3,
        type: 'withdrawal',
        message: 'Funds transferred to beneficiary',
        amount: -250000, // -€2,500.00 in cents
        status: 'completed',
        method: 'Bank Transfer',
        createdAt: '2024-12-03T12:45:00Z'
      },
      {
        id: 4,
        type: 'donation',
        message: 'Monthly donation from Sarah Johnson',
        amount: 2500, // €25.00 in cents
        status: 'completed',
        method: 'Bank Transfer',
        createdAt: '2024-12-03T11:20:00Z',
        user: {
          id: 3,
          name: 'Sarah Johnson',
          avatarUrl: undefined
        }
      },
      {
        id: 5,
        type: 'user',
        message: 'New user registered: Mike Wilson',
        status: 'completed',
        createdAt: '2024-12-03T10:30:00Z',
        user: {
          id: 4,
          name: 'Mike Wilson',
          avatarUrl: undefined
        }
      },
      {
        id: 6,
        type: 'donation',
        message: 'Corporate donation from TechCorp Ltd',
        amount: 100000, // €1,000.00 in cents
        status: 'pending',
        method: 'Bank Transfer',
        createdAt: '2024-12-03T09:15:00Z',
        user: {
          id: 5,
          name: 'TechCorp Ltd',
          avatarUrl: undefined
        }
      },
      {
        id: 7,
        type: 'system',
        message: 'Monthly report generated successfully',
        status: 'completed',
        createdAt: '2024-12-03T08:00:00Z'
      },
      {
        id: 8,
        type: 'campaign',
        message: 'Campaign "Clean Water Initiative" reached 75% funding goal',
        status: 'completed',
        createdAt: '2024-12-02T16:30:00Z'
      }
    ];

    return of(activities);
  }

  /**
   * Fetch activities with pagination
   */
  getActivitiesPaged(page: number, pageSize: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Fetch a single activity by ID
   */
  getActivityById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.baseUrl}/${id}`);
  }

  /**
   * Post a new activity (if needed)
   */
  createActivity(activity: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(this.baseUrl, activity);
  }

  /**
   * Delete an activity (if needed)
   */
  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `€${(Math.abs(amount) / 100).toFixed(2)}`;
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