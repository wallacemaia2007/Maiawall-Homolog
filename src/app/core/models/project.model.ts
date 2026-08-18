export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  isPrimary: boolean;
  status: ProjectStatus;
  progress: number;
  version: string;
  updatedAt: string;
  productionUrl?: string;
  homologationUrl?: string;
  imageUrl?: string;
}

export type ProjectStatus =
  | 'DEVELOPMENT'
  | 'HOMOLOGATION'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PRODUCTION';
