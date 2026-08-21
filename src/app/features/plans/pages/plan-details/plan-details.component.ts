import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';

import {
  Plan,
  PlanPayment,
  PlanWithDetails,
  PlanStatus,
} from '../../models/plan.model';
import { PlanService } from '../../services/plan.service';
import { PlanRenewalModalComponent } from '../../components/plan-renewal-modal/plan-renewal-modal.component';
import { PlanIncludedItemsComponent } from '../plans/components/plan-included-items/plan-included-items.component';
import { PlanExtraCostsComponent } from '../plans/components/plan-extra-costs/plan-extra-costs.component';
import { PlanPaymentsComponent } from '../plans/components/plan-payments/plan-payments.component';
import {
  getPlanStatusLabel,
  getPlanStatusTone,
  getPlanBillingCycleLabel,
  getInstallmentStatusLabel,
  getInstallmentStatusTone,
} from '../../models/plan.model';
import { formatDate, formatLongDate } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-plan-details',
  standalone: true,
  imports: [
    CommonModule,
    PlanRenewalModalComponent,
    PlanIncludedItemsComponent,
    PlanExtraCostsComponent,
    PlanPaymentsComponent,
  ],
  templateUrl: './plan-details.component.html',
  styleUrl: './plan-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly planService = inject(PlanService);
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  protected readonly renewalModalOpen = signal(false);

  protected readonly viewModel$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const planId = params.get('id') ?? '';
      return this.planService.getPlanWithDetails(planId);
    }),
    map((planWithDetails) => planWithDetails ?? null),
  );

  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/plans');
  }

  protected goToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
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

  protected countPayments(payments: PlanPayment[], status: PlanPayment['status']): number {
    return payments.filter((payment) => payment.status === status).length;
  }

  protected getNextPayment(payments: PlanPayment[]): PlanPayment | null {
    return (
      payments
        .filter((payment) => payment.status !== 'PAID')
        .sort((current, next) => new Date(current.dueDate).getTime() - new Date(next.dueDate).getTime())[0] ?? null
    );
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  protected formatDate(value: string): string {
    return formatDate(value);
  }

  protected formatLongDate(value: string): string {
    return formatLongDate(value);
  }

  protected getPlanStatusLabel(status: PlanStatus): string {
    return getPlanStatusLabel(status);
  }

  protected getPlanStatusTone(status: PlanStatus): string {
    return getPlanStatusTone(status);
  }

  protected getBillingCycleLabel(cycle: Plan['billingCycle']): string {
    return getPlanBillingCycleLabel(cycle);
  }

  protected getInstallmentStatusLabel(status: PlanPayment['status']): string {
    return getInstallmentStatusLabel(status);
  }

  protected getInstallmentStatusTone(status: PlanPayment['status']): string {
    return getInstallmentStatusTone(status);
  }

}
