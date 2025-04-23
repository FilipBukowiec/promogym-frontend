import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { NewsService } from './news.service';
import { MediaService } from './media.service';
import { Tenant } from '../models/tenant.model

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  private mediaUpdateSubject = new BehaviorSubject<void>(null!);
  mediaUpdate$ = this.mediaUpdateSubject.asObservable();

  constructor(
    private authService: AuthService,
    private newsService: NewsService,
    private mediaService: MediaService,
  ) {
    this.socket = io('http://localhost:3000');
  }

  connectSocket(): void {
    this.socket.on('connect', () => {
      this.authService.getAuthHeaders().subscribe((headers) => {
        const tenantId = headers.get('tenant-id');
        if (tenantId) {
          console.log('Dołączanie do pokoju dla tenant_id:', tenantId);
          this.socket.emit('joinTenant', tenantId); // Dołączamy do pokoju
        }
      });
    });

    this.socket.on('connect_error', (err) => {
      console.error('Błąd połączenia z WebSocket:', err);
    });

    // Nasłuchiwanie na odpowiedź z backendu (aktualizacja newsów)
    this.socket.on('newsUpdate', (newsData) => {
      this.newsService.refreshNews(); 
    });

    this.socket.on('mediaUpdate', (mediaData) => {
  
      this.mediaService.refreshMedia(); 
    });
  }

  // Metoda wywołująca liveUpdate (w razie potrzeby)
  requestNewsUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get('tenant-id');
      if (tenantId) {
        this.socket.emit('newsLiveUpdate', tenantId);
      } else {
        console.error('Brak tenant_id w nagłówkach');
      }
    });
  }

  requestMediaUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get('tenant-id');
      if (tenantId) {
        this.socket.emit('mediaLiveUpdate', tenantId);
      } else {
        console.error('Brak tenant_id w nagłówkach');
      }
    });
  }

  changeRoomForTenant(oldTenant: Tenant | null, newTenant: Tenant): void {
    if (oldTenant && oldTenant.tenant_id !== newTenant.tenant_id) {
      console.log('📤 Leaving room:', oldTenant.tenant_id);
      this.socket.emit('leaveTenant', oldTenant.tenant_id);
    }

    console.log('📥 Joining room:', newTenant.tenant_id);
    this.socket.emit('joinTenant', newTenant.tenant_id);
  }
}
