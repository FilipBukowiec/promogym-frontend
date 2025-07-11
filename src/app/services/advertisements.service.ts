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
export class AdvertisementsService {
  private apiUrl = `${environment.apiUrl}advertisement`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // 📌 Przesyłanie ogłoszenia
  uploadFile(file: File, countries: string[]): Observable<Advertisement> {
  return this.auth.getAuthHeaders().pipe(
    switchMap((headers) => {
      const formData = new FormData();
      formData.append("file", file);
      if (countries && countries.length > 0) {
        formData.append("countries", JSON.stringify(countries));
      }

      return this.http.post<Advertisement>(
        `${this.apiUrl}/upload`,
        formData,
        { headers }
      );
    }),
    catchError((error) => {
      console.error("Wystąpił błąd podczas przesyłania ogłoszenia: ", error);
      return throwError(
        "Nie udało się przesłać ogłoszenia. Spróbuj ponownie."
      );
    })
  );
}


  // 📌 Pobieranie ogłoszeń
  getAdvertisements(language?: string): Observable<Advertisement[]> {
    const url = language ? `${this.apiUrl}?language=${language}` : this.apiUrl;
  
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Advertisement[]>(url, { headers }).pipe(
          catchError((error) => {
            console.error("❌ Błąd podczas pobierania ogłoszeń: ", error);
            return throwError(() => new Error("Nie udało się pobrać ogłoszeń. Spróbuj ponownie."));
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
            return throwError(
              "Nie udało się usunąć ogłoszenia. Spróbuj ponownie."
            );
          })
        )
      )
    );
  }

  // 📌 Przesuwanie ogłoszenia w górę
  moveUp(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http
          .put<void>(`${this.apiUrl}/move-up/${id}`, {}, { headers })
          .pipe(
            catchError((error) => {
              console.error(
                "Wystąpił błąd podczas przesuwania ogłoszenia w górę: ",
                error
              );
              return throwError(
                "Nie udało się przesunąć ogłoszenia w górę. Spróbuj ponownie."
              );
            })
          )
      )
    );
  }

  // 📌 Przesuwanie ogłoszenia w dół
  moveDown(id: string): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http
          .put<void>(`${this.apiUrl}/move-down/${id}`, {}, { headers })
          .pipe(
            catchError((error) => {
              console.error(
                "Wystąpił błąd podczas przesuwania ogłoszenia w dół: ",
                error
              );
              return throwError(
                "Nie udało się przesunąć ogłoszenia w dół. Spróbuj ponownie."
              );
            })
          )
      )
    );
  }

  // 📌 Aktualizacja kolejności ogłoszeń
  updateOrder(orders: { id: string; order: number }[]): Observable<void> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http
          .put<void>(`${this.apiUrl}/update-order`, orders, { headers })
          .pipe(
            catchError((error) => {
              console.error(
                "Wystąpił błąd podczas aktualizacji kolejności ogłoszeń: ",
                error
              );
              return throwError(
                "Nie udało się zaktualizować kolejności ogłoszeń. Spróbuj ponownie."
              );
            })
          )
      )
    );
  }

  updateAdvertisement(id: string, updateData: Partial<{ countries: string[] }>): Observable<any> {
    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) =>        
    this.http.patch(`${this.apiUrl}/${id}`, updateData, {headers})
    ),
    catchError((error) => {
      console.error("Wystąpił błąd podczas aktualizacji ogłoszenia: ", error);
      return throwError("Nie udało się zaktualizować ogłoszenia. Spróbuj ponownie.");
    })
  );

}



  // 📌 Obsługuje błędy
  private handleError(error: any) {
    console.error("An error occurred:", error);
    return throwError(error);
  }
}
