import { User } from '../types';

/** ID fijo del usuario demo — solo existe en local, nunca se sincroniza con Supabase */
export const DEMO_USER_ID = 'demo-user';

export const DEMO_USER: User = {
  id: 'demo-user',
  name: 'Demo',
  username: 'Demo',
  email: 'demo@splitsmart.com',
  avatar: '',
  skipPassword: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEMO_CREDENTIALS = {
  username: 'Demo',
  email: 'demo@splitsmart.com',
  password: 'demo123456'
};
