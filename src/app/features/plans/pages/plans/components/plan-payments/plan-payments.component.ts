import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanPayment, PlanInstallmentStatus } from '../../../../models/plan.model';
import { getInstallmentStatusLabel, getInstallmentStatusTone } from '../../../../models/plan.model';
import { formatDate, formatLongDate } from '../../../../../../shared/utils/date.utils';

@Component({
  selector: 'app-plan-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-payments.component.html',
  styleUrl: './plan-payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPaymentsComponent {
  readonly payments = input.required<PlanPayment[]>();
  readonly title = input('Pagamentos');
  readonly subtitle = input('Histórico de parcelas do plano');

  private readonly visiblePaymentLimit = 3;
  protected readonly isExpanded = signal(false);

  protected getVisiblePayments(): PlanPayment[] {
    if (this.isExpanded()) {
      return this.payments();
    }

    return this.payments().slice(0, this.visiblePaymentLimit);
  }

  protected hasHiddenPayments(): boolean {
    return this.payments().length > this.visiblePaymentLimit;
  }

  protected togglePayments(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  protected getStatusLabel(status: PlanInstallmentStatus): string {
    return getInstallmentStatusLabel(status);
  }

  protected getStatusTone(status: PlanInstallmentStatus): string {
    return getInstallmentStatusTone(status);
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
