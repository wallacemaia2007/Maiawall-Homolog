import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Activity, ActivityType } from '../models/activity.model';
import { ApiResponse, unwrapApiData } from '../models/api-response.model';
import { Notification } from '../models/notification.model';
import { Project, ProjectActivity } from '../models/project.model';
import { ProjectService } from './project.service';

export type NotificationCategory = 'PROJECTS' | 'FINANCIAL' | 'MEETINGS' | 'PENDING' | 'GENERAL';
export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';
export type NotificationIcon =
  | 'alert'
  | 'rocket'
  | 'wallet'
  | 'check'
  | 'calendar'
  | 'edit'
  | 'project'
  | 'bell';

export interface NotificationVisual {
  icon: NotificationIcon;
  label: string;
  variant: NotificationVariant;
  category: NotificationCategory;
  actionLabel: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly unreadCount$ = this.notifications$.pipe(
    map((notifications) => notifications.filter((notification) => !notification.read).length),
  );

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
      .pipe(
        map(unwrapApiData),
        map((notifications) => this.sortNewest(notifications)),
        tap((notifications) => this.notificationsSubject.next(notifications)),
      );
  }

  getUnreadCount(): Observable<number> {
    return this.getNotifications().pipe(
      map((notifications) => notifications.filter((notification) => !notification.read).length),
    );
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http
      .patch<ApiResponse<Notification>>(
        `${environment.apiUrl}/notifications/${id}/read`,
        { read: true },
        { withCredentials: true },
      )
      .pipe(
        map(unwrapApiData),
        tap((notification) => this.replaceNotification(notification)),
      );
  }

  markAllAsRead(notifications = this.notificationsSubject.value): Observable<Notification[]> {
    const unreadNotifications = notifications.filter((notification) => !notification.read);

    if (unreadNotifications.length === 0) {
      return of([]);
    }

    return forkJoin(unreadNotifications.map((notification) => this.markAsRead(notification.id)));
  }

  getVisual(notification: Notification): NotificationVisual {
    switch (this.normalizeType(notification.type)) {
      case 'PROJECT_PENDING_CREATED':
      case 'PENDING':
        return {
          icon: 'alert',
          label: 'Pendencia',
          variant: 'warning',
          category: 'PENDING',
          actionLabel: 'Ver pendencia',
        };
      case 'PROJECT_RELEASED':
      case 'PROJECT_ENTERED_PRODUCTION':
        return {
          icon: 'rocket',
          label: 'Projeto',
          variant: 'info',
          category: 'PROJECTS',
          actionLabel: 'Ver projeto',
        };
      case 'PAYMENT_DUE_SOON':
        return {
          icon: 'wallet',
          label: 'Financeiro',
          variant: 'warning',
          category: 'FINANCIAL',
          actionLabel: 'Ver plano',
        };
      case 'PAYMENT_CONFIRMED':
        return {
          icon: 'check',
          label: 'Financeiro',
          variant: 'success',
          category: 'FINANCIAL',
          actionLabel: 'Ver plano',
        };
      case 'PAYMENT_OVERDUE':
        return {
          icon: 'alert',
          label: 'Financeiro',
          variant: 'error',
          category: 'FINANCIAL',
          actionLabel: 'Ver plano',
        };
      case 'MEETING_CONFIRMED':
      case 'MEETING_CANCELLED':
      case 'MEETING_RESCHEDULED':
        return {
          icon: 'calendar',
          label: 'Reuniao',
          variant: notification.type === 'MEETING_CANCELLED' ? 'error' : 'info',
          category: 'MEETINGS',
          actionLabel: 'Ver reuniao',
        };
      case 'PROJECT_APPROVED':
        return {
          icon: 'check',
          label: 'Projeto',
          variant: 'success',
          category: 'PROJECTS',
          actionLabel: 'Ver projeto',
        };
      case 'CHANGES_REQUESTED':
        return {
          icon: 'edit',
          label: 'Projeto',
          variant: 'warning',
          category: 'PROJECTS',
          actionLabel: 'Ver projeto',
        };
      case 'PROJECT_STATUS_CHANGED':
      case 'PROJECT_ENTERED_HOMOLOGATION':
      case 'PROJECT':
        return {
          icon: 'project',
          label: 'Projeto',
          variant: 'info',
          category: 'PROJECTS',
          actionLabel: 'Ver projeto',
        };
      default:
        return {
          icon: 'bell',
          label: 'Aviso',
          variant: 'info',
          category: 'GENERAL',
          actionLabel: 'Abrir',
        };
    }
  }

  getDestination(notification: Notification): string[] | null {
    const entityType = this.normalizeType(notification.relatedEntityType);
    const metadata = notification.metadata || {};
    const relatedEntityId =
      notification.relatedEntityId ||
      this.readMetadataString(metadata, 'relatedEntityId') ||
      this.readMetadataString(metadata, 'projectId') ||
      this.readMetadataString(metadata, 'relatedProjectId') ||
      this.readMetadataString(metadata, 'pendingId') ||
      this.readMetadataString(metadata, 'investmentId') ||
      this.readMetadataString(metadata, 'planId') ||
      this.readNestedMetadataId(metadata, 'project');

    if (entityType && relatedEntityId) {
      const route = this.routeByEntityType(entityType, relatedEntityId);
      if (route) return route;
    }

    const type = this.normalizeType(notification.type);
    const category = this.getVisual(notification).category;

    if (relatedEntityId) {
      if (type.includes('PAYMENT')) return ['/investments', relatedEntityId];
      if (type.includes('PENDING')) return ['/pending', relatedEntityId];
      if (type.includes('PROJECT') || category === 'PROJECTS') {
        return ['/projects', relatedEntityId];
      }
    }

    return null;
  }

  resolveDestination(notification: Notification): Observable<string[] | null> {
    const destination = this.getDestination(notification);

    if (destination) {
      return of(destination);
    }

    if (this.getVisual(notification).category !== 'PROJECTS') {
      return of(null);
    }

    return this.projectService.getProjects().pipe(
      map((projects) => {
        const project = this.findProjectForNotification(notification, projects);
        return project ? ['/projects', project.id] : null;
      }),
    );
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

  private replaceNotification(notification: Notification): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.map((item) =>
        item.id === notification.id ? notification : item,
      ),
    );
  }

  private sortNewest(notifications: Notification[]): Notification[] {
    return [...notifications].sort(
      (first, second) =>
        new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime(),
    );
  }

  private normalizeType(type?: string | null): string {
    return String(type || '').trim().toUpperCase();
  }

  private readMetadataString(metadata: Record<string, unknown>, key: string): string {
    const value = metadata[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  }

  private readNestedMetadataId(metadata: Record<string, unknown>, key: string): string {
    const value = metadata[key];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }

    const id = (value as Record<string, unknown>)['id'];
    if (typeof id === 'string') return id;
    if (typeof id === 'number') return String(id);

    return '';
  }

  private findProjectForNotification(notification: Notification, projects: Project[]): Project | null {
    const metadata = notification.metadata || {};
    const projectName = this.readMetadataString(metadata, 'projectName');
    const version = this.readMetadataString(metadata, 'version');
    const searchableText = [notification.title, notification.message, projectName]
      .join(' ')
      .toLowerCase();

    if (projectName) {
      const projectByName = projects.find((project) => this.sameText(project.name, projectName));
      if (projectByName) return projectByName;
    }

    if (version) {
      const projectByVersion = projects.find((project) => this.sameText(project.version, version));
      if (projectByVersion) return projectByVersion;
    }

    const projectByText = projects.find((project) => searchableText.includes(project.name.toLowerCase()));
    if (projectByText) return projectByText;

    return (
      this.projectService.getPrimaryProject(projects) ||
      this.projectService.getMostAdvancedActiveProject(projects) ||
      projects[0] ||
      null
    );
  }

  private sameText(first?: string, second?: string): boolean {
    return String(first || '').toLowerCase() === String(second || '').toLowerCase();
  }

  private routeByEntityType(entityType: string, id: string): string[] | null {
    switch (entityType) {
      case 'PROJECT':
        return ['/projects', id];
      case 'PENDING':
      case 'PENDENCIA':
        return ['/pending', id];
      case 'INVESTMENT':
      case 'INVESTMENT_PLAN':
      case 'PLAN':
        return ['/investments', id];
      default:
        return null;
    }
  }
}
