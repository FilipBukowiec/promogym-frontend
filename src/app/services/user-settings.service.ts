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

  // Pobranie ustawień użytkownika
  getSettings(): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        const authCountry = headers.get("country");

        return this.http
          .get<UserSettings>(`${this.apiUrl}?tenant_id=${tenant_id}`, {
            headers,
          })
          .pipe(
            tap((settings) => {
              if (settings.country !== (authCountry || "")) {
                console.log(
                  `Zmiana kraju: ${settings.country} -> ${authCountry}`
                );
                settings.country = authCountry ? authCountry : ""; // Zaktualizuj country na authCountry lub pusty ciąg

                // Teraz wywołujemy aktualizację ustawień
                this.updateSettings(settings).subscribe({
                  next: (updatedSettings) => {
                    console.log(
                      "Ustawienia zaktualizowane na serwerze:",
                      updatedSettings
                    );
                    this.settingsSubject.next(updatedSettings); // Uaktualniając Subject po zapisaniu
                  },
                  error: (error) => {
                    console.error("Błąd podczas aktualizacji ustawień:", error);
                  },
                });
              }

              // console.log("Pobrane ustawienia usera:", settings);
              this.settingsSubject.next(settings); // Upewnij się, że aktualizujesz Subject
            })
          );
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

  // Funkcja tworzenia domyślnych ustawień
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

  // Aktualizacja ogólnych ustawień
  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
        const country = headers.get("country");
        const updatedSettings = { ...settings, tenant_id, country }; // Przekazujemy zaktualizowane ustawienia
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

  // Obserwacja zmian w ustawieniach
  observeSettings(): Observable<UserSettings | null> {
    if (!this.settingsSubject.value) {
      console.warn("🔄 settingsSubject jest null, pobieram ustawienia...");
      return this.getSettings(); // Zwracaj Observable, aby `settings$` było zaktualizowane
    }
    return this.settings$;
  }
}
