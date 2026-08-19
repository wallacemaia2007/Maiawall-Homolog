export interface Notification {
  id: string;
  userId?: string;
  type?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  priority?: string | null;
  metadata?: Record<string, unknown> | null;
}
