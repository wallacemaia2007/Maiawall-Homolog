import { Activity } from '../models/activity.model';

export const ACTIVITY_MOCKS: Activity[] = [
  {
    id: 'version-published',
    title: 'Nova versao publicada',
    projectName: 'Site Institucional',
    happenedAt: 'Hoje, 09:42',
    type: 'VERSION_PUBLISHED',
  },
  {
    id: 'change-requested',
    title: 'Alteracao solicitada',
    projectName: 'Landing Page Comercial',
    happenedAt: 'Ontem, 16:20',
    type: 'CHANGE_REQUESTED',
  },
  {
    id: 'project-updated',
    title: 'Projeto atualizado',
    projectName: 'Site Institucional',
    happenedAt: 'Ontem, 14:10',
    type: 'PROJECT_UPDATED',
  },
];
