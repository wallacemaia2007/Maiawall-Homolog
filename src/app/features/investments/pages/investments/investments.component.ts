import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map, of, shareReplay, switchMap } from 'rxjs';

import {
  Installment,
  InstallmentStatus,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '../../models/investment.model';
import { InvestmentService } from '../../services/investment.service';
import { formatDate, formatLongDate } from '../../../../shared/utils/date.utils';

interface InvestmentViewModel {
  investment: InvestmentPlan;
  installments: Installment[];
  nextInstallment: Installment | null;
  progress: number;
}

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
  private readonly visibleInstallmentLimit = 3;
  protected readonly expandedInstallmentGroups = signal<Set<string>>(new Set());

  protected readonly viewModel$ = this.investmentService.getInvestments().pipe(
    switchMap((investments) => {
      if (investments.length === 0) {
        return of([]);
      }
      const installmentRequests = investments.map((inv) =>
        this.investmentService.getInstallments(inv.id).pipe(
          map((installments) => ({ investment: inv, installments })),
        ),
      );
      return combineLatest(installmentRequests);
    }),
    map((investmentData) =>
      investmentData.map(({ investment, installments }) => ({
        investment,
        installments,
        nextInstallment: installments
          .filter((i) => i.status !== 'PAID')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null,
        progress: this.investmentService.getProgress(investment),
      })),
    ),
    shareReplay(1),
  );

  protected readonly primaryViewModel$ = this.viewModel$.pipe(
    map((vms) => vms.find((vm) => this.investmentService.getPrimaryInvestment([vm.investment]) === vm.investment) ?? null),
    shareReplay(1),
  );

  protected getPrimaryInvestment(investments: InvestmentPlan[]): InvestmentPlan | null {
    return this.investmentService.getPrimaryInvestment(investments);
  }

  protected getInstallments(planId: string, viewModels: InvestmentViewModel[]): Installment[] {
    return viewModels.find((vm) => vm.investment.id === planId)?.installments ?? [];
  }

  protected getNextInstallment(planId: string, viewModels: InvestmentViewModel[]): Installment | null {
    return viewModels.find((vm) => vm.investment.id === planId)?.nextInstallment ?? null;
  }

  protected getVisibleInstallments(vm: InvestmentViewModel): Installment[] {
    if (this.isInstallmentGroupExpanded(vm.investment.id)) {
      return vm.installments;
    }

    return vm.installments.slice(0, this.visibleInstallmentLimit);
  }

  protected hasHiddenInstallments(vm: InvestmentViewModel): boolean {
    return vm.installments.length > this.visibleInstallmentLimit;
  }

  protected isInstallmentGroupExpanded(investmentId: string): boolean {
    return this.expandedInstallmentGroups().has(investmentId);
  }

  protected toggleInstallmentGroup(investmentId: string): void {
    this.expandedInstallmentGroups.update((expandedGroups) => {
      const nextExpandedGroups = new Set(expandedGroups);

      if (nextExpandedGroups.has(investmentId)) {
        nextExpandedGroups.delete(investmentId);
      } else {
        nextExpandedGroups.add(investmentId);
      }

      return nextExpandedGroups;
    });
  }

  protected getProgress(investment: InvestmentPlan): number {
    return this.investmentService.getProgress(investment);
  }

  protected getSummaryValue(
    investments: InvestmentPlan[],
    key: 'totalContracted' | 'totalPaid' | 'totalRemaining',
  ): number {
    return this.investmentService.calculateSummary(investments)[key];
  }

  protected getActiveInvestmentsCount(investments: InvestmentPlan[]): number {
    return this.investmentService.calculateSummary(investments).activeInvestments;
  }

  protected getTotalContracted(viewModels: InvestmentViewModel[]): number {
    return viewModels.reduce((sum, vm) => sum + vm.investment.totalAmount, 0);
  }

  protected getTotalPaid(viewModels: InvestmentViewModel[]): number {
    return viewModels.reduce((sum, vm) => sum + vm.investment.paidAmount, 0);
  }

  protected getTotalRemaining(viewModels: InvestmentViewModel[]): number {
    return viewModels.reduce((sum, vm) => sum + vm.investment.remainingAmount, 0);
  }

  protected getActiveCount(viewModels: InvestmentViewModel[]): number {
    return viewModels.filter((vm) => vm.investment.status === 'ACTIVE' || vm.investment.status === 'PARTIALLY_PAID').length;
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
    const labels: Record<InvestmentPlanStatus, string> = {
      ACTIVE: 'Ativo',
      PAID: 'Quitado',
      PARTIALLY_PAID: 'Em andamento',
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

  protected hasDownPayment(investment: InvestmentPlan): boolean {
    return this.investmentService.hasDownPayment(investment);
  }
}
