import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth
    .hasValidSession()
    .pipe(map((isAuthenticated) => isAuthenticated || router.createUrlTree(['/login'])));
};

export const authChildGuard: CanActivateChildFn = authGuard;
