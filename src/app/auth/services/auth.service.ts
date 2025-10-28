import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { Tenant } from '../../models/tenant.model';
import { Role } from '../enums/role.enum';
import { DecodedToken, UserInfo } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentTenant$ = new BehaviorSubject<Tenant>(null);
  private readonly userInfo$ = new BehaviorSubject<UserInfo>(null);

  constructor(private readonly auth0Service: Auth0Service) {}

  public initUserInfo(): Observable<UserInfo> {
    return combineLatest([this.auth0Service.getAccessTokenSilently(), this.auth0Service.user$]).pipe(
      map(([token, user]) => {
        const decodedToken = jwtDecode(token) as DecodedToken;
        const kioskTenantId = localStorage.getItem('tenant_id');
        const kioskCountry = localStorage.getItem('country');
        return {
          country: !!kioskCountry ? kioskCountry : decodedToken.country,
          roles: decodedToken['https://promogym.com/roles'] as Role[],
          tenant_id: !!kioskTenantId ? kioskTenantId : decodedToken.tenant_id,
          email: user?.email || '',
        };
      }),
      take(1),
      tap((userInfo) => this.dispatchUserInfo(userInfo)),
      tap((userInfo) => this.dispatchCurrentTenant({ country: userInfo.country, tenant_id: userInfo.tenant_id }))
    );
  }

  public isPremiumUser(): Observable<boolean> {
    return this.selectUserInfo().pipe(map((userInfo) => userInfo?.roles.includes(Role.PremiumUser) || false));
  }

  public isAdmin(): Observable<boolean> {
    return this.selectUserInfo().pipe(map((userInfo) => userInfo?.roles.includes(Role.Admin) || false));
  }

  public isKiosk(): Observable<boolean> {
    return this.selectUserInfo().pipe(map((userInfo) => userInfo?.roles.includes(Role.Kiosk) || false));
  }

  private dispatchUserInfo(userInfo: UserInfo): void {
    this.userInfo$.next(userInfo);
  }

  public selectUserInfo(): Observable<UserInfo> {
    return this.userInfo$.asObservable();
  }

  public dispatchCurrentTenant(currentTenant: Tenant): void {
    this.currentTenant$.next(currentTenant);
  }

  public selectCurrentTenant(): Observable<Tenant> {
    return this.currentTenant$.asObservable().pipe(filter((currentTenant) => !!currentTenant));
  }
}
