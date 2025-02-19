import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth0: Auth0Service) {}

  // 📌 Pobranie nagłówków z tokena
  getAuthHeaders(): Observable<HttpHeaders> {
    return this.auth0.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const decodedToken: any = jwtDecode(token);
        const tenant_id = decodedToken.tenant_id;

        const headers = new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', tenant_id);

        return new Observable<HttpHeaders>((observer) => {
          observer.next(headers);
          observer.complete();
        });
      })
    );
  }
}
