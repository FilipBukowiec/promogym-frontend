// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { BehaviorSubject, Observable } from 'rxjs';

// import { Settings } from '../models/settings.model';
// import { io, Socket } from 'socket.io-client';
// import { AuthService } from './auth.service'; // Importowanie AuthService
// import { TokenService } from './token.service';
// import { catchError, switchMap, tap } from 'rxjs/operators';
// import { throwError, of } from 'rxjs';
// import { environment } from '../../environments/environment';

// @Injectable({
//   providedIn: 'root',
// })
// export class SettingsService {
//   private apiUrl = `${environment.apiUrl}settings`;
//   private settingsSubject = new BehaviorSubject<Settings | null>(null);
//   private socket: Socket;

//   constructor(private http: HttpClient, private tokenService: TokenService) {
//     this.socket = io(`${environment.socketUrl}`, {
//       path: '/backend/socket.io', 
//     });

//     this.socket.on('connect', () => {
//       console.log('Socket.IO connected:', this.socket.id);
//     });

//     this.socket.on('settingsUpdated', (updatedSettings: Settings) => {
//       console.log('Received updated settings via socket:', updatedSettings);
//       this.settingsSubject.next(updatedSettings);
//     });

//     this.loadInitialSettings();
//   }

//   private loadInitialSettings(): void {
//     this.getSettings().subscribe(
//       (settings) => {
//         this.settingsSubject.next(settings);
//       },
//       (error) => console.error('Error loading initial settings', error)
//     );
//   }

//   getSettings(): Observable<Settings> {
//     const headers = this.tokenService.getAuthHeaders();
//     return this.http.get<Settings>(this.apiUrl, {});
//   }

//   saveSettings(settings: Settings): Observable<Settings> {
//     return this.tokenService.getAuthHeaders().pipe(
//       switchMap((headers) => {
//         return this.http.put<Settings>(this.apiUrl, settings, {
//           headers,
//           withCredentials: true,
//         });
//       }),
//       tap((response: Settings) => {
//         this.settingsSubject.next(response);
//       }),
//       catchError((error) => {
//         console.error('Error saving settings:', error);
//         return throwError(() => new Error('Failed to save settings'));
//       })
//     );
//   }

//   observeSettings(): Observable<Settings | null> {
//     return this.settingsSubject.asObservable();
//   }
// }
