import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, combineLatest, map, of, shareReplay, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../../../core/models/api-response.model';
import {
  Plan,
  PlanPayment,
  PlanWithDetails,
} from '../models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<ApiResponse<Plan[]>>(this.apiUrl('/plans'), { withCredentials: true })
      .pipe(
        map(unwrapApiData),
        map((plans) => plans.map((plan) => this.normalizePlan(plan))),
        catchError((error) => {
          console.error('Error fetching plans:', error);
          return of([]);
        }),
      );
  }

  getPlanById(id: string): Observable<Plan | null> {
    return this.http
      .get<ApiResponse<Plan>>(this.apiUrl(`/plans/${id}`), { withCredentials: true })
      .pipe(
        map(unwrapApiData),
        map((plan) => this.normalizePlan(plan)),
        catchError((error) => {
          console.error('Error fetching plan:', error);
          return of(null);
        }),
      );
  }

  getInstallments(planId: string): Observable<PlanPayment[]> {
    return this.http
      .get<ApiResponse<PlanPayment[]>>(this.apiUrl(`/plans/${planId}/payments`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        map((payments) => payments.map((payment) => this.normalizePayment(payment))),
        catchError((error) => {
          console.error('Error fetching plan payments:', error);
          return of([]);
        }),
      );
  }

  getPlanWithDetails(planId: string): Observable<PlanWithDetails | null> {
    return this.getPlanById(planId).pipe(
      switchMap((plan) => {
        if (!plan) {
          return of(null);
        }

        if (plan.payments.length > 0) {
          return of(this.buildPlanWithDetails(plan, plan.payments));
        }

        return this.getInstallments(planId).pipe(
          map((payments) => this.buildPlanWithDetails(plan, payments)),
        );
      }),
    );
  }

  getPlansWithDetails(): Observable<PlanWithDetails[]> {
    return this.getPlans().pipe(
      switchMap((plans) => {
        if (plans.length === 0) {
          return of([]);
        }

        const plansMissingPayments = plans.filter((plan) => plan.payments.length === 0);
        if (plansMissingPayments.length === 0) {
          return of(plans.map((plan) => this.buildPlanWithDetails(plan, plan.payments)));
        }

        const paymentRequests = plans.map((plan) =>
          plan.payments.length > 0
            ? of({ plan, payments: plan.payments })
            : this.getInstallments(plan.id).pipe(map((payments) => ({ plan, payments }))),
        );

        return combineLatest(paymentRequests).pipe(
          map((planPayments) =>
            planPayments.map(({ plan, payments }) => this.buildPlanWithDetails(plan, payments)),
          ),
        );
      }),
      shareReplay(1),
    );
  }

  getPrimaryPlan(plans: Plan[]): Plan | null {
    return (
      plans.find((plan) => plan.status === 'ACTIVE') ??
      plans.find((plan) => plan.status === 'PAUSED') ??
      plans[0] ??
      null
    );
  }

  calculateSummary(plans: Plan[]) {
    const activePlans = plans.filter((plan) => plan.status === 'ACTIVE');

    return activePlans.reduce(
      (summary, plan) => ({
        totalMonthly: summary.totalMonthly + this.getMonthlyAmount(plan),
        totalYearly: summary.totalYearly + this.getYearlyAmount(plan),
        activePlans: summary.activePlans + 1,
      }),
      {
        totalMonthly: 0,
        totalYearly: 0,
        activePlans: 0,
      },
    );
  }

  getNextPayment(plan: Plan, payments: PlanPayment[]): PlanPayment | null {
    const pendingPayments = payments
      .filter((p) => p.status !== 'PAID')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return pendingPayments[0] ?? null;
  }

  getDaysRemaining(plan: Plan, payments: PlanPayment[]): number | null {
    const nextPayment = this.getNextPayment(plan, payments);
    if (!nextPayment) {
      return null;
    }
    const now = new Date();
    const dueDate = new Date(nextPayment.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressPercent(plan: Plan, payments: PlanPayment[]): number {
    if (plan.amount <= 0 && payments.length === 0) {
      return 0;
    }
    const totalExpected = payments.length > 0
      ? payments.reduce((sum, p) => sum + p.amount, 0)
      : plan.amount;
    const totalPaid = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    if (totalExpected <= 0) {
      return 0;
    }
    return Math.round((totalPaid / totalExpected) * 100);
  }

  private buildPlanWithDetails(plan: Plan, payments: PlanPayment[]): PlanWithDetails {
    const nextPayment = this.getNextPayment(plan, payments);
    const daysRemaining = this.getDaysRemaining(plan, payments);
    const progressPercent = this.getProgressPercent(plan, payments);
    const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const totalExpected = payments.length > 0
      ? payments.reduce((sum, p) => sum + p.amount, 0)
      : plan.amount;

    return {
      ...plan,
      projectName: plan.projectName ?? 'Projeto Maiawall',
      payments,
      daysRemaining: daysRemaining ?? undefined,
      nextPaymentDate: nextPayment?.dueDate,
      nextPaymentAmount: nextPayment?.amount,
      progressPercent,
      totalPaid,
      totalRemaining: Math.max(0, totalExpected - totalPaid),
    };
  }

  private getMonthlyAmount(plan: Plan): number {
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

  private getYearlyAmount(plan: Plan): number {
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

  private normalizePlan(plan: Plan): Plan {
    const planRecord = plan as unknown as Record<string, unknown>;
    const projectId = planRecord['projectId'] ?? planRecord['project_id'];
    return {
      ...plan,
      projectId: projectId as string,
      projectName: plan.projectName ?? 'Projeto Maiawall',
      includedItems: plan.includedItems ?? [],
      extraCosts: plan.extraCosts ?? [],
      payments: plan.payments ?? [],
    };
  }

  private normalizePayment(payment: PlanPayment): PlanPayment {
    return {
      ...payment,
      planId: payment.planId ?? '',
    };
  }

  private apiUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
