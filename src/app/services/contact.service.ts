import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";
import { catchError, switchMap, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}contact`;

  constructor(private http: HttpClient, private auth:AuthService) {}

  sendContactForm(subject: string, message: string) {

    return this.auth.getAuthHeaders().pipe(
      switchMap((headers) => this.http.post(this.apiUrl, { subject, message }, {headers})
    ),
    catchError((error) => {
     console.error("❌ Błąd w ContactService:", error);
        return throwError(() => new Error("Wystąpił problem z wysyłką formularza kontaktowego."));
      })
    );
  }
}
