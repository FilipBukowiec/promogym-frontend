import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, throwError } from 'rxjs';
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
  

  constructor(private http: HttpClient, private auth: AuthService, ) {}

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
      switchMap(({roles, country}) => {
        const isPremium = roles.includes('premium_user');
        console.log("kraj usera:", country)
          return this.auth.getAuthHeaders().pipe(
          switchMap((headers) => {
            if (isPremium) {
              // Dla premium usera, zwracamy tylko media
              return this.http.get<Media[]>(this.apiUrl, { headers });
            } else {
              // Zwykły użytkownik – pobieramy zarówno media, jak i reklamy
              return forkJoin({
                media: this.http.get<Media[]>(this.apiUrl, { headers }),
                ads: this.http.get<Advertisement[]>(`${this.apiUrl2}/${country}`, { headers }),
              }).pipe(
                map(({ media, ads }) => {
                  // Jeśli media są dostępne, pobieramy ostatni 'order'
                  const lastOrder = media.length > 0 ? Math.max(...media.map(item => item.order)) : 0;
  
                  // Mapujemy reklamy na Media, ustawiając order na ostatni media + 1
                  const adsAsMedia = ads.map((ad, index) => ({
                    ...ad,
                    tenant_id: 'default_tenant',  // Ustalamy domyślną wartość dla 'tenant_id'
                    order: lastOrder + index + 1,  // Ustalamy order dla reklamy, aby były na końcu
                  }));
  
                  // Łączymy tablicę media i ads
                  const combined = [...media, ...adsAsMedia];
  
                  // Sortujemy po 'order', aby zachować poprawną kolejność
                  return combined.sort((a, b) => a.order - b.order);
                })
              );
            }
          })
        );
      }),
      catchError(this.handleError)
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
