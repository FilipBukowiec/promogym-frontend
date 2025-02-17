import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular'; // Importujemy AuthService z Auth0
import {jwtDecode} from 'jwt-decode'; // Dekodowanie JWT

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/news'; // Twój URL API do backendu

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Pobieranie newsów na podstawie tenant_id z tokenu JWT
  getNewsByTenant(): Observable<any[]> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        // Dekodujemy token, aby uzyskać tenant_id
        const decodedToken = this.decodeToken(token);
        const tenant_id = decodedToken.tenant_id; // Zakładając, że tenant_id jest w tokenie
        
        // Tworzymy nagłówek z tokenem
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        // Wysyłamy zapytanie HTTP z nagłówkiem i tenant_id
        return this.http.get<any[]>(`${this.apiUrl}?tenant_id=${tenant_id}`, { headers });
      })
    );
  }

  // Metoda do dodawania newsa
  addNews(content: string, order: number): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        // Dekodujemy token, aby uzyskać tenant_id
        const decodedToken = this.decodeToken(token);
        const tenant_id = decodedToken.tenant_id; // Zakładając, że tenant_id jest w tokenie
        
        // Tworzymy nagłówek z tokenem
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        // Tworzymy ciało zapytania do dodania newsa
        const newNews = {
          tenant_id: tenant_id, // Przypisujemy tenant_id
          content: content,
          order: order
        };
        
        // Wysyłamy zapytanie HTTP do backendu
        return this.http.post<any>(this.apiUrl, newNews, { headers });
      })
    );
  }

  // Dekodowanie tokenu JWT (przy pomocy jwt-decode)
  private decodeToken(token: string): any {
    return jwtDecode(token); // Zwróci cały obiekt dekodowany z JWT, w tym tenant_id
  }
}
