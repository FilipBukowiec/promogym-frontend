import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Advertisement } from '../models/advertisement.model';

@Injectable({
  providedIn: 'root',
})
export class AdvertisementsService {
  private apiUrl = `${environment.apiUrl}advertisement`;

  constructor(private http: HttpClient) {}

  public uploadFile(file: File, countries: string[]): Observable<Advertisement> {
    const formData = new FormData();
    formData.append('file', file);
    if (countries && countries.length > 0) {
      formData.append('countries', JSON.stringify(countries));
    }
    return this.http.post<Advertisement>(`${this.apiUrl}/upload`, formData);
  }

  public getAdvertisements(country?: string): Observable<Advertisement[]> {
    const url = country ? `${this.apiUrl}/${country}` : this.apiUrl;
    return this.http.get<Advertisement[]>(url);
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  public moveUp(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {});
  }

  public moveDown(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {});
  }

  public updateOrder(orders: { id: string; order: number }[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/update-order`, orders);
  }

  public updateAdvertisement(id: string, updateData: Partial<{ countries: string[] }>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, updateData);
  }
}
