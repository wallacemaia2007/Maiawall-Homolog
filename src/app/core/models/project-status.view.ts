import { ProjectStatus } from './project.model';

export interface ProjectStatusView {
  label: string;
  tone: 'neutral' | 'warning' | 'danger' | 'success' | 'info';
}

const STATUS_VIEW: Record<ProjectStatus, ProjectStatusView> = {
  DEVELOPMENT: {
    label: 'Em desenvolvimento',
    tone: 'info',
  },
  HOMOLOGATION: {
    label: 'Em homologacao',
    tone: 'warning',
  },
  CHANGES_REQUESTED: {
    label: 'Alteracoes solicitadas',
    tone: 'danger',
  },
  APPROVED: {
    label: 'Aprovado',
    tone: 'success',
  },
  PRODUCTION: {
    label: 'Em producao',
    tone: 'neutral',
  },
  COMPLETED: {
    label: 'Concluido',
    tone: 'success',
  },
};

export function getProjectStatusView(status: ProjectStatus): ProjectStatusView {
  return STATUS_VIEW[status];
}
