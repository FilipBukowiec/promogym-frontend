import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { BehaviorSubject, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { NewsService } from "./news.service";
import { MediaService } from "./media.service";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private socket: Socket;

  private mediaUpdateSubject = new BehaviorSubject<void>(null!);
  mediaUpdate$ = this.mediaUpdateSubject.asObservable();

  constructor(
    private authService: AuthService,
    private newsService: NewsService
  ) {
    this.socket = io("http://localhost:3000");
  }

  connectSocket(): void {
    this.socket.on("connect", () => {
      this.authService.getAuthHeaders().subscribe((headers) => {
        const tenantId = headers.get("tenant-id");
        if (tenantId) {
          console.log("Dołączanie do pokoju dla tenant_id:", tenantId);
          this.socket.emit("joinTenant", tenantId); // Dołączamy do pokoju
        }
      });
    });

    this.socket.on("connect_error", (err) => {
      console.error("Błąd połączenia z WebSocket:", err);
    });

    // Nasłuchiwanie na odpowiedź z backendu (aktualizacja newsów)
    this.socket.on("newsUpdate", (newsData) => {
      console.log(
        "Otrzymano dane z WebSocket - aktualizacja newsów:",
        newsData
      );
      this.newsService.refreshNews(); // Odświeżanie newsów
    });

    this.socket.on("mediaUpdate", (mediaData) => {
      console.log("Otrzymano dane z WebSocket - aktualizacja media", mediaData);
      this.mediaUpdateSubject.next();
    });
  }

  // Metoda wywołująca liveUpdate (w razie potrzeby)
  requestNewsUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get("tenant-id");
      if (tenantId) {
        console.log("Wysyłanie zapytania live update dla tenant_id:", tenantId);

        // Wysyłamy zapytanie o aktualizację newsów
        this.socket.emit("newsLiveUpdate", tenantId);
      } else {
        console.error("Brak tenant_id w nagłówkach");
      }
    });
  }

  requestMediaUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get('tenant-id');
      if (tenantId) {
        console.log('Wysyłanie zapytania live update dla tenant_id:', tenantId);
        this.socket.emit('mediaLiveUpdate', tenantId);
      } else {
        console.error('Brak tenant_id w nagłówkach');
      }
    });
  }
}
