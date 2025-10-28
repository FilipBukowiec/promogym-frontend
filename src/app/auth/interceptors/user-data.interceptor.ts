import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { combineLatest, iif, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const userDataInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return combineLatest([authService.isAdmin(), authService.isKiosk()]).pipe(
    switchMap(([isAdmin, isKiosk]) => iif(() => isAdmin || isKiosk, authService.selectCurrentTenant().pipe(take(1)), authService.selectUserInfo())),
    switchMap((data) => {
      if (data) {
        console.log(req);
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
