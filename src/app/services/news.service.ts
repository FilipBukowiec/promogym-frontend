import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';  // Zakładając, że używasz oficjalnego pakietu Auth0
import { catchError, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/news';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders(): Observable<HttpHeaders> {
    return this.auth.getAccessTokenSilently().pipe(
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

  

  /// Pobieranie newsów
  getNewsByTenant(): Observable<any[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<any[]>(this.apiUrl, { headers }).pipe(catchError(this.handleError)))
    );
  }

  // Dodawanie newsa
  addNews(content: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.post<any>(this.apiUrl, payload, { headers }).pipe(catchError(this.handleError));
      })
    );
  }

  // Edytowanie newsa
  updateNews(id: string, content: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.put<any>(`${this.apiUrl}/${id}`, payload, { headers }).pipe(catchError(this.handleError));
      })
    );
  }

  // Usuwanie newsa
  deleteNews(id: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<any>(`${this.apiUrl}/${id}`, { headers }).pipe(catchError(this.handleError)))
    );
  }

  // Przesuwanie newsa w górę
  moveNewsUp(id: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<any>(`${this.apiUrl}/${id}/move-up`, {}, { headers }).pipe(catchError(this.handleError)))
    );
  }

  // Przesuwanie newsa w dół
  moveNewsDown(id: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<any>(`${this.apiUrl}/${id}/move-down`, {}, { headers }).pipe(catchError(this.handleError)))
    );
  }

  // Obsługa błędów
  private handleError(error: any): Observable<never> {
    console.error('An error occurred', error);
    throw error;
  }
}