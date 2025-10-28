import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { News } from '../models/news.model'; // Import modelu News

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private apiUrl = `${environment.apiUrl}news`;

  private newsSubject = new BehaviorSubject<News[]>([]);
  news$ = this.newsSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  public refreshNews(): Observable<News[]> {
    return this.getNewsByTenant().pipe(tap((news) => this.newsSubject.next(news)));
  }

  public getNewsByTenant(): Observable<News[]> {
    return this.http.get<News[]>(this.apiUrl);
  }

  public addNews(content: string): Observable<News> {
    return this.auth.selectCurrentTenant().pipe(
      switchMap((currentTenant) => {
        const payload = { content, tenant_id: currentTenant.tenant_id };
        return this.http.post<News>(this.apiUrl, payload);
      })
    );
  }

  public updateNews(id: string, content: string): Observable<News> {
    return this.auth.selectCurrentTenant().pipe(
      switchMap((currentTenant) => {
        const payload = { content, tenant_id: currentTenant.tenant_id };
        return this.http.put<News>(`${this.apiUrl}/${id}`, payload);
      }),
      tap(() => this.refreshNews())
    );
  }

  public deleteNews(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.refreshNews()));
  }

  public moveNewsUp(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/move-up`, {}).pipe(tap(() => this.refreshNews()));
  }

  public moveNewsDown(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/move-down`, {}).pipe(tap(() => this.refreshNews()));
  }
}
