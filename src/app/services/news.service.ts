import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';  
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/news';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getNewsByTenant(): Observable<any[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<any[]>(this.apiUrl, { headers })),
      catchError(this.handleError)
    );
  }

  addNews(content: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.post<any>(this.apiUrl, payload, { headers });
      }),
      catchError(this.handleError)
    );
  }

  updateNews(id: string, content: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.put<any>(`${this.apiUrl}/${id}`, payload, { headers });
      }),
      catchError(this.handleError)
    );
  }

  deleteNews(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<any>(`${this.apiUrl}/${id}`, { headers })),
      catchError(this.handleError)
    );
  }

  moveNewsUp(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<any>(`${this.apiUrl}/${id}/move-up`, {}, { headers })),
      catchError(this.handleError)
    );
  }

  moveNewsDown(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<any>(`${this.apiUrl}/${id}/move-down`, {}, { headers })),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred', error);
    throw error;
  }
}
