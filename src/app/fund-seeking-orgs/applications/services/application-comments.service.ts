// src/app/applications/services/application-comments.service.ts
import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface SectionComment {
  id: string;
  sectionId: string;
  applicationId: string;
  userId: string;
  userName: string;
  userRole: 'sme' | 'funder';
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationCommentsService {
  private comments = signal<SectionComment[]>([]);

  constructor() {
    this.initializeMockData();
  }

  getSectionComments(applicationId: string, sectionId: string): Observable<SectionComment[]> {
    const sectionComments = this.comments().filter(
      comment => comment.applicationId === applicationId && comment.sectionId === sectionId
    );
    return of(sectionComments).pipe(delay(200));
  }

  addComment(comment: Omit<SectionComment, 'id' | 'createdAt' | 'userId' | 'userName' | 'userRole'>): Observable<SectionComment> {
    const newComment: SectionComment = {
      id: `comment-${Date.now()}`,
      userId: 'current-user-id', // From auth service
      userName: 'Current User', // From auth service
      userRole: 'funder', // From auth service
      createdAt: new Date(),
      ...comment
    };

    this.comments.update(comments => [...comments, newComment]);
    return of(newComment).pipe(delay(300));
  }

  updateComment(commentId: string, content: string): Observable<SectionComment> {
    const comments = this.comments();
    const index = comments.findIndex(c => c.id === commentId);
    
    if (index === -1) {
      throw new Error('Comment not found');
    }

    const updatedComment = {
      ...comments[index],
      content,
      updatedAt: new Date()
    };

    this.comments.update(comments => 
      comments.map(c => c.id === commentId ? updatedComment : c)
    );

    return of(updatedComment).pipe(delay(300));
  }

  deleteComment(commentId: string): Observable<void> {
    this.comments.update(comments => 
      comments.filter(c => c.id !== commentId)
    );
    return of(void 0).pipe(delay(200));
  }

  private initializeMockData() {
    const mockComments: SectionComment[] = [
      {
        id: 'comment-1',
        sectionId: 'documents',
        applicationId: '685188774651fc1b3b9f7cca',
        userId: 'funder-123',
        userName: 'Sarah Wilson',
        userRole: 'funder',
        content: 'The financial statements look comprehensive, but we need the latest tax clearance certificate to proceed.',
        isInternal: false,
        createdAt: new Date(2024, 10, 18, 10, 30)
      },
      {
        id: 'comment-2',
        sectionId: 'documents',
        applicationId: '685188774651fc1b3b9f7cca',
        userId: 'funder-456',
        userName: 'Michael Chen',
        userRole: 'funder',
        content: 'Internal note: Business plan shows solid growth projections, but cash flow assumptions seem optimistic.',
        isInternal: true,
        createdAt: new Date(2024, 10, 19, 14, 15)
      },
      {
        id: 'comment-3',
        sectionId: 'business-plan',
        applicationId: '685188774651fc1b3b9f7cca',
        userId: 'funder-123',
        userName: 'Sarah Wilson',
        userRole: 'funder',
        content: 'The market analysis section needs more specific data on competitor pricing and market share.',
        isInternal: false,
        createdAt: new Date(2024, 10, 20, 9, 45)
      },
      {
        id: 'comment-4',
        sectionId: 'business-plan',
        applicationId: '685188774651fc1b3b9f7cca',
        userId: 'funder-789',
        userName: 'David Kumar',
        userRole: 'funder',
        content: 'Strong management team with relevant experience. Risk mitigation strategies are well thought out.',
        isInternal: true,
        createdAt: new Date(2024, 10, 21, 16, 20)
      }
    ];

    this.comments.set(mockComments);
  }
}