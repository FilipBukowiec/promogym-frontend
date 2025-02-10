import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getNews(): Observable<any[]> {
    // Uzyskujemy token w sposób cichy
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => {
        // Tworzymy nagłówek z tokenem
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        // Wysyłamy zapytanie HTTP z nagłówkiem
        return this.http.get<any[]>('http://localhost:3000/news', { headers });
      })
    );
  }
}
