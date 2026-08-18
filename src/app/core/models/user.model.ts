export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  avatarUrl?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
