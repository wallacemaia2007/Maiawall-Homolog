import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  Installment,
  InstallmentStatus,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '../../models/investment.model';
import { InvestmentService } from '../../services/investment.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentsComponent {
  private readonly investmentService = inject(InvestmentService);
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  private readonly longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  protected readonly plans$ = this.investmentService.getPlans();

  protected getPrimaryPlan(plans: InvestmentPlan[]): InvestmentPlan | null {
    return this.investmentService.getPrimaryPlan(plans);
  }

  protected getInstallments(planId: string): Installment[] {
    return this.investmentService.getInstallmentsByPlanId(planId);
  }

  protected getNextInstallment(planId: string): Installment | null {
    return this.getInstallments(planId).find((installment) => installment.status !== 'PAID') ?? null;
  }

  protected getProgress(plan: InvestmentPlan): number {
    if (plan.totalAmount <= 0) {
      return 0;
    }

    return Math.round((plan.paidAmount / plan.totalAmount) * 100);
  }

  protected getSummaryValue(
    plans: InvestmentPlan[],
    key: 'totalContracted' | 'totalPaid' | 'totalRemaining',
  ): number {
    return this.investmentService.calculateSummary(plans)[key];
  }

  protected getActivePlansCount(plans: InvestmentPlan[]): number {
    return this.investmentService.calculateSummary(plans).activePlans;
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  protected formatDate(value: string): string {
    return this.dateFormatter.format(new Date(`${value}T00:00:00`));
  }

  protected formatLongDate(value: string): string {
    return this.longDateFormatter.format(new Date(`${value}T00:00:00`));
  }

  protected getPlanStatusLabel(status: InvestmentPlanStatus): string {
    const labels: Record<InvestmentPlanStatus, string> = {
      ACTIVE: 'Ativo',
      PAID: 'Quitado',
      PENDING: 'Pendente',
      OVERDUE: 'Em atraso',
      CANCELLED: 'Cancelado',
    };

    return labels[status];
  }

  protected getInstallmentStatusLabel(status: InstallmentStatus): string {
    const labels: Record<InstallmentStatus, string> = {
      PAID: 'Pago',
      PENDING: 'Pendente',
      OVERDUE: 'Em atraso',
    };

    return labels[status];
  }
}
