import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';  
import { switchMap, catchError, tap } from 'rxjs/operators';
import { News } from '../models/news.model';  // Import modelu News

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/news';
  private newsSubject = new BehaviorSubject<News[]>([]); // Przechowuje aktualne newsy
  news$ = this.newsSubject.asObservable(); // Eksponujemy strumień newsów

  constructor(private http: HttpClient, private auth: AuthService) {
    this.refreshNews(); // Pobierz newsy od razu po starcie
  }

  // Pobiera newsy i aktualizuje newsSubject
  public refreshNews(): void {
    this.getNewsByTenant().subscribe({
      next: (news) => this.newsSubject.next(news),
      error: (error) => console.error('❌ Błąd pobierania newsów:', error),
    });
  }

  // Pobiera newsy dla danego tenant_id
  getNewsByTenant(): Observable<News[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<News[]>(this.apiUrl, { headers })),
      tap((news) => this.newsSubject.next(news)), // Aktualizacja newsSubject
      catchError(this.handleError)
    );
  }

  // Dodaje newsa i odświeża listę
  addNews(content: string): Observable<News> {
    return this.auth.getAuthHeaders().pipe( 
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.post<News>(this.apiUrl, payload, { headers });
      }),
      tap(() => this.refreshNews()), // Odśwież newsy po dodaniu
      catchError(this.handleError)
    );
  }

  // Aktualizuje treść newsa
  updateNews(id: string, content: string): Observable<News> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const payload = { content, tenant_id: headers.get('tenant-id') };
        return this.http.put<News>(`${this.apiUrl}/${id}`, payload, { headers });
      }),
      tap(() => this.refreshNews()), // Odśwież newsy po edycji
      catchError(this.handleError)
    );
  }

  // Usuwa newsa
  deleteNews(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })),
      tap(() => this.refreshNews()), // Odśwież newsy po usunięciu
      catchError(this.handleError)
    );
  }

  // Przesuwa newsa w górę
  moveNewsUp(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/${id}/move-up`, {}, { headers })),
      tap(() => this.refreshNews()), // Odśwież newsy po przesunięciu
      catchError(this.handleError)
    );
  }

  // Przesuwa newsa w dół
  moveNewsDown(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/${id}/move-down`, {}, { headers })),
      tap(() => this.refreshNews()), // Odśwież newsy po przesunięciu
      catchError(this.handleError)
    );
  }

  // Obsługa błędów
  private handleError(error: any): Observable<never> {
    console.error('❌ Wystąpił błąd:', error);
    throw error;
  }
}
