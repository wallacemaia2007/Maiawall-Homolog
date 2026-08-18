import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../../../core/models/api-response.model';
import { Installment, InvestmentPlan, InvestmentSummary } from '../models/investment.model';

@Injectable({
  providedIn: 'root',
})
export class InvestmentService {
  private readonly installmentsCache = new Map<string, Installment[]>();

  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<InvestmentPlan[]> {
    return this.http
      .get<ApiResponse<InvestmentPlan[]>>(this.apiUrl('/investments'), { withCredentials: true })
      .pipe(map(unwrapApiData), map((plans) => plans.map((plan) => this.normalizePlan(plan))));
  }

  getPlanById(id: string): Observable<InvestmentPlan | null> {
    return this.http
      .get<ApiResponse<InvestmentPlan>>(this.apiUrl(`/investments/${id}`), { withCredentials: true })
      .pipe(map(unwrapApiData), map((plan) => this.normalizePlan(plan)));
  }

  getInstallments(planId: string): Observable<Installment[]> {
    return this.http
      .get<ApiResponse<Installment[]>>(this.apiUrl(`/investments/${planId}/installments`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        map((installments) => installments.map((installment) => this.normalizeInstallment(installment))),
        tap((installments) => this.installmentsCache.set(planId, installments)),
      );
  }

  getInstallmentsByPlanId(planId: string): Installment[] {
    return this.installmentsCache.get(planId) ?? [];
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

  private normalizePlan(plan: InvestmentPlan): InvestmentPlan {
    return {
      ...plan,
      projectName: plan.projectName ?? 'Projeto Maiawall',
    };
  }

  private normalizeInstallment(installment: Installment): Installment {
    return {
      ...installment,
      planId: installment.planId ?? installment.investmentPlanId ?? '',
    };
  }

  private apiUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
