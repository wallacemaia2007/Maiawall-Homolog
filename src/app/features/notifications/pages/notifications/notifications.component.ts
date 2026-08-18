import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, switchMap } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';

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
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  protected readonly notifications$ = this.refresh$.pipe(
    switchMap(() => this.notificationService.getNotifications()),
  );

  protected markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe(() => this.refresh$.next());
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
