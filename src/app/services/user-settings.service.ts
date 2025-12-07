import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { Tenant } from '../models/tenant.model';
import { UserSettings } from '../models/user-settings.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private apiUrl = `${environment.apiUrl}user-settings`;
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  settings$ = this.settingsSubject.asObservable().pipe(filter((settings) => !!settings));

  constructor(private http: HttpClient, private readonly authService: AuthService) {}

  public initSettings(): Observable<UserSettings> {
    return this.authService.selectCurrentTenant().pipe(
      distinctUntilChanged(),
      switchMap((currentTenant) => {
        return this.http.get<UserSettings>(`${this.apiUrl}`).pipe(
          tap((settings) => {
            if (settings.country !== currentTenant.country) {
              settings.country = currentTenant.country || '';
            }
            this.settingsSubject.next(settings);
          })
        );
      }),
      switchMap((settings) => this.updateSettings(settings)),
      tap((updatedSettings) => this.settingsSubject.next(updatedSettings)),
      catchError((error) => {
        if (error.status === 404) {
          return this.createDefaultSettings();
        }
        return throwError(() => error);
      })
    );
  }

  private createDefaultSettings(): Observable<UserSettings> {
    return this.authService.selectCurrentTenant().pipe(
      switchMap((currentTenant) => {
        const tenant_id = currentTenant.tenant_id;
        const country = currentTenant.country;
        const defaultSettings: UserSettings = {
          tenant_id: tenant_id || '',
          name: tenant_id || 'Default Name',
          language: 'ENG',
          country: country || '',
          selectedRadioStream: '',
          footerVisibilityRules: [],
          pictureSlideDuration: 15,
          logoFilePath: '',
          separatorFilePath: '',
          enableFacebookModule: false,
          selectedFacebookPage: null,
          facebookPageId: null,
          facebookPageAccess: null,
          facebookPageAdress: null
        };

        return this.http.post<UserSettings>(this.apiUrl, defaultSettings).pipe(tap((createdSettings) => this.settingsSubject.next(createdSettings)));
      })
    );
  }

  public updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.authService.selectCurrentTenant().pipe(
      take(1),
      switchMap((currentTenant) => {
        const tenant_id = currentTenant.tenant_id;
        const country = currentTenant.country;
        const updatedSettings = { ...settings, tenant_id, country };
        return this.http.put<UserSettings>(this.apiUrl, updatedSettings).pipe(tap((newSettings) => this.settingsSubject.next(newSettings)));
      })
    );
  }

  public uploadLogo(file: File, type: 'mainlogo' | 'separator'): Observable<UserSettings> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserSettings>(`${this.apiUrl}/upload/${type}`, formData, {});
  }

  public deleteLogo(type: 'mainlogo' | 'separator'): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/logo/${type}`);
  }

  public getAllTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`);
  }
}
