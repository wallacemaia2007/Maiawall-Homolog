import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';

import {
  Installment,
  InstallmentStatus,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '../../models/investment.model';
import { InvestmentService } from '../../services/investment.service';

@Component({
  selector: 'app-investment-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './investment-details.component.html',
  styleUrl: './investment-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
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

  protected readonly viewModel$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const planId = params.get('id') ?? '';

      return combineLatest({
        plan: this.investmentService.getPlanById(planId),
        installments: this.investmentService.getInstallments(planId),
      });
    }),
  );

  protected getProgress(plan: InvestmentPlan): number {
    if (plan.totalAmount <= 0) {
      return 0;
    }

    return Math.round((plan.paidAmount / plan.totalAmount) * 100);
  }

  protected countInstallments(installments: Installment[], status: InstallmentStatus): number {
    return installments.filter((installment) => installment.status === status).length;
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  protected formatDate(value: string): string {
    return this.dateFormatter.format(new Date(`${value}T00:00:00`));
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
