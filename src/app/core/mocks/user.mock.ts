import type { AuthSession } from '../services/auth.service';

export const CURRENT_USER_MOCK: AuthSession = {
  user: {
    id: 'wallace',
    name: 'Wallace',
    email: 'wallace@maiawall.com',
  },
};
