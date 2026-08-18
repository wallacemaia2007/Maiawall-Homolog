export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  version: string;
  homologationUrl: string;
}

export type ProjectStatus =
  | 'DEVELOPMENT'
  | 'HOMOLOGATION'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PRODUCTION';
