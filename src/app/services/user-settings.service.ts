import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { environment } from "../../environments/environment";
import { UserSettings } from "../models/user-settings.model";
import { AuthService } from "./auth.service";
import { switchMap, catchError, tap } from "rxjs/operators";
import { Tenant } from "../models/tenant.model";
import { RetryHelperService } from "./retry-helper.service";

@Injectable({
  providedIn: "root",
})
export class UserSettingsService {
  private apiUrl = `${environment.apiUrl}user-settings`;
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  settings$ = this.settingsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private retryHelper: RetryHelperService,
  ) {}

  getSettings(): Observable<UserSettings> {
    return this.retryHelper.withRetry(
      this.auth.getAuthHeaders().pipe(
        switchMap((headers) => {
          return this.http
            .get<UserSettings>(`${this.apiUrl}`, { headers })
            .pipe(
              tap((settings) => {
                if (settings.country !== headers.get("country")) {
                  console.log(
                    `Zmiana kraju: ${settings.country} -> ${headers.get(
                      "country"
                    )}`
                  );
                  settings.country = headers.get("country") || "";

                  this.updateSettings(settings).subscribe({
                    next: (updatedSettings) => {
                      console.log(
                        "Ustawienia zaktualizowane na serwerze:",
                        updatedSettings
                      );
                      this.settingsSubject.next(updatedSettings);
                    },
                    error: (error) => {
                      console.error(
                        "Błąd podczas aktualizacji ustawień:",
                        error
                      );
                    },
                  });
                }

                this.settingsSubject.next(settings);
              })
            );
        }),
        catchError((error) => {
          if (error.status === 404) {
            return this.createDefaultSettings();
          }
          return throwError(() => error);
        })
      )
    );
  }

  private createDefaultSettings(): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        const country = headers.get("country");
        const defaultSettings: UserSettings = {
          tenant_id: tenant_id || "",
          name: tenant_id || "Default Name",
          language: "ENG",
          country: country || "",
          selectedRadioStream: "",
          footerVisibilityRules: [],
          pictureSlideDuration: 15,
          logoFilePath: "",
          separatorFilePath: "",
        };

        return this.http
          .post<UserSettings>(this.apiUrl, defaultSettings, { headers })
          .pipe(
            tap((createdSettings) => this.settingsSubject.next(createdSettings))
          );
      }),
      catchError((error) => {
        console.error("Błąd tworzenia domyślnych ustawień:", error);
        return throwError(() => error);
      })
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        const country = headers.get("country");
        const updatedSettings = { ...settings, tenant_id, country };
        return this.http
          .put<UserSettings>(this.apiUrl, updatedSettings, { headers })
          .pipe(tap((newSettings) => this.settingsSubject.next(newSettings)));
      }),
      catchError((error) => {
        console.error("Błąd aktualizacji ustawień:", error);
        return throwError(() => error);
      })
    );
  }

  observeSettings(): Observable<UserSettings | null> {
    if (!this.settingsSubject.value) {
      console.warn("🔄 settingsSubject jest null, pobieram ustawienia...");
      return this.getSettings();
    }
    return this.settings$;
  }

  uploadLogo(
    file: File,
    type: "mainlogo" | "separator"
  ): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const formData = new FormData();
        formData.append("file", file);
        return this.http
          .post<UserSettings>(`${this.apiUrl}/upload/${type}`, formData, {
            headers,
          })
          .pipe(
            tap((updatedSettings) => {
              this.settingsSubject.next(updatedSettings);
            })
          );
      }),
      catchError((error) => {
        console.error(`Błąd uploadu logo (${type}):`, error);
        return throwError(() => error);
      })
    );
  }

  deleteLogo(type: "mainlogo" | "separator"): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http
          .delete<void>(`${this.apiUrl}/logo/${type}`, { headers })
          .pipe(
            tap(() => {
              this.getSettings().subscribe();
            })
          );
      }),
      catchError((error) => {
        console.error(`Błąd usuwania logo (${type}):`, error);
        return throwError(() => error);
      })
    );
  }

  getAllTenants(): Observable<Tenant[]> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`, { headers });
      }),
      catchError((error) => {
        console.error("Błąd pobierania listy tenantów:", error);
        return throwError(() => error);
      })
    );
  }


}
