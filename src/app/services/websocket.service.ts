import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { BehaviorSubject, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { NewsService } from "./news.service";
import { MediaService } from "./media.service";
import { Tenant } from "../models/tenant.model";
import { environment } from "../../environments/environment";
import { UserSettingsService } from "./user-settings.service";
import { AdminSettingsService } from "./admin-settings.service";
import { DataService } from "./data.service";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private socket: Socket;
  private listenersAttached = false;

  // private mediaUpdateSubject = new BehaviorSubject<void>(null!);
  // mediaUpdate$ = this.mediaUpdateSubject.asObservable();

  constructor(
    private authService: AuthService,
    private newsService: NewsService,
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
    private adminSettingService: AdminSettingsService,
    private dataService: DataService
  ) {
    this.socket = io(environment.socketUrl, {
      path: environment.socketPath,
      transports: ["websocket"],
    });
    (window as any).socket = this.socket; // 👈 DODAJ TO 
  }

  connectSocket(): void {
    // console.log("👉 Próba połączenia z WebSocket:");
    // console.log("🌍 Host:", this.socket.io.opts.hostname);
    // console.log("🛣️ Path:", this.socket.io.opts.path);
    // console.log("⚡ Transports:", this.socket.io.opts.transports);
  console.log("🧩 WebSocketService → connectSocket() wywołane");

  if (this.listenersAttached) {
    console.log("⚠️ Słuchacze już podpięci – przerywam.");
    return;
  }


    this.socket.on("connect", () => {
      console.log("✅ Połączono z WebSocket!");
      console.log("🌐 Aktualny host:", this.socket.io.opts.hostname);
      console.log("🛣️ Aktualny path:", this.socket.io.opts.path);

      this.authService.getAuthHeaders().subscribe((headers) => {
        const tenantId = headers.get("tenant-id");
        if (tenantId) {
          console.log("📥 Dołączanie do pokoju dla tenant_id:", tenantId);
          this.socket.emit("joinTenant", tenantId);
        }
      });
      console.log("📥 Dołączanie do pokoju globalnego");
      this.socket.emit("joinGlobalRoom");
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Błąd połączenia z WebSocket:", err);
    });

    // Nasłuchiwanie na odpowiedź z backendu (aktualizacja newsów)
    this.socket.on("newsUpdate", (newsData) => {
      this.newsService.refreshNews();
    });

    this.socket.on("mediaUpdate", (mediaData) => {
      this.mediaService.refreshMedia();
    });

    this.socket.on("userSettingsUpdate", (settingsData) => {
      this.dataService.reloadRouterOutlet();
    });

    this.socket.on("globalSettingsUpdate", (settingsData) => {
      this.dataService.reloadRouterOutlet();
    });

       this.listenersAttached = true;
  }

  // Metoda wywołująca liveUpdate (w razie potrzeby)
  requestNewsUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get("tenant-id");
      if (tenantId) {
        this.socket.emit("newsLiveUpdate", tenantId);
      } else {
        console.error("Brak tenant_id w nagłówkach");
      }
    });
  }

  requestMediaUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get("tenant-id");
      if (tenantId) {
        this.socket.emit("mediaLiveUpdate", tenantId);
      } else {
        console.error("Brak tenant_id w nagłówkach");
      }
    });
  }

  changeRoomForTenant(oldTenant: Tenant | null, newTenant: Tenant): void {
    if (oldTenant && oldTenant.tenant_id !== newTenant.tenant_id) {
      console.log("📤 Leaving room:", oldTenant.tenant_id);
      this.socket.emit("leaveTenant", oldTenant.tenant_id);
    }

    console.log("📥 Joining room:", newTenant.tenant_id);
    this.socket.emit("joinTenant", newTenant.tenant_id);
  }

  requestUserSettingsUpdate(): void {
    this.authService.getAuthHeaders().subscribe((headers) => {
      const tenantId = headers.get("tenant-id");
      if (tenantId) {
        this.socket.emit("userSettingsLiveUpdate", tenantId);
      } else {
        console.error("Brak tenant_id w nagłówkach");
      }
    });
  }

  requestGlobalSettingsUpdate(): void {
    this.socket.emit("globalSettingsLiveUpdate");
  }
}
