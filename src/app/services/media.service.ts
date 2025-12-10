import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, iif, Observable, of, zip } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { Advertisement } from '../models/advertisement.model';
import { Library } from '../models/library.model';
import { Media } from '../models/media.model';
import { FacebookStory } from '../models/facebook.model';
import { UserSettingsService } from './user-settings.service';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}media`;
  private apiUrl2 = `${environment.apiUrl}advertisement`;
  private apiUrl3 = `${environment.apiUrl}library`;
  private apiUrl4 = `${environment.apiUrl}facebook/stories/random`;

  private mediaSubject = new BehaviorSubject<Media[]>([]);
  media$ = this.mediaSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService, private readonly userSettingsService: UserSettingsService) {}

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
    let shouldFetchStories = false; 

    const premiumRequest$ = (tenantId: string, pageToken: string, pageId: string) => {
      const storiesRequest$ = shouldFetchStories ? this.http.post<FacebookStory[]>(`${this.apiUrl4}`, { pageToken, pageId }) : of([] as FacebookStory[]); 
      return zip([
        this.http.get<Media[]>(this.apiUrl), 
        storiesRequest$, 
        this.http.get<Library[]>(`${this.apiUrl3}/tenant/list/${tenantId}`), 
      ]).pipe(
        map(([media, stories, library]) => {
          const safeStories: FacebookStory[] = Array.isArray(stories) ? stories : stories ? [stories] : [];

          let currentOrder = 0; 

          const storiesAsMedia = safeStories.map((story) => ({
            ...(story as Media),
            tenant_id: 'default_tenant',
            isStory: true,
            order: (currentOrder += 1),
          }));

        
          const initialMediaOrder = currentOrder;
          let mediaCurrentOrder = initialMediaOrder;

          const mediaWithNewOrder = media.map((m) => ({
            ...m,
           
            order: mediaCurrentOrder++,
          })); 

          const libraryAsMedia = library.map((item) => ({
            ...(item as Media),
            tenant_id: 'default_tenant',
            order: (mediaCurrentOrder += 1),
          }));

        
          return [...storiesAsMedia, ...mediaWithNewOrder, ...libraryAsMedia].sort((a, b) => a.order - b.order);
        })
      );
    }; 

    const nonPremiumRequest$ = (tenantId: string, country: string, pageToken: string, pageId: string) => {
      const storiesRequest$ = shouldFetchStories ? this.http.post<FacebookStory[]>(`${this.apiUrl4}`, { pageToken, pageId }) : of([] as FacebookStory[]);
      return zip([
        this.http.get<Media[]>(this.apiUrl), 
        this.http.get<Advertisement[]>(`${this.apiUrl2}/${country}`), 
        storiesRequest$, 
        this.http.get<Library[]>(`${this.apiUrl3}/tenant/list/${tenantId}`), 
      ]).pipe(
        map(([media, ads, stories, library]) => {

          const safeStories: FacebookStory[] = Array.isArray(stories) ? stories : stories ? [stories] : [];

        
          let currentOrder = 0; 
          const storiesAsMedia = safeStories.map((story) => ({
            ...(story as Media),
            tenant_id: 'default_tenant',
            isStory: true,
            order: (currentOrder += 1),
          }));

      
          const initialMediaOrder = currentOrder;
          let mediaCurrentOrder = initialMediaOrder;

          const mediaWithNewOrder = media.map((m) => ({
            ...m,
           
            order: mediaCurrentOrder++,
          }));

          const adsAsMedia = ads.map((ad) => ({
            ...(ad as Media),
            tenant_id: 'default_tenant',
            order: (mediaCurrentOrder += 1),
          })); 

          const libraryAsMedia = library.map((item) => ({
            ...(item as Media),
            tenant_id: 'default_tenant',
            order: (mediaCurrentOrder += 1),
          }));

          return [...storiesAsMedia, ...mediaWithNewOrder, ...adsAsMedia, ...libraryAsMedia].sort((a, b) => a.order - b.order);
        })
      );
    }; 

    return combineLatest([this.auth.isPremiumUser(), this.auth.selectCurrentTenant(), this.userSettingsService.settings$.pipe(take(1))]).pipe(
      switchMap(([isPremium, currentTenant, settings]) => {
        const isModuleEnabled = settings.enableFacebookModule;
        const pageToken = settings.facebookPageAccess;
        const pageId = settings.facebookPageId;
        shouldFetchStories = isModuleEnabled && !!pageToken && !!pageId;
        return iif(
          () => isPremium,
          premiumRequest$(currentTenant.tenant_id, pageToken, pageId),
          nonPremiumRequest$(currentTenant.tenant_id, currentTenant.country, pageToken, pageId)
        );
      })
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
