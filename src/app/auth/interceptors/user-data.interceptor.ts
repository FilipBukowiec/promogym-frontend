import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { filter, iif, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const userDataInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return authService.isPremiumUser().pipe(
    switchMap((isPremium) => iif(() => isPremium, authService.selectCurrentTenant(), authService.selectUserInfo())),
    switchMap((data) => {
      if (data) {
        const cloned = req.clone({
          setHeaders: {
            'tenant-id': data.tenant_id,
            country: data.country,
          },
        });
        return next(cloned);
      }
      return next(req);
    })
  );
};
