// src/app/applications/components/section-comments.component.ts
import { Component, signal, input, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  MessageSquare,
  Send,
  User,
  Clock,
} from 'lucide-angular';
import { ApplicationCommentsService } from '../services/application-comments.service';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { UiTextareaComponent } from 'src/app/shared/components/ui-textarea.component';

interface SectionComment {
  id: string;
  sectionId: string;
  applicationId: string;
  userId: string;
  userName: string;
  userRole: 'sme' | 'funder';
  content: string;
  isInternal: boolean; // Only visible to funders
  createdAt: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-section-comments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiTextareaComponent,
  ],
  template: `
    <div class="h-full flex flex-col">
      <!-- Comments List -->
      <div class="flex-1 overflow-y-auto space-y-4 p-4 max-h-96">
        @if (comments().length === 0) {
        <div class="text-center py-8">
          <lucide-icon
            [img]="MessageSquareIcon"
            [size]="48"
            class="text-neutral-300 mx-auto mb-3"
          />
          <h3 class="text-sm font-medium text-neutral-900 mb-1">
            No comments yet
          </h3>
          <p class="text-sm text-neutral-500">
            @if (currentUserRole() === 'funder') { Add internal review notes for
            this section } @else { Comments from your funder will appear here }
          </p>
        </div>
        } @else { @for (comment of comments(); track comment.id) {
        <div class="space-y-2">
          <!-- Comment Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div
                class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center"
              >
                <lucide-icon
                  [img]="UserIcon"
                  [size]="14"
                  class="text-primary-600"
                />
              </div>
              <div class="text-xs">
                <span class="font-medium text-neutral-900">{{
                  comment.userName
                }}</span>
                <span class="text-neutral-500 ml-1"
                  >({{ getRoleLabel(comment.userRole) }})</span
                >
              </div>
              @if (comment.isInternal && currentUserRole() === 'funder') {
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                Internal
              </span>
              }
            </div>
            <div class="flex items-center text-xs text-neutral-500">
              <lucide-icon [img]="ClockIcon" [size]="12" class="mr-1" />
              {{ comment.createdAt | date : 'MMM d, h:mm a' }}
            </div>
          </div>

          <!-- Comment Content -->
          <div class="ml-8">
            <div class="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700">
              {{ comment.content }}
            </div>
          </div>
        </div>
        } }
      </div>

      <!-- Add Comment Form - Only for funders -->
      @if (currentUserRole() === 'funder') {
      <div class="border-t border-neutral-200 p-4">
        <form [formGroup]="commentForm" (ngSubmit)="addComment()">
          <div class="space-y-3">
            <ui-textarea
              formControlName="content"
              placeholder="Add a review note for this section..."
              [rows]="3"
              [showCharCount]="true"
            />

            <!-- Internal/External Toggle -->
            <div class="flex items-center justify-between">
              <label class="flex items-center text-sm">
                <input
                  type="checkbox"
                  formControlName="isInternal"
                  class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 mr-2"
                />
                <span class="text-neutral-700">Internal note</span>
                <span class="text-neutral-500 ml-1">(not visible to SME)</span>
              </label>

              <ui-button
                type="submit"
                variant="primary"
                size="sm"
                [disabled]="isAddingComment() || commentForm.invalid"
              >
                @if (isAddingComment()) {
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                ></div>
                Adding... } @else {
                <lucide-icon [img]="SendIcon" [size]="14" class="mr-1" />
                Add Comment }
              </ui-button>
            </div>
          </div>
        </form>
      </div>
      }
    </div>
  `,
})
export class SectionCommentsComponent implements OnInit {
  applicationId = input.required<string>();
  sectionId = input.required<string>();
  currentUserRole = input<'sme' | 'funder'>('sme');

  // Signals
  comments = signal<SectionComment[]>([]);
  isLoading = signal(true);
  isAddingComment = signal(false);

  // Icons
  MessageSquareIcon = MessageSquare;
  SendIcon = Send;
  UserIcon = User;
  ClockIcon = Clock;

  // Form
  commentForm: FormGroup;

  // Filter comments based on user role
  filteredComments = computed(() => {
    const allComments = this.comments();
    if (this.currentUserRole() === 'funder') {
      return allComments; // Funders see all comments
    } else {
      return allComments.filter((c) => !c.isInternal); // SMEs only see non-internal comments
    }
  });

  constructor(
    private fb: FormBuilder,
    private commentsService: ApplicationCommentsService
  ) {
    this.commentForm = this.fb.group({
      content: [''],
      isInternal: [false],
    });
  }

  ngOnInit() {
    this.loadComments();
  }

  addComment() {
    if (this.commentForm.valid && this.currentUserRole() === 'funder') {
      this.isAddingComment.set(true);

      const formValue = this.commentForm.value;
      const newComment: Omit<
        SectionComment,
        'id' | 'createdAt' | 'userId' | 'userName' | 'userRole'
      > = {
        sectionId: this.sectionId(),
        applicationId: this.applicationId(),
        content: formValue.content,
        isInternal: formValue.isInternal,
      };

      this.commentsService.addComment(newComment).subscribe({
        next: (comment) => {
          this.comments.update((comments) => [...comments, comment]);
          this.commentForm.reset({ isInternal: false });
          this.isAddingComment.set(false);
        },
        error: (error) => {
          console.error('Failed to add comment:', error);
          this.isAddingComment.set(false);
        },
      });
    }
  }

  getRoleLabel(role: string): string {
    return role === 'funder' ? 'Funder' : 'SME';
  }

  private loadComments() {
    this.commentsService
      .getSectionComments(this.applicationId(), this.sectionId())
      .subscribe({
        next: (comments) => {
          this.comments.set(comments);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load comments:', error);
          this.isLoading.set(false);
        },
      });
  }
}
