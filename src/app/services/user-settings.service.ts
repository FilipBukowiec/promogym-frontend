import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { environment } from "../../environments/environment";
import { UserSettings } from "../models/user-settings.model";
import { AuthService } from "./auth.service";
import { switchMap, catchError, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class UserSettingsService {
  private apiUrl = `${environment.apiUrl}user-settings`;
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  settings$ = this.settingsSubject.asObservable(); // Eksponujemy jako Observable

  constructor(private http: HttpClient, private auth: AuthService) {}

  getSettings(): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        return this.http.get<UserSettings>(
          `${this.apiUrl}?tenant_id=${tenant_id}`,
          { headers }
        );
      }),
      tap((settings) => {
        this.settingsSubject.next(settings); // Upewnij się, że aktualizujesz Subject
      }),
      catchError((error) => {
        if (error.status === 404) {
          // Jeśli nie znaleziono ustawień, tworzę domyślne.
          return this.createDefaultSettings(); // Tworzymy domyślne ustawienia
        }
        return throwError(() => error); // W przeciwnym razie przekazujemy błąd
      })
    );
  }

  private createDefaultSettings(): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        const defaultSettings: UserSettings = {
          tenant_id: tenant_id || "",
          name: tenant_id || "Default Name",
          language: "ENG",
          selectedRadioStream: "",
          radioStreamList: [],
          footerVisibilityRules: [],
          pictureSlideDuration: 15,
          location: { type: "Point", coordinates: [0, 0] },
        };

        return this.http
          .post<UserSettings>(this.apiUrl, defaultSettings, { headers })
          .pipe(
            tap((createdSettings) => this.settingsSubject.next(createdSettings)) // Aktualizujemy Subject
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
        const updatedSettings = { ...settings, tenant_id };
        return this.http
          .put<UserSettings>(this.apiUrl, updatedSettings, { headers })
          .pipe(
            tap((newSettings) => this.settingsSubject.next(newSettings)) // Aktualizujemy Subject
          );
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
      return this.getSettings(); // Zwracaj Observable, aby `settings$` było zaktualizowane
    }
    return this.settings$;
  }
}
