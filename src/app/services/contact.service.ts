import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}contact`;

  constructor(private http: HttpClient) {}

  sendContactForm(subject: string, message: string) {
    return this.http.post(this.apiUrl, { subject, message });
  }
}
