export type PendingStatus = 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED' | string;

export type PendingFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'FILE'
  | 'EMAIL'
  | 'NUMBER'
  | 'DATE'
  | string;

export interface PendingProject {
  id: string;
  name: string;
  status?: string;
}

export interface PendingFile {
  id?: string;
  name: string;
  size?: number;
  url?: string;
  mimeType?: string;
  fieldId?: string;
}

export interface PendingField {
  id: string;
  type: PendingFieldType;
  label: string;
  description?: string;
  required?: boolean;
  value?: string | number | boolean | null;
  files?: PendingFile[];
  accept?: string[];
  allowedExtensions?: string[];
  maxSizeMb?: number;
  multiple?: boolean;
}

export interface PendingResponseItem {
  fieldId: string;
  label?: string;
  value?: string | number | boolean | null;
  files?: PendingFile[];
}

export interface Pending {
  id: string;
  projectId?: string;
  project?: PendingProject;
  title: string;
  description?: string;
  status: PendingStatus;
  fields: PendingField[];
  responses?: PendingResponseItem[];
  isRead?: boolean;
  read?: boolean;
  priority?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface PendingSubmitField {
  fieldId: string;
  value: string | number | boolean | null;
}

export interface PendingSubmitPayload {
  responses: PendingSubmitField[];
  files: Record<string, File[]>;
}

export interface PendingStatusView {
  label: string;
  tone: 'danger' | 'success' | 'neutral' | 'warning';
  icon: string;
}

const STATUS_VIEWS: Record<string, PendingStatusView> = {
  PENDING: {
    label: 'Pendente',
    tone: 'danger',
    icon: '!',
  },
  RESPONDED: {
    label: 'Respondida',
    tone: 'success',
    icon: '✓',
  },
  COMPLETED: {
    label: 'Concluida',
    tone: 'neutral',
    icon: '✓',
  },
  CANCELLED: {
    label: 'Cancelada',
    tone: 'warning',
    icon: '-',
  },
};

export function getPendingStatusView(status: PendingStatus): PendingStatusView {
  return (
    STATUS_VIEWS[String(status).toUpperCase()] ?? {
      label: String(status).replaceAll('_', ' ').toLowerCase(),
      tone: 'neutral',
      icon: '•',
    }
  );
}

export function canRespondToPending(pending: Pending): boolean {
  return String(pending.status).toUpperCase() === 'PENDING';
}

export function getPendingPriorityLabel(priority?: string): string {
  const priorityLabels: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };

  if (!priority) {
    return '';
  }

  return priorityLabels[priority.toUpperCase()] ?? priority;
}
