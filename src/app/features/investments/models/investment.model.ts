export type InvestmentPlanStatus = 'ACTIVE' | 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type InstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface InvestmentPlan {
  id: string;
  projectId: string;
  clientId?: string;
  projectName?: string;
  name: string;
  totalAmount: number;
  downPayment?: number;
  downPaymentDate?: string;
  downPaymentStatus?: InstallmentStatus;
  installments: number;
  installmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallments: number;
  remainingInstallments: number;
  status: InvestmentPlanStatus;
  paymentMethod?: string;
  createdAt: string;
}

export interface Installment {
  id: string;
  investmentPlanId?: string;
  planId: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
}

export interface InvestmentPayment {
  id: string;
  investmentPlanId: string;
  type: 'DOWN_PAYMENT' | 'INSTALLMENT';
  number?: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
  paymentMethod?: string;
}

export interface InvestmentSummary {
  totalContracted: number;
  totalPaid: number;
  totalRemaining: number;
  activeInvestments: number;
}

export const INVESTMENT_STATUS_LABELS: Record<InvestmentPlanStatus, string> = {
  ACTIVE: 'Ativo',
  PAID: 'Quitado',
  PARTIALLY_PAID: 'Em andamento',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
  CANCELLED: 'Cancelado',
};

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
};

export function getInvestmentStatusLabel(status: InvestmentPlanStatus): string {
  return INVESTMENT_STATUS_LABELS[status] ?? status;
}

export function getInstallmentStatusLabel(status: InstallmentStatus): string {
  return INSTALLMENT_STATUS_LABELS[status] ?? status;
}

export function getInvestmentStatusTone(status: InvestmentPlanStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PARTIALLY_PAID':
      return 'info';
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'OVERDUE':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getInstallmentStatusTone(status: InstallmentStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'OVERDUE':
      return 'danger';
    default:
      return 'neutral';
  }
}
