import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';  
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = 'http://localhost:3000/media';

  constructor(private http: HttpClient, private auth: AuthService) {}

  uploadFile(file: File): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload`, formData, { headers });
      }),
      catchError(this.handleError)
    );
  }

  getFiles(): Observable<any[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<any[]>(this.apiUrl, { headers })),
      catchError(this.handleError)
    );
  }

  deleteFile(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete(`${this.apiUrl}/${id}`, { headers })),
      switchMap(() => this.getFiles()), // Po usunięciu pliku ładujemy zaktualizowaną listę
      catchError(this.handleError)
    );
  }

  moveFileUp(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put(`${this.apiUrl}/move-up/${id}`, {}, { headers })),
      catchError(this.handleError)
    );
  }

  moveFileDown(id: string): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.put(`${this.apiUrl}/move-down/${id}`, {}, { headers })),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Błąd:', error);
    throw error;
  }
}
