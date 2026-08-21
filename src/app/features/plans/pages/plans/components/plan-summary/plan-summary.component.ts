import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanWithDetails, PlanExtraCost } from '../../../../models/plan.model';
import { SummaryCardsComponent } from '../../../../../dashboard/pages/dashboard/components/summary-cards/summary-cards.component';

@Component({
  selector: 'app-plan-summary',
  standalone: true,
  imports: [CommonModule, SummaryCardsComponent],
  templateUrl: './plan-summary.component.html',
  styleUrl: './plan-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanSummaryComponent {
  readonly plan = input.required<PlanWithDetails>();

  protected readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  protected get monthlyAmount(): number {
    const plan = this.plan();
    switch (plan.billingCycle) {
      case 'MONTHLY':
        return plan.amount;
      case 'QUARTERLY':
        return plan.amount / 3;
      case 'SEMI_ANNUAL':
        return plan.amount / 6;
      case 'ANNUAL':
        return plan.amount / 12;
    }
  }

  protected get yearlyAmount(): number {
    const plan = this.plan();
    switch (plan.billingCycle) {
      case 'MONTHLY':
        return plan.amount * 12;
      case 'QUARTERLY':
        return plan.amount * 4;
      case 'SEMI_ANNUAL':
        return plan.amount * 2;
      case 'ANNUAL':
        return plan.amount;
    }
  }

  protected get extrasMonthly(): number {
    return this.plan().extraCosts
      .filter((e: PlanExtraCost) => e.periodicity === 'MONTHLY' && e.status === 'ACTIVE')
      .reduce((s: number, e: PlanExtraCost) => s + e.amount, 0);
  }

  protected get extrasYearly(): number {
    return this.plan().extraCosts
      .filter((e: PlanExtraCost) => e.periodicity === 'ANNUAL' && e.status === 'ACTIVE')
      .reduce((s: number, e: PlanExtraCost) => s + e.amount, 0);
  }

  protected get totalIncludedItems(): number {
    return this.plan().includedItems.length;
  }

  protected get activeExtrasCount(): number {
    return this.plan().extraCosts.filter((e: PlanExtraCost) => e.status === 'ACTIVE').length;
  }

  protected get summaryCards() {
    return [
      { label: 'Valor mensal', value: this.formatCurrency(this.monthlyAmount) },
      { label: 'Valor anual', value: this.formatCurrency(this.yearlyAmount) },
      { label: 'Extras mensais', value: this.formatCurrency(this.extrasMonthly) },
      { label: 'Extras anuais', value: this.formatCurrency(this.extrasYearly), highlight: true },
    ];
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }
}
