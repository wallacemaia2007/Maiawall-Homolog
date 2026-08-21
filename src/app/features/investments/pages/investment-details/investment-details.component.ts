import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';

import {
  Installment,
  InstallmentStatus,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '../../models/investment.model';
import { InvestmentService } from '../../services/investment.service';
import {
  getInvestmentStatusLabel,
  getInvestmentStatusTone,
  getInstallmentStatusLabel,
  getInstallmentStatusTone,
} from '../../models/investment.model';
import { formatDate, formatLongDate } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-investment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-details.component.html',
  styleUrl: './investment-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly investmentService = inject(InvestmentService);

  protected readonly viewModel$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const planId = params.get('id') ?? '';

      return combineLatest({
        investment: this.investmentService.getInvestmentById(planId),
        installments: this.investmentService.getInstallments(planId),
        payments: this.investmentService.getPaymentHistory(planId),
      });
    }),
  );

  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/investments');
  }

  protected goToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  protected countInstallments(installments: Installment[], status: InstallmentStatus): number {
    return installments.filter((installment) => installment.status === status).length;
  }

  protected getNextInstallment(installments: Installment[]): Installment | null {
    return (
      installments
        .filter((installment) => installment.status !== 'PAID')
        .sort((current, next) => new Date(current.dueDate).getTime() - new Date(next.dueDate).getTime())[0] ?? null
    );
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

  protected getInvestmentStatusLabel(status: InvestmentPlanStatus): string {
    return getInvestmentStatusLabel(status);
  }

  protected getInvestmentStatusTone(status: InvestmentPlanStatus): string {
    return getInvestmentStatusTone(status);
  }

  protected getInstallmentStatusLabel(status: InstallmentStatus): string {
    return getInstallmentStatusLabel(status);
  }

  protected getInstallmentStatusTone(status: InstallmentStatus): string {
    return getInstallmentStatusTone(status);
  }

  protected getProgress(investment: InvestmentPlan): number {
    return this.investmentService.getProgress(investment);
  }

  protected hasDownPayment(investment: InvestmentPlan): boolean {
    return this.investmentService.hasDownPayment(investment);
  }
}
