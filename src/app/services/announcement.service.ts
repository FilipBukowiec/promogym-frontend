import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, switchMap, of } from 'rxjs';
import { Announcement } from '../models/announcement.model';
import { AuthService } from './auth.service'; // Importujemy AuthService
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}announcements`;
  private announcementsSubject = new BehaviorSubject<Announcement[]>([]);
  announcements$ = this.announcementsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Pobranie listy ogłoszeń
  fetchAnnouncements(): void {
    this.authService.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.get<Announcement[]>(this.apiUrl, { headers });
      }),
      catchError((error) => {
        console.error('❌ Błąd podczas pobierania ogłoszeń:', error);
        return of([]); // W przypadku błędu zwróć pustą tablicę
      })
    ).subscribe(
      (announcements) => {
        console.log('📡 Pobieranie ogłoszeń z backendu:', announcements);
        this.announcementsSubject.next(announcements);
      }
    );
  }

  // Dodanie nowego ogłoszenia
  addAnnouncement(announcement: Announcement, file: File | null): Observable<Announcement> {
    const formData = this.createFormData(announcement, file);

    return this.authService.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.post<Announcement>(this.apiUrl, formData, { headers });
      }),
      catchError((error) => {
        console.error('❌ Błąd przy dodawaniu ogłoszenia:', error);
        return of({} as Announcement); // W przypadku błędu zwróć pusty obiekt
      })
    );
  }

  // Aktualizacja ogłoszenia
  updateAnnouncement(id: string, announcement: Announcement): Observable<Announcement> {
    return this.authService.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.put<Announcement>(`${this.apiUrl}/${id}`, announcement, { headers });
      }),
      catchError((error) => {
        console.error('❌ Błąd przy aktualizacji ogłoszenia:', error);
        return of({} as Announcement); // W przypadku błędu zwróć pusty obiekt
      })
    );
  }

  // Usuwanie ogłoszenia
  deleteAnnouncement(id: string): Observable<void> {
    return this.authService.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
      }),
      catchError((error) => {
        console.error('❌ Błąd przy usuwaniu ogłoszenia:', error);
        return of(); // W przypadku błędu zwróć nic
      })
    );
  }

  // Tworzenie obiektu FormData do przesłania ogłoszenia na serwer
  private createFormData(announcement: Announcement, file: File | null): FormData {
    const formData = new FormData();
    formData.append('description', announcement.description);
    formData.append('scheduleType', announcement.scheduleType);
    formData.append('scheduleOption', announcement.scheduleOption || '');
    formData.append('selectedDays', JSON.stringify(announcement.selectedDays || []));
    formData.append('selectedHours', JSON.stringify(announcement.selectedHours || []));
    formData.append('selectedMinutes', JSON.stringify(announcement.selectedMinutes || []));
    formData.append('scheduledTime', announcement.scheduledTime || '');

    if (file) {
      formData.append('file', file, file.name);
    }

    return formData;
  }
}
