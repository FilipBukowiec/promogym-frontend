import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Tenant } from '../models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();

  private selectedTenantSubject = new BehaviorSubject<Tenant | null>(null);
  public selectedTenant$ = this.selectedTenantSubject.asObservable();

  constructor(private auth0: Auth0Service) {}

  // 📌 Pobranie nagłówków z tokena
  getAuthHeaders(): Observable<HttpHeaders> {
    return this.auth0.getAccessTokenSilently().pipe(
      catchError((error) => {
        console.error('Błąd pobierania tokena:', error);
        if (
          error.error === 'login_required' ||
          error.error === 'consent_required'
        ) {
          this.auth0.loginWithRedirect();
          return throwError(() => new Error('Login required'));
        }
        return throwError(() => new Error('Nie udało się pobrać tokena'));
      }),
      switchMap((token) => {
        try {
          const decodedToken: any = jwtDecode(token);
          const defaultTenantId = decodedToken.tenant_id;
          const defaultCountry = decodedToken.country;

          return this.isAdmin$.pipe(
            take(1),
            switchMap((isAdmin) => {
              if (!isAdmin) {
                // 🧑‍💼 Zwykły użytkownik → dane z tokena
                const headers = new HttpHeaders()
                  .set('Authorization', `Bearer ${token}`)
                  .set('tenant-id', defaultTenantId)
                  .set('country', defaultCountry);
                return of(headers);
              }

              // 🛠 Admin → sprawdzamy, czy wybrał tenant z dropdowna
              return this.selectedTenant$.pipe(
                take(1),
                map((selectedTenant) => {
                  console.log('🟡 selectedTenant z dropdowna:', selectedTenant);  // 👈 ważne
                  console.log('🔵 defaultTenantId:', defaultTenantId);
                  console.log('🔵 defaultCountry:', defaultCountry);
                  const tenantIdToUse =
                    selectedTenant?.tenant_id || defaultTenantId;
                  const countryToUse =
                    selectedTenant?.country || defaultCountry;

                  const headers = new HttpHeaders()
                    .set('Authorization', `Bearer ${token}`)
                    .set('tenant-id', tenantIdToUse)
                    .set('country', countryToUse);

                  return headers;
                })
              );
            })
          );
        } catch (decodeError) {
          return throwError(() => new Error('Błąd dekodowania tokena'));
        }
      })
    );
  }

  getUser(): Observable<{ roles: string[]; country: string }> {
    return this.auth0.getAccessTokenSilently().pipe(
      map((token) => {
        const decodedToken: any = jwtDecode(token);
        return {
          roles: decodedToken['https://promogym.com/roles'] || [],
          country: decodedToken.country || '',
        };
      })
    );
  }

  checkIfAdmin(): void {
    this.auth0.getAccessTokenSilently().subscribe({
      next: (token) => {
        const decodedToken: any = jwtDecode(token);
        const roles = decodedToken['https://promogym.com/roles'] || [];
        const isAdmin = roles.includes('admin');
        this.isAdminSubject.next(isAdmin);
      },
      error: (err) => {
        console.error('Błąd podczas sprawdzania roli admina:', err);
        this.isAdminSubject.next(false);
      },
    });
  }

  setSelectedTenant(tenant: Tenant): void {
    this.selectedTenantSubject.next(tenant);
  }
}
