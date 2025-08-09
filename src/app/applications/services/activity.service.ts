import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the shape of your activity items
export interface Activity {
  id: number;
  type: string;
  message: string;
  createdAt: string; // ISO timestamp
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
   * Fetch the latest activities
   */
  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.baseUrl);
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
}
