import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminSettings } from '../models/admin-settings.model';
import { AuthService } from '../auth/services/auth.service';
import { switchMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminSettingsService {
  private apiUrl = `${environment.apiUrl}admin-settings`;
  private settingsSubject = new BehaviorSubject<AdminSettings | null>(null);
  settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Pobranie ustawień administracyjnych
  public initSettings(): Observable<AdminSettings> {
    return this.http.get<AdminSettings>(this.apiUrl).pipe(
      tap((settings) => {
        this.settingsSubject.next(settings);
      }),
      catchError((error) => {
        if (error.status === 404) {
          console.warn('⚠️ Brak ustawień, tworzymy domyślne.');
          return this.createDefaultSettings();
        }
        console.error('❌ Błąd pobierania ustawień:', error);
        return throwError(() => error);
      })
    );
  }

  // Tworzenie domyślnych ustawień administracyjnych
  private createDefaultSettings(): Observable<AdminSettings> {
    const defaultSettings: AdminSettings = {
      languages: ['pl', 'eng'],
      countries: ['Poland'],
      radioStreamList: [{ url: '', description: '' }],
    };
    return this.http.post<AdminSettings>(this.apiUrl, defaultSettings).pipe(
      tap((createdSettings) => {
        this.settingsSubject.next(createdSettings);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  // Aktualizacja ustawień administracyjnych
  public updateSettings(settings: AdminSettings): Observable<AdminSettings> {
    return this.http.put<AdminSettings>(this.apiUrl, settings).pipe(
      tap((updatedSettings) => this.settingsSubject.next(updatedSettings)),
      catchError((error) => throwError(() => error))
    );
  }
}
