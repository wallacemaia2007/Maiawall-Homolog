export const API_PREFIX = '/api';

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/auth/me',
  forgotPassword: '/auth/forgot-password',
} as const;
