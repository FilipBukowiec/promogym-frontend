import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { Observable, throwError } from "rxjs";
import { Advertisement } from "../models/advertisement.model";
import { catchError, switchMap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AdvertisementService {
  private apiUrl = `${environment.apiUrl}/advertisement`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // 📌 Przesyłanie ogłoszenia
  uploadFile(file: File, languages?: string[]): Observable<Advertisement> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => {
        const formData = new FormData();
        formData.append("file", file);
        if (languages && languages.length > 0) {
          formData.append("languages", JSON.stringify(languages));
        }

        return this.http.post<Advertisement>(
          `${this.apiUrl}/upload`,
          formData,
          { headers }
        );
      }),
      catchError((error) => {
        console.error("Wystąpił błąd podczas przesyłania ogłoszenia: ", error);
        return throwError("Nie udało się przesłać ogłoszenia. Spróbuj ponownie.");
      })
    );
  }

  // 📌 Pobieranie ogłoszeń
  getAll(language?: string): Observable<Advertisement[]> {
    const url = language ? `${this.apiUrl}?language=${language}` : this.apiUrl;

    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Advertisement[]>(url, { headers }).pipe(
          catchError((error) => {
            console.error("Wystąpił błąd podczas pobierania ogłoszeń: ", error);
            return throwError("Nie udało się pobrać ogłoszeń. Spróbuj ponownie.");
          })
        )
      )
    );
  }

  // 📌 Usuwanie ogłoszenia
  delete(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
          catchError((error) => {
            console.error("Wystąpił błąd podczas usuwania ogłoszenia: ", error);
            return throwError("Nie udało się usunąć ogłoszenia. Spróbuj ponownie.");
          })
        )
      )
    );
  }

  // 📌 Przesuwanie ogłoszenia w górę
  moveUp(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {}, { headers }).pipe(
          catchError((error) => {
            console.error("Wystąpił błąd podczas przesuwania ogłoszenia w górę: ", error);
            return throwError("Nie udało się przesunąć ogłoszenia w górę. Spróbuj ponownie.");
          })
        )
      )
    );
  }

  // 📌 Przesuwanie ogłoszenia w dół
  moveDown(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {}, { headers }).pipe(
          catchError((error) => {
            console.error("Wystąpił błąd podczas przesuwania ogłoszenia w dół: ", error);
            return throwError("Nie udało się przesunąć ogłoszenia w dół. Spróbuj ponownie.");
          })
        )
      )
    );
  }

  // 📌 Aktualizacja kolejności ogłoszeń
  updateOrder(orders: { id: string; order: number }[]): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.apiUrl}/update-order`, orders, { headers }).pipe(
          catchError((error) => {
            console.error("Wystąpił błąd podczas aktualizacji kolejności ogłoszeń: ", error);
            return throwError("Nie udało się zaktualizować kolejności ogłoszeń. Spróbuj ponownie.");
          })
        )
      )
    );
  }

  // 📌 Obsługuje błędy
  private handleError(error: any) {
    console.error("An error occurred:", error);
    return throwError(error);
  }
}
