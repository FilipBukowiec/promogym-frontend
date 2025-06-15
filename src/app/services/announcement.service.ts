import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Announcement } from '../models/announcement.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}announcements`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // 📌 Pobieranie wszystkich ogłoszeń dla danego tenant-a
  fetchAnnouncements(): Observable<Announcement[]> {
    return this.authService.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Announcement[]>(this.apiUrl, { headers })
      ),
      catchError(error => {
        console.error('❌ Błąd pobierania ogłoszeń:', error);
        return of([]);
      })
    );
  }

  // 📌 Pobieranie jednego ogłoszenia
  getAnnouncement(id: string): Observable<Announcement | null> {
    return this.authService.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Announcement>(`${this.apiUrl}/${id}`, { headers })
      ),
      catchError(error => {
        console.error('❌ Błąd pobierania ogłoszenia:', error);
        return of(null as any);
      })
    );
  }

  // 📌 Tworzenie ogłoszenia (z plikiem)
  createAnnouncement(formData: FormData): Observable<Announcement | null> {
    return this.authService.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<Announcement>(this.apiUrl, formData, { headers })
      ),
      catchError(error => {
        console.error('❌ Błąd tworzenia ogłoszenia:', error);
        return of(null);
      })
    );
  }

  // 📌 Aktualizacja ogłoszenia (z plikiem)
  updateAnnouncement(id: string, formData: FormData): Observable<Announcement | null> {
    return this.authService.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<Announcement>(`${this.apiUrl}/${id}`, formData, { headers })
      ),
      catchError(error => {
        console.error('❌ Błąd aktualizacji ogłoszenia:', error);
        return of(null);
      })
    );
  }

  // 📌 Usuwanie ogłoszenia
  deleteAnnouncement(id: string): Observable<Announcement | null> {
    return this.authService.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<Announcement>(`${this.apiUrl}/${id}`, { headers })
      ),
      catchError(error => {
        console.error('❌ Błąd usuwania ogłoszenia:', error);
        return of(null);
      })
    );
  }
}
