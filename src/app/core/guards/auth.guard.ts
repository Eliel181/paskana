import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return toObservable(authService.isAuthStatusLoaded).pipe(
    filter(loaded => loaded === true), // Espera a que Firebase cargue
    take(1),
    map(() => {
      const user = authService.currentUser();
      if (user && user.emailVerified) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
