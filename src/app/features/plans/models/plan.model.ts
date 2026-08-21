export type PlanStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
export type PlanBillingCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
export type PlanInstallmentStatus = PlanPayment['status'];

export interface PlanIncludedItem {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  limit?: string;
  status?: 'INCLUDED' | 'NOT_INCLUDED' | 'LIMITED';
}

export interface PlanExtraCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  periodicity: PlanBillingCycle | 'ONE_TIME';
  nextDueDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
}

export interface PlanPayment {
  id: string;
  planId: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface Plan {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  description?: string;
  amount: number;
  billingCycle: PlanBillingCycle;
  startDate: string;
  endDate?: string;
  status: PlanStatus;
  includedItems: PlanIncludedItem[];
  extraCosts: PlanExtraCost[];
  payments: PlanPayment[];
  createdAt: string;
  updatedAt?: string;
}

export interface PlanWithDetails extends Plan {
  daysRemaining?: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  progressPercent: number;
  totalPaid: number;
  totalRemaining: number;
}

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

export const PLAN_BILLING_CYCLE_LABELS: Record<PlanBillingCycle, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMI_ANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export function getPlanStatusLabel(status: PlanStatus): string {
  return PLAN_STATUS_LABELS[status] ?? status;
}

export function getPlanBillingCycleLabel(cycle: PlanBillingCycle): string {
  return PLAN_BILLING_CYCLE_LABELS[cycle] ?? cycle;
}

export function getPlanStatusTone(status: PlanStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'EXPIRED':
      return 'info';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getInstallmentStatusLabel(status: PlanPayment['status']): string {
  const labels: Record<PlanPayment['status'], string> = {
    PAID: 'Pago',
    PENDING: 'Pendente',
    OVERDUE: 'Em atraso',
  };
  return labels[status] ?? status;
}

export function getInstallmentStatusTone(status: PlanPayment['status']): 'success' | 'warning' | 'danger' | 'neutral' {
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

export function getExtraCostStatusLabel(status: PlanExtraCost['status']): string {
  const labels: Record<PlanExtraCost['status'], string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    PAUSED: 'Pausado',
  };
  return labels[status] ?? status;
}

export function getExtraCostStatusTone(status: PlanExtraCost['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'INACTIVE':
      return 'neutral';
    default:
      return 'neutral';
  }
}