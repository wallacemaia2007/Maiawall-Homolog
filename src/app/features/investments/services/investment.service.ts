import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, unwrapApiData } from '../../../core/models/api-response.model';
import { Installment, InvestmentPlan, InvestmentPayment, InvestmentSummary } from '../models/investment.model';

@Injectable({
  providedIn: 'root',
})
export class InvestmentService {
  constructor(private readonly http: HttpClient) {}

  getInvestments(): Observable<InvestmentPlan[]> {
    return this.http
      .get<ApiResponse<InvestmentPlan[]>>(this.apiUrl('/investments'), { withCredentials: true })
      .pipe(
        map(unwrapApiData),
        map((plans) => plans.map((plan) => this.normalizeInvestment(plan))),
        catchError((error) => {
          console.error('Error fetching investments:', error);
          return of([]);
        }),
      );
  }

  getInvestmentById(id: string): Observable<InvestmentPlan | null> {
    return this.http
      .get<ApiResponse<InvestmentPlan>>(this.apiUrl(`/investments/${id}`), { withCredentials: true })
      .pipe(
        map(unwrapApiData),
        map((plan) => this.normalizeInvestment(plan)),
        catchError((error) => {
          console.error('Error fetching investment:', error);
          return of(null);
        }),
      );
  }

  getInstallments(planId: string): Observable<Installment[]> {
    return this.http
      .get<ApiResponse<Installment[]>>(this.apiUrl(`/investments/${planId}/installments`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        map((installments) => installments.map((installment) => this.normalizeInstallment(installment))),
        catchError((error) => {
          console.error('Error fetching installments:', error);
          return of([]);
        }),
      );
  }

  getPaymentHistory(planId: string): Observable<InvestmentPayment[]> {
    return this.http
      .get<ApiResponse<InvestmentPayment[]>>(this.apiUrl(`/investments/${planId}/payments`), {
        withCredentials: true,
      })
      .pipe(
        map(unwrapApiData),
        catchError((error) => {
          console.error('Error fetching payment history:', error);
          return of([]);
        }),
      );
  }

  getPrimaryInvestment(investments: InvestmentPlan[]): InvestmentPlan | null {
    return (
      investments.find((inv) => inv.status === 'ACTIVE') ??
      investments.find((inv) => inv.status === 'PARTIALLY_PAID') ??
      investments.find((inv) => inv.status === 'PENDING') ??
      investments[0] ??
      null
    );
  }

  calculateSummary(investments: InvestmentPlan[]): InvestmentSummary {
    const billableInvestments = investments.filter((inv) => inv.status !== 'CANCELLED');

    return billableInvestments.reduce<InvestmentSummary>(
      (summary, inv) => ({
        totalContracted: summary.totalContracted + inv.totalAmount,
        totalPaid: summary.totalPaid + inv.paidAmount,
        totalRemaining: summary.totalRemaining + inv.remainingAmount,
        activeInvestments: summary.activeInvestments + (inv.status === 'ACTIVE' || inv.status === 'PARTIALLY_PAID' ? 1 : 0),
      }),
      {
        totalContracted: 0,
        totalPaid: 0,
        totalRemaining: 0,
        activeInvestments: 0,
      },
    );
  }

  getNextInstallment(investment: InvestmentPlan, installments: Installment[]): Installment | null {
    const pendingInstallments = installments
      .filter((inst) => inst.status !== 'PAID')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return pendingInstallments[0] ?? null;
  }

  getProgress(investment: InvestmentPlan): number {
    if (investment.totalAmount <= 0) {
      return 0;
    }
    return Math.round((investment.paidAmount / investment.totalAmount) * 100);
  }

  hasDownPayment(investment: InvestmentPlan): boolean {
    return (investment.downPayment ?? 0) > 0;
  }

  private normalizeInvestment(investment: InvestmentPlan): InvestmentPlan {
    return {
      ...investment,
      projectName: investment.projectName ?? 'Projeto Maiawall',
      downPayment: investment.downPayment ?? 0,
      downPaymentStatus: investment.downPaymentStatus ?? 'PENDING',
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