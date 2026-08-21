import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Pending,
  PendingStatus,
  getPendingPriorityLabel,
  getPendingStatusView,
} from '../../models/pending.model';
import { PendingService } from '../../services/pending.service';

type PendingFilter = 'ALL' | 'PENDING' | 'RESPONDED' | 'COMPLETED';

interface PendingFilterOption {
  label: string;
  value: PendingFilter;
}

@Component({
  selector: 'app-pendencias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pendencias.component.html',
  styleUrl: './pendencias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendenciasComponent {
  private readonly pendingService = inject(PendingService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly pendings = signal<Pending[]>([]);
  protected readonly selectedFilter = signal<PendingFilter>('ALL');

  protected readonly filterOptions: PendingFilterOption[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Pendentes', value: 'PENDING' },
    { label: 'Respondidas', value: 'RESPONDED' },
    { label: 'Concluidas', value: 'COMPLETED' },
  ];

  protected readonly filteredPendings = computed(() => {
    const filter = this.selectedFilter();

    if (filter === 'ALL') {
      return this.sortRespondedLast(this.pendings());
    }

    return this.sortRespondedLast(this.pendings().filter((item) => this.isStatus(item, filter)));
  });

  constructor() {
    this.loadPendings();
  }

  protected loadPendings(): void {
    this.loading.set(true);
    this.error.set(false);

    this.pendingService
      .getPendings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (pendings) => this.pendings.set(pendings),
        error: () => {
          this.pendings.set([]);
          this.error.set(true);
        },
      });
  }

  protected setFilter(filter: PendingFilter): void {
    this.selectedFilter.set(filter);
  }

  protected getStatusLabel(status: PendingStatus): string {
    return getPendingStatusView(status).label;
  }

  protected getStatusTone(status: PendingStatus): string {
    return getPendingStatusView(status).tone;
  }

  protected requiredCount(pending: Pending): number {
    return pending.fields.filter((field) => field.required).length;
  }

  protected getPriorityLabel(priority?: string): string {
    return getPendingPriorityLabel(priority);
  }

  protected getPriorityTone(priority?: string): string {
    const priorityTones: Record<string, string> = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
    };

    return priority ? (priorityTones[priority.toUpperCase()] ?? 'neutral') : 'neutral';
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return 'Nao informado';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  private isStatus(pending: Pending, status: PendingFilter): boolean {
    return String(pending.status).toUpperCase() === status;
  }

  private sortRespondedLast(pendings: Pending[]): Pending[] {
    return [...pendings].sort((first, second) => {
      const firstResponded = this.isStatus(first, 'RESPONDED') ? 1 : 0;
      const secondResponded = this.isStatus(second, 'RESPONDED') ? 1 : 0;

      if (firstResponded !== secondResponded) {
        return firstResponded - secondResponded;
      }

      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
  }
}
