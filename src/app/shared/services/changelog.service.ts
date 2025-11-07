import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export interface RoadmapItem {
  item: string;
  status: 'Planned' | 'In Progress' | 'Completed';
}

export interface IssueItem {
  issue: string;
  done: boolean;
}

export interface ChangelogData {
  versions: ChangelogEntry[];
  roadmap: RoadmapItem[];
  issues: IssueItem[];
}

@Injectable({ providedIn: 'root' })
export class ChangelogService {
  constructor(private http: HttpClient) {}

  loadAll(): Observable<ChangelogData> {
    return this.http.get<ChangelogData>('/changelog.json');
  }
}
