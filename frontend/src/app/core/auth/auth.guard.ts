import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.currentMe) {
    return true;
  }

  return auth.loadMe().pipe(
    map(() => true),
    switchMap(() => of(true)),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const checkRole = () => (auth.isAdmin() ? true : router.createUrlTree([auth.getDefaultRoute()]));

  if (auth.currentMe) {
    return checkRole();
  }

  return auth.loadMe().pipe(map(() => checkRole()));
};

export const doctorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const checkRole = () => (auth.isDoctor() ? true : router.createUrlTree([auth.getDefaultRoute()]));

  if (auth.currentMe) {
    return checkRole();
  }

  return auth.loadMe().pipe(map(() => checkRole()));
};
