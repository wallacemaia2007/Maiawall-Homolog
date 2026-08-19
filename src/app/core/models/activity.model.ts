export interface Activity {
  id: string;
  projectId: string;
  title: string;
  projectName: string;
  happenedAt: string;
  type: ActivityType;
}

export type ActivityType = 'VERSION_PUBLISHED' | 'CHANGE_REQUESTED' | 'PROJECT_UPDATED';
