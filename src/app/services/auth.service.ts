import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth0: Auth0Service) {}

  // 📌 Pobranie nagłówków z tokena
  getAuthHeaders(): Observable<HttpHeaders> {
    return this.auth0.getAccessTokenSilently().pipe(
      catchError((error) => {
        console.error('Błąd pobierania tokena:', error);
  
        if (error.error === 'login_required' || error.error === 'consent_required') {
          this.auth0.loginWithRedirect();
          return throwError(() => new Error('Login required'));
        }
  
        return throwError(() => new Error('Nie udało się pobrać tokena'));
      }),
      switchMap((token) => {
        try {
          const decodedToken: any = jwtDecode(token);
          const tenant_id = decodedToken.tenant_id;
  
          const headers = new HttpHeaders()
            .set('Authorization', `Bearer ${token}`)
            .set('tenant-id', tenant_id);
  
          return of(headers);
        } catch (decodeError) {
          return throwError(() => new Error('Błąd dekodowania tokena'));
        }
      })
    );
  }
}