import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}contact`;

  constructor(private http: HttpClient) {}

  public sendContactForm(subject: string, message: string): Observable<unknown> {
    return this.http.post(this.apiUrl, { subject, message });
  }
}
