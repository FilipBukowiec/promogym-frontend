import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Media } from '../models/media.model';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LibraryService {
  private apiUrl = `${environment.apiUrl}library`;

  private mediaSubject = new BehaviorSubject<Media[]>([]);
  media$ = this.mediaSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  public uploadFile(file: File): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  public getFiles(): Observable<Media[]> {
    return this.http.get<Media[]>(this.apiUrl);
  }

  public deleteFile(id: string): Observable<Media[]> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(switchMap(() => this.getFiles()));
  }

  public moveFileUp(id: string): Observable<Media[]> {
    return this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {}).pipe(switchMap(() => this.getFiles()));
  }

  public moveFileDown(id: string): Observable<Media[]> {
    return this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {}).pipe(switchMap(() => this.getFiles()));
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
