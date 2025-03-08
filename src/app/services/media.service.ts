import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Media } from '../models/media.model';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}media`;

  constructor(private http: HttpClient, private auth: AuthService) {}

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

  // 📌 Pobieranie listy plików
  getFiles(): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<Media[]>(this.apiUrl, { headers })),
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
