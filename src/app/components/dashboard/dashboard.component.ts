import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SideMenuComponent } from "../side-menu/side-menu.component";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { AdminSettings } from "../../models/admin-settings.model";
import { WebSocketService } from "../../services/websocket.service";
import { AuthService } from "../../services/auth.service";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-dashboard",
  imports: [CommonModule, RouterModule, SideMenuComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit {
  constructor(
    private auth: Auth0Service,
    private adminSettings: AdminSettingsService,
    private websocketService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.getAccessTokenSilently().subscribe((token) => {});
    this.adminSettings.getSettings().subscribe({
      next: (settings: AdminSettings) => {
        console.log("ustawienia", settings);
      },
    });

    this.authService.getUserInfo();

    this.websocketService.connectSocket();
  }
}
