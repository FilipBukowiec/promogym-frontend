import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';  
import { switchMap, catchError, tap } from 'rxjs/operators';
import { News } from '../models/news.model';  // Import modelu News
import { environment } from '../../environments/environment';
import { RetryHelperService } from './retry-helper.service';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private apiUrl = `${environment.apiUrl}news`;

  private newsSubject = new BehaviorSubject<News[]>([]); 
  news$ = this.newsSubject.asObservable(); 

  constructor(private http: HttpClient, private auth: AuthService,   private retryHelper: RetryHelperService) {

  }

  public refreshNews(): void {
    console.log('Wywołano refreshNews');
    this.getNewsByTenant().subscribe({
      next: (news) => this.newsSubject.next(news),
      error: (error) => console.error('❌ Błąd pobierania newsów:', error),
    });
  }

  getNewsByTenant(): Observable<News[]> {

    return this.retryHelper.withRetry( this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<News[]>(this.apiUrl, { headers })),
      catchError(this.handleError)
    ));
  }

  addNews(content: string): Observable<News> {
    return this.auth.getAuthHeaders().pipe( 
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.post<News>(this.apiUrl, payload, { headers });
      }),
      tap(() => this.refreshNews()), 
      catchError(this.handleError)
    );
  }

 
  updateNews(id: string, content: string): Observable<News> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.put<News>(`${this.apiUrl}/${id}`, payload, { headers });
      }),
      tap(() => this.refreshNews()), 
      catchError(this.handleError)
    );
  }

  deleteNews(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })),
      tap(() => this.refreshNews()), 
      catchError(this.handleError)
    );
  }

  moveNewsUp(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/${id}/move-up`, {}, { headers })),
      tap(() => this.refreshNews()), 
      catchError(this.handleError)
    );
  }

  moveNewsDown(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/${id}/move-down`, {}, { headers })),
      tap(() => this.refreshNews()), 
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Wystąpił błąd:', error);
    throw error;
  }
}
