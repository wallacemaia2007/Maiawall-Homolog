import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { INSTALLMENT_MOCKS, INVESTMENT_PLAN_MOCKS } from '../mocks/investment.mock';
import { Installment, InvestmentPlan, InvestmentSummary } from '../models/investment.model';

@Injectable({
  providedIn: 'root',
})
export class InvestmentService {
  getPlans(): Observable<InvestmentPlan[]> {
    return of(INVESTMENT_PLAN_MOCKS).pipe(delay(160));
  }

  getPlanById(id: string): Observable<InvestmentPlan | null> {
    return of(INVESTMENT_PLAN_MOCKS.find((plan) => plan.id === id) ?? null).pipe(delay(160));
  }

  getInstallments(planId: string): Observable<Installment[]> {
    return of(this.getInstallmentsByPlanId(planId)).pipe(delay(160));
  }

  getInstallmentsByPlanId(planId: string): Installment[] {
    return INSTALLMENT_MOCKS.filter((installment) => installment.planId === planId);
  }

  getPrimaryPlan(plans: InvestmentPlan[]): InvestmentPlan | null {
    return (
      plans.find((plan) => plan.status === 'ACTIVE') ??
      plans.find((plan) => plan.status === 'PENDING') ??
      plans[0] ??
      null
    );
  }

  calculateSummary(plans: InvestmentPlan[]): InvestmentSummary {
    const billablePlans = plans.filter((plan) => plan.status !== 'CANCELLED');

    return billablePlans.reduce<InvestmentSummary>(
      (summary, plan) => ({
        totalContracted: summary.totalContracted + plan.totalAmount,
        totalPaid: summary.totalPaid + plan.paidAmount,
        totalRemaining: summary.totalRemaining + plan.remainingAmount,
        activePlans: summary.activePlans + (plan.status === 'ACTIVE' ? 1 : 0),
      }),
      {
        totalContracted: 0,
        totalPaid: 0,
        totalRemaining: 0,
        activePlans: 0,
      },
    );
  }
}
