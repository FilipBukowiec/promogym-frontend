import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Media } from '../models/media.model';
import { Advertisement } from '../models/advertisement.model';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}media`;
  private apiUrl2 = `${environment.apiUrl}advertisement`;

  private mediaSubject = new BehaviorSubject<Media[]>([]);
  media$ = this.mediaSubject.asObservable();
  
  

  constructor(private http: HttpClient, private auth: AuthService, ) {}

  refreshMedia(){
    this.getFilesForSwiper().subscribe({
      next: (media) => this.mediaSubject.next(media),
      error: (error) => console.error('❌ Błąd pobierania mediów:', error),
  
    })}
    

  // 📌 Przesyłanie pliku
  uploadFile(file: File): Observable<Media> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Media>(`${this.apiUrl}/upload`, formData, { headers });
      }),
      catchError(this.handleError)
    );
  }

  getFiles(): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<Media[]>(this.apiUrl, { headers })),
      catchError(this.handleError)
    );
  }

getFilesForSwiper(): Observable<Media[]> {
  return this.auth.getUser().pipe(
    switchMap(({ roles, country }) => {
      const isPremium = roles.includes('premium_user');
      return this.auth.getAuthHeaders().pipe(
        switchMap((headers) => {
          if (isPremium) {
            return this.http.get<Media[]>(this.apiUrl, { headers });
          } else {
            return forkJoin({
              media: this.http.get<Media[]>(this.apiUrl, { headers }),
              ads: this.http.get<Advertisement[]>(`${this.apiUrl2}/${country}`, { headers }),
            }).pipe(
              map(({ media, ads }) => {
                const lastOrder = media.length > 0 ? Math.max(...media.map(item => item.order)) : 0;
                const adsAsMedia = ads.map((ad, index) => ({
                  ...ad,
                  tenant_id: 'default_tenant',
                  order: lastOrder + index + 1,
                }));
                return [...media, ...adsAsMedia].sort((a, b) => a.order - b.order);
              })
            );
          }
        })
      );
    })
    // 👇 NIE dawaj tutaj catchError – bo RetryHelper nie zadziała!
  );
}

  

  // 📌 Usuwanie pliku
  deleteFile(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })), 
      switchMap(() => this.getFiles()), // Po usunięciu odświeżamy listę
      catchError(this.handleError)
    );
  }

  // 📌 Przesunięcie pliku w górę
  moveFileUp(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {}, { headers })),
      switchMap(() => this.getFiles()), // Odświeżamy listę po przesunięciu
      catchError(this.handleError)
    );
  }

  // 📌 Przesunięcie pliku w dół
  moveFileDown(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {}, { headers })),
      switchMap(() => this.getFiles()), // Odświeżamy listę po przesunięciu
      catchError(this.handleError)
    );
  }

  // 📌 Obsługa błędów
  private handleError(error: any): Observable<never> {
    console.error('Błąd w MediaService:', error);
    return throwError(() => new Error('Wystąpił problem z operacją na mediach.'));
  }
}
