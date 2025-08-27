import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Media } from '../models/media.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LibraryService {
  private apiUrl = `${environment.apiUrl}library`;

  private mediaSubject = new BehaviorSubject<Media[]>([]);
  media$ = this.mediaSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  uploadFile(file: File): Observable<Media> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Media>(`${this.apiUrl}/upload`, formData, {
          headers,
        });
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

  deleteFile(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      ),
      switchMap(() => this.getFiles()),
      catchError(this.handleError)
    );
  }

  moveFileUp(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {}, { headers })
      ),
      switchMap(() => this.getFiles()),
      catchError(this.handleError)
    );
  }

  moveFileDown(id: string): Observable<Media[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {}, { headers })
      ),
      switchMap(() => this.getFiles()),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Błąd w MediaService:', error);
    return throwError(
      () => new Error('Wystąpił problem z operacją na mediach.')
    );
  }

  public addTenant(tenantId: string, id: string): Observable<void | null> {
    return this.http.put<void | null>(`${this.apiUrl}/tenant/add`, {
      tenantId,
      id,
    });
  }

  public removeTenant(tenantId: string, id: string): Observable<void | null> {
    return this.http.put<void | null>(`${this.apiUrl}/tenant/remove`, {
      tenantId,
      id,
    });
  }

  public getLibraryByTenantId(tenantId: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/tenant/list/${tenantId}`);
  }
}
