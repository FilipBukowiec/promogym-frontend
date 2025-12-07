import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, iif, Observable, zip } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { Advertisement } from '../models/advertisement.model';
import { Library } from '../models/library.model';
import { Media } from '../models/media.model';
import { FacebookStory } from '../models/facebook.model';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}media`;
  private apiUrl2 = `${environment.apiUrl}advertisement`;
  private apiUrl3 = `${environment.apiUrl}library`;
  private apiUrl4 = `${environment.apiUrl}stories`

  private mediaSubject = new BehaviorSubject<Media[]>([]);
  media$ = this.mediaSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  public refreshMedia(): Observable<Media[]> {
    return this.getFilesForSwiper().pipe(tap((media) => this.mediaSubject.next(media)));
  }

  public uploadFile(file: File): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  public getFiles(): Observable<Media[]> {
    return this.http.get<Media[]>(this.apiUrl);
  }

  public getFilesForSwiper(): Observable<Media[]> {
    const premiumRequest$ = (tenantId: string) =>
      zip([
        this.http.get<Library[]>(`${this.apiUrl3}/tenant/list/${tenantId}`), 
        this.http.get<Media[]>(this.apiUrl)]).pipe(
        map(([media, library]) => {
          const lastOrder = media.length > 0 ? Math.max(...media.map((item) => item.order)) : 0;
          const libraryAsMedia = library.map((item, index) => ({
            ...item,
            tenant_id: 'default_tenant',
            order: lastOrder + index + 1,
          }));
          return [...media, ...libraryAsMedia].sort((a, b) => a.order - b.order);
        })
      );
    const nonPremiumRequest$ = (tenantId: string, country: string) =>
      zip([
        // tu chce dodać stories
        this.http.get<Library[]>(`${this.apiUrl3}/tenant/list/${tenantId}`),
        this.http.get<Media[]>(this.apiUrl),
        this.http.get<Advertisement[]>(`${this.apiUrl2}/${country}`),
      ]).pipe(
        map(([media, ads, library]) => {
          const lastOrder = media.length > 0 ? Math.max(...media.map((item) => item.order)) : 0;
          const adsAsMedia = ads.map((ad, index) => ({
            ...ad,
            tenant_id: 'default_tenant',
            order: lastOrder + index + 1,
          }));
          const libraryAsMedia = library.map((item, index) => ({
            ...item,
            tenant_id: 'default_tenant',
            order: media.length + ads.length + index + 1,
          }));
          return [...media, ...adsAsMedia, ...libraryAsMedia].sort((a, b) => a.order - b.order);
        })
      );

    return combineLatest([this.auth.isPremiumUser(), this.auth.selectCurrentTenant()]).pipe(
      switchMap(([isPremium, currentTenant]) =>
        iif(() => isPremium, premiumRequest$(currentTenant.tenant_id), nonPremiumRequest$(currentTenant.tenant_id, currentTenant.country))
      )
    );
  }

  public deleteFile(id: string): Observable<Media[]> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(switchMap(() => this.getFiles()));
  }

  public moveFileUp(id: string): Observable<Media[]> {
    return this.http.put<void>(`${this.apiUrl}/move-up/${id}`, {}).pipe(switchMap(() => this.getFiles()));
  }

  public moveFileDown(id: string): Observable<Media[]> {
    return this.http.put<void>(`${this.apiUrl}/move-down/${id}`, {}).pipe(switchMap(() => this.getFiles()));
  }
}
