import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PlanWithDetails, PlanStatus, PlanPayment } from '../../../../models/plan.model';
import {
  getPlanStatusLabel,
  getPlanStatusTone,
  getPlanBillingCycleLabel,
} from '../../../../models/plan.model';
import { formatDate, formatLongDate } from '../../../../../../shared/utils/date.utils';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardComponent {
  readonly plan = input.required<PlanWithDetails>();
  readonly payments = input<PlanPayment[]>([]);
  readonly isPrimary = input(false);
  readonly progressPercent = input(0);
  readonly daysRemaining = input<number | null>(null);
  readonly nextPaymentDate = input<string | null>(null);
  readonly nextPaymentAmount = input<number | null>(null);

  protected getStatusLabel(status: PlanStatus): string {
    return getPlanStatusLabel(status);
  }

  protected getStatusTone(status: PlanStatus): string {
    return getPlanStatusTone(status);
  }

  protected getBillingCycleLabel(cycle: PlanWithDetails['billingCycle']): string {
    return getPlanBillingCycleLabel(cycle);
  }

  protected getDaysRemainingTone(daysRemaining: number): 'danger' | 'warning' | 'success' {
    if (daysRemaining < 0) {
      return 'danger';
    }

    if (daysRemaining <= 7) {
      return 'warning';
    }

    return 'success';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  protected formatDate(value: string): string {
    return formatDate(value);
  }

  protected formatLongDate(value: string): string {
    return formatLongDate(value);
  }
}
