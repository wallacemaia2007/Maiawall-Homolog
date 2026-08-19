import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';

import { Notification } from '../../../../core/models/notification.model';
import { NotificationService } from '../../../../core/services/notification.service';

type NotificationFilter = 'ALL' | 'UNREAD' | 'PROJECTS' | 'FINANCIAL' | 'MEETINGS' | 'PENDING';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly filter = signal<NotificationFilter>('ALL');
  protected readonly loading = signal(true);
  protected readonly actionLoading = signal(false);
  protected readonly error = signal('');
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length,
  );
  protected readonly summary = computed(() => {
    const notifications = this.notifications();

    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      projects: notifications.filter(
        (notification) => this.notificationService.getVisual(notification).category === 'PROJECTS',
      ).length,
      financial: notifications.filter(
        (notification) => this.notificationService.getVisual(notification).category === 'FINANCIAL',
      ).length,
    };
  });
  protected readonly filteredNotifications = computed(() => {
    const filter = this.filter();
    const notifications = this.notifications();

    if (filter === 'ALL') return notifications;
    if (filter === 'UNREAD') return notifications.filter((notification) => !notification.read);

    return notifications.filter(
      (notification) => this.notificationService.getVisual(notification).category === filter,
    );
  });

  protected readonly filters: { label: string; value: NotificationFilter }[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Nao lidas', value: 'UNREAD' },
    { label: 'Projetos', value: 'PROJECTS' },
    { label: 'Financeiro', value: 'FINANCIAL' },
    { label: 'Reunioes', value: 'MEETINGS' },
    { label: 'Pendencias', value: 'PENDING' },
  ];

  constructor() {
    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notifications) => this.notifications.set(notifications));

    this.loadNotifications();
  }

  protected loadNotifications(): void {
    this.loading.set(true);
    this.error.set('');

    this.notificationService
      .getNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.error.set('Nao foi possivel carregar suas notificacoes.');
        },
      });
  }

  protected setFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }

  protected openNotification(notification: Notification): void {
    const markAsRead$ = notification.read ? of(notification) : this.notificationService.markAsRead(notification.id);

    this.actionLoading.set(true);
    markAsRead$
      .pipe(
        switchMap((updatedNotification) =>
          this.notificationService.resolveDestination(updatedNotification),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
      next: (destination) => {
        this.actionLoading.set(false);
        if (destination) {
          this.router.navigate(destination);
        }
      },
      error: () => {
        this.actionLoading.set(false);
        this.error.set('Nao foi possivel atualizar a notificacao.');
      },
    });
  }

  protected markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.actionLoading.set(true);
    this.notificationService
      .markAsRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.actionLoading.set(false),
        error: () => {
          this.actionLoading.set(false);
          this.error.set('Nao foi possivel marcar a notificacao como lida.');
        },
      });
  }

  protected markAllAsRead(): void {
    this.actionLoading.set(true);

    this.notificationService
      .markAllAsRead(this.notifications())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.loadNotifications();
        },
        error: () => {
          this.actionLoading.set(false);
          this.error.set('Nao foi possivel marcar todas como lidas.');
        },
      });
  }

  protected getVisual(notification: Notification) {
    return this.notificationService.getVisual(notification);
  }

  protected hasDestination(notification: Notification): boolean {
    return Boolean(this.notificationService.getDestination(notification));
  }

  protected destinationLabel(notification: Notification): string {
    return this.notificationService.getVisual(notification).actionLabel;
  }

  protected getCardTone(notification: Notification): string {
    const visual = this.notificationService.getVisual(notification);

    if (visual.variant === 'error') return 'high';
    if (visual.variant === 'warning') return 'medium';
    if (visual.variant === 'success') return 'low';

    return notification.read ? 'neutral' : 'unread';
  }

  protected getStatusTone(notification: Notification): string {
    if (!notification.read) return 'warning';

    const variant = this.notificationService.getVisual(notification).variant;

    if (variant === 'success') return 'success';
    if (variant === 'error') return 'danger';
    if (variant === 'warning') return 'warning';

    return 'neutral';
  }

  protected getStatusLabel(notification: Notification): string {
    return notification.read ? 'Lida' : 'Nao lida';
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `Ha ${diffMinutes} min`;
    if (diffHours < 24) return `Ha ${diffHours} h`;
    if (this.isYesterday(date, now)) {
      return `Ontem as ${this.formatTime(date)}`;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected priorityLabel(priority?: string | null): string {
    const normalizedPriority = String(priority || '').toUpperCase();

    if (normalizedPriority === 'URGENT') return 'Urgente';
    if (normalizedPriority === 'HIGH') return 'Alta';
    if (normalizedPriority === 'NORMAL' || normalizedPriority === 'MEDIUM') return 'Normal';
    if (normalizedPriority === 'LOW') return 'Baixa';

    return '';
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

    return this.getVisual(notification).label;
  }

  private isYesterday(date: Date, now: Date): boolean {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return date.toDateString() === yesterday.toDateString();
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
