import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Activity, ActivityType } from '../models/activity.model';
import { ApiResponse, unwrapApiData } from '../models/api-response.model';
import { Notification } from '../models/notification.model';
import { ProjectActivity } from '../models/project.model';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private readonly http: HttpClient,
    private readonly projectService: ProjectService,
  ) {}

  getRecentActivity(): Observable<Activity[]> {
    return this.projectService.getProjects().pipe(
      switchMap((projects) => {
        if (projects.length === 0) {
          return of([]);
        }

        return forkJoin(
          projects.map((project) =>
            this.projectService.getProjectHistory(project.id).pipe(
              map((activities) =>
                activities.map((activity) => this.toDashboardActivity(activity, project.name)),
              ),
            ),
          ),
        ).pipe(map((groups) => groups.flat()));
      }),
      map((activities) =>
        activities.sort(
          (first, second) =>
            new Date(second.happenedAt).getTime() - new Date(first.happenedAt).getTime(),
        ),
      ),
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<ApiResponse<Notification[]>>(`${environment.apiUrl}/notifications`, {
        withCredentials: true,
      })
      .pipe(map(unwrapApiData));
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http
      .patch<ApiResponse<Notification>>(
        `${environment.apiUrl}/notifications/${id}/read`,
        { read: true },
        { withCredentials: true },
      )
      .pipe(map(unwrapApiData));
  }

  private toDashboardActivity(activity: ProjectActivity, projectName: string): Activity {
    return {
      id: activity.id,
      title: activity.title,
      projectName,
      happenedAt: activity.createdAt,
      type: this.toActivityType(activity.type),
    };
  }

  private toActivityType(type?: string): ActivityType {
    if (type === 'VERSION_RELEASED') {
      return 'VERSION_PUBLISHED';
    }

    if (type === 'CHANGES_REQUESTED') {
      return 'CHANGE_REQUESTED';
    }

    return 'PROJECT_UPDATED';
  }
}
