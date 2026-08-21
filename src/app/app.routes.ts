import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/pages/projects/projects.component').then(
            (m) => m.ProjectsComponent,
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/pages/project-details/project-details.component').then(
            (m) => m.ProjectDetailsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('./features/pendencias/pages/pendencias/pendencias.component').then(
            (m) => m.PendenciasComponent,
          ),
      },
      {
        path: 'pending/:id',
        loadComponent: () =>
          import('./features/pendencias/pages/pending-details/pending-details.component').then(
            (m) => m.PendingDetailsComponent,
          ),
      },
      {
        path: 'pendencias',
        redirectTo: 'pending',
        pathMatch: 'full',
      },
      {
        path: 'investments',
        loadComponent: () =>
          import('./features/investments/pages/investments/investments.component').then(
            (m) => m.InvestmentsComponent,
          ),
      },
      {
        path: 'investments/:id',
        loadComponent: () =>
          import(
            './features/investments/pages/investment-details/investment-details.component'
          ).then((m) => m.InvestmentDetailsComponent),
      },
      {
        path: 'configs',
        loadComponent: () =>
          import('./features/configs/pages/configs/configs.component').then(
            (m) => m.ConfigsComponent,
          ),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/pages/plans/plans.component').then((m) => m.PlansComponent),
      },
      {
        path: 'plans/:id',
        loadComponent: () =>
          import('./features/plans/pages/plan-details/plan-details.component').then(
            (m) => m.PlanDetailsComponent,
          ),
      },
    ],
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
