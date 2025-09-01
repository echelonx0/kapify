import { Component, Input, OnInit } from '@angular/core';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { Activity } from 'src/app/shared/services/database-activity.service';
 

@Component({
  selector: 'app-activity-stream',
  templateUrl: 'activity-stream.component.html',
  // styleUrls: ['./activity-stream.component.css']
})
export class ActivityStreamComponent implements OnInit {
  @Input() userId?: string;
  activities: Activity[] = [];
  loading = false;
  errorMessage?: string;

  constructor(private activityService: ActivityService) {}

  ngOnInit() {
    this.activityService.getActivities().subscribe({
      next: (data) => this.activities = data,
      error: (err) => {
        console.error('Error fetching activities', err);
        this.errorMessage = 'Failed to load activities';
      }
    });
  }

  trackByActivityId(index: number, activity: Activity): string {
    return activity.id.toString();
  }

  initials(name = ''): string {
    return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  }

  refresh() {
    console.log('Activity stream refreshed');
    // Add logic to actually refresh the activities here, if needed
  }
}
