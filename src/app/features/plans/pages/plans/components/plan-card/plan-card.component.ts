import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PlanWithDetails, PlanStatus, PlanPayment } from '../../../../models/plan.model';
import {
  getPlanStatusLabel,
  getPlanStatusTone,
  getPlanBillingCycleLabel,
} from '../../../../models/plan.model';
import { PlanRenewalModalComponent } from '../../../../components/plan-renewal-modal/plan-renewal-modal.component';
import { formatDate, formatLongDate } from '../../../../../../shared/utils/date.utils';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, RouterLink, PlanRenewalModalComponent],
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
  protected readonly renewalModalOpen = signal(false);

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

  protected getFinalMonthMessage(plan: PlanWithDetails): string {
    if (plan.daysUntilEnd === 0) {
      return 'Este é o último dia do seu plano. Entre em contato com o suporte e renove para continuar com os serviços.';
    }

    if (plan.daysUntilEnd === 1) {
      return 'Este é o último mês do seu plano. Ele termina em 1 dia. Entre em contato com o suporte e renove para continuar com os serviços.';
    }

    return `Este é o último mês do seu plano. Ele termina em ${plan.daysUntilEnd} dias. Entre em contato com o suporte e renove para continuar com os serviços.`;
  }

  protected openRenewalModal(): void {
    this.renewalModalOpen.set(true);
  }

  protected closeRenewalModal(): void {
    this.renewalModalOpen.set(false);
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
