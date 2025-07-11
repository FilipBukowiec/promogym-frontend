import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { environment } from "../../environments/environment";
import { AdminSettings } from "../models/admin-settings.model";
import { AuthService } from "./auth.service";
import { switchMap, catchError, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AdminSettingsService {
  private apiUrl = `${environment.apiUrl}admin-settings`;
  private settingsSubject = new BehaviorSubject<AdminSettings | null>(null);
  settings$ = this.settingsSubject.asObservable(); 

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Pobranie ustawień administracyjnych
  getSettings(): Observable<AdminSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        console.log("📡 Wysyłane nagłówki dla GET:", headers);
        return this.http.get<AdminSettings>(this.apiUrl, { headers }).pipe(
          tap((settings) => {
            console.log("✅ Pobrane ustawienia administracyjne:", settings);
            this.settingsSubject.next(settings);
          })
        );
      }),
      catchError((error) => {
        if (error.status === 404) {
          console.warn("⚠️ Brak ustawień, tworzymy domyślne.");
          return this.createDefaultSettings(); 
        }
        console.error("❌ Błąd pobierania ustawień:", error);
        return throwError(() => error);
      })
    );
  }

  // Tworzenie domyślnych ustawień administracyjnych
  private createDefaultSettings(): Observable<AdminSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const tenant_id = headers.get("tenant-id");
             const defaultSettings: AdminSettings = {
          languages: ["pl", "eng"],
          countries: ["Poland"],
          radioStreamList: [{ url: "", description: "" }],
        };

        console.log("📦 Dane do wysłania:", defaultSettings); // Sprawdzenie danych

        return this.http
          .post<AdminSettings>(this.apiUrl, defaultSettings, { headers })
          .pipe(
            tap((createdSettings) => {
              console.log("✅ Utworzono domyślne ustawienia:", createdSettings);
              this.settingsSubject.next(createdSettings);
            })
          );
      }),
      catchError((error) => {
        console.error("❌ Błąd tworzenia domyślnych ustawień:", error);
        if (error.status) {
          console.error(`❌ Status HTTP: ${error.status}`);
        }
        if (error.message) {
          console.error(`❌ Wiadomość błędu: ${error.message}`);
        }
        return throwError(() => error);
      })
    );
  }

  // Aktualizacja ustawień administracyjnych
  updateSettings(settings: AdminSettings): Observable<AdminSettings> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        console.log("📡 Wysyłane nagłówki dla PUT:", headers); 
        return this.http
          .put<AdminSettings>(this.apiUrl, settings, { headers })
          .pipe(
            tap((updatedSettings) => {
              console.log("✅ Ustawienia zaktualizowane:", updatedSettings);
              this.settingsSubject.next(updatedSettings);
            })
          );
      }),
      catchError((error) => {
        console.error("❌ Błąd aktualizacji ustawień:", error);
        return throwError(() => error);
      })
    );
  }



}
