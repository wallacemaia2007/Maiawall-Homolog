export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  isPrimary: boolean;
  status: ProjectStatus;
  progress: number;
  version: string;
  createdAt: string;
  updatedAt: string;
  investmentPlanId?: string;
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

export interface ProjectActivity {
  id: string;
  projectId: string;
  title: string;
  version: string;
  description: string;
  createdAt: string;
}

export interface ProjectCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  createdAt: string;
  url?: string;
}

export interface ProjectChange {
  id: string;
  label: string;
  type: 'feature' | 'fix' | 'improvement';
}

export interface ProjectRelease {
  id: string;
  version: string;
  title: string;
  description?: string;
  releasedAt: string;
  changes: ProjectChange[];
}
