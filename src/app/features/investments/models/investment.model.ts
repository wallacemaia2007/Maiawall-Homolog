export type InvestmentPlanStatus = 'ACTIVE' | 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type InstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface InvestmentPlan {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallments: number;
  remainingInstallments: number;
  status: InvestmentPlanStatus;
  createdAt: string;
}

export interface Installment {
  id: string;
  planId: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
}

export interface InvestmentSummary {
  totalContracted: number;
  totalPaid: number;
  totalRemaining: number;
  activePlans: number;
}
