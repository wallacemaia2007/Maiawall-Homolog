import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';

import { Activity, ActivityType } from '../../../../../../core/models/activity.model';
import { Notification } from '../../../../../../core/models/notification.model';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly activities = input.required<Activity[]>();
  readonly notifications = input<Notification[]>([]);

  protected readonly recentNotifications = computed(() => this.notifications().slice(0, 3));

  protected iconFor(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
      VERSION_PUBLISHED: 'check',
      CHANGE_REQUESTED: 'refresh',
      PROJECT_UPDATED: 'check',
    };

    return icons[type];
  }

  protected openProject(activity: Activity): void {
    this.router.navigate(['/projects', activity.projectId]);
  }

  protected openNotification(notification: Notification): void {
    const markAsRead$ = notification.read ? of(notification) : this.notificationService.markAsRead(notification.id);

    markAsRead$
      .pipe(
        switchMap((updatedNotification) =>
          this.notificationService.resolveDestination(updatedNotification),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((destination) => {
        if (destination) {
          this.router.navigate(destination);
        }
      });
  }

  protected notificationSummary(notification: Notification): string {
    const metadata = notification.metadata || {};
    const projectName = metadata['projectName'];
    const version = metadata['version'];

    if (typeof projectName === 'string' && typeof version === 'string') {
      return `${projectName} - ${version}`;
    }

    if (typeof projectName === 'string') {
      return projectName;
    }

    return this.notificationService.getVisual(notification).label;
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
