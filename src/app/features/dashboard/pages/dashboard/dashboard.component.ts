import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { Activity } from '../../../../core/models/activity.model';
import { Notification } from '../../../../core/models/notification.model';
import { Project } from '../../../../core/models/project.model';
import { User } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProjectService } from '../../../../core/services/project.service';
import { UserService } from '../../../../core/services/user.service';
import { PrimaryProjectComponent } from './components/primary-project/primary-project.component';
import { ProjectProgressComponent } from './components/project-progress/project-progress.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { WelcomeSectionComponent } from './components/welcome-section/welcome-section.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryProjectComponent,
    ProjectProgressComponent,
    RecentActivityComponent,
    WelcomeSectionComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly projectService = inject(ProjectService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(true);
  protected readonly user = signal<User | null>(null);
  protected readonly projects = signal<Project[]>([]);
  protected readonly activities = signal<Activity[]>([]);
  protected readonly notifications = signal<Notification[]>([]);

  protected readonly primaryProject = computed(() =>
    this.projectService.getPrimaryProject(this.projects()),
  );

  protected readonly progressProject = computed(() =>
    this.projectService.getMostAdvancedActiveProject(this.projects()),
  );

  constructor() {
    forkJoin({
      user: this.userService.getCurrentUser(),
      projects: this.projectService.getProjects(),
      activities: this.notificationService.getRecentActivity(),
      notifications: this.notificationService.getNotifications(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(),
      )
      .subscribe(({ user, projects, activities, notifications }) => {
        this.user.set(user);
        this.projects.set(projects);
        this.activities.set(activities);
        this.notifications.set(notifications);
      });
  }
}
