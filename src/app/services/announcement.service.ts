import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { Announcement } from '../models/announcement.model';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}announcements`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  public fetchAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl).pipe(catchError(() => of([])));
  }

  public getAnnouncement(id: string): Observable<Announcement | null> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }

  public createAnnouncement(formData: FormData): Observable<Announcement | null> {
    return this.http.post<Announcement>(this.apiUrl, formData).pipe(catchError(() => of(null)));
  }

  public updateAnnouncement(id: string, formData: FormData): Observable<Announcement | null> {
    return this.http.put<Announcement>(`${this.apiUrl}/${id}`, formData).pipe(catchError(() => of(null)));
  }

  public deleteAnnouncement(id: string): Observable<Announcement | null> {
    return this.http.delete<Announcement>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }
}
