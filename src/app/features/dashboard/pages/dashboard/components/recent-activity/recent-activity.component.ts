import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Activity, ActivityType } from '../../../../../../core/models/activity.model';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  readonly activities = input.required<Activity[]>();

  protected iconFor(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
      VERSION_PUBLISHED: 'check',
      CHANGE_REQUESTED: 'refresh',
      PROJECT_UPDATED: 'check',
    };

    return icons[type];
  }
}
