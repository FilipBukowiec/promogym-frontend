import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Settings } from '../models/settings.model'; // Zaimportuj modele
import { AuthService } from './auth.service';  // Zaimportuj AuthService
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}settings`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Pobieranie ustawień, jeśli nie ma to tworzymy domyślne
  getSettings(): Observable<Settings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get('tenant-id');
        console.log('tenant-id z nagłówków:', tenant_id);  // Logowanie tenant_id
        return this.http.get<Settings>(`${this.apiUrl}?tenant_id=${tenant_id}`, { headers });
      }),
      catchError((error) => {
        console.log('Błąd w pobieraniu ustawień:', error);
        if (error.status === 404) {
          return this.createDefaultSettings();
        }
        return this.handleError(error);
      })
    );
  }

  // Tworzenie domyślnych ustawień dla tenanta
  private createDefaultSettings(): Observable<Settings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get('tenant-id');
        const defaultSettings: Settings = {
          tenant_id: tenant_id || '',
          name: tenant_id || 'Default Name',
          selectedRadioStream: '',
          radioStreamList: [],
          footerVisibilityRules: [],
          pictureSlideDuration: 5,
          location: { type: 'Point', coordinates: [0, 0] },
        };

        return this.http.post<Settings>(this.apiUrl, defaultSettings, { headers });
      }),
      catchError(this.handleError)
    );
  }

  // Aktualizacja ustawień
  updateSettings(settings: Settings): Observable<Settings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get('tenant-id');
        const updatedSettings = { ...settings, tenant_id };
        return this.http.put<Settings>(this.apiUrl, updatedSettings, { headers });
      }),
      catchError(this.handleError)
    );
  }

  // Obsługa błędów
  private handleError(error: any): Observable<never> {
    console.error('An error occurred', error);
    throw error;
  }
}
