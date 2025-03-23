import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SideMenuComponent } from "../side-menu/side-menu.component";
import { AuthService } from "@auth0/auth0-angular";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { AdminSettings } from "../../models/admin-settings.model";
import { WebSocketService } from "../../services/websocket.service";

@Component({
  selector: "app-dashboard",
  imports: [CommonModule, RouterModule, SideMenuComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private adminSettings: AdminSettingsService,
    private websocketService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.auth.getAccessTokenSilently().subscribe((token) => {});
    this.adminSettings.getSettings().subscribe({
      next: (settings: AdminSettings) => {
        console.log("ustawienia",settings)
      },
    });

    this.websocketService.connectSocket();
  }


}
