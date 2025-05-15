import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SideMenuComponent } from "../side-menu/side-menu.component";
import { WebSocketService } from "../../services/websocket.service";
import { DataService } from "../../services/data.service";


@Component({
  selector: "app-dashboard",
  imports: [CommonModule, RouterModule, SideMenuComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit {
  constructor(
    private websocketService: WebSocketService,
    private dataService: DataService,
  ) { }

  ngOnInit(): void {
    this.dataService.loadInitialData();
    this.websocketService.connectSocket();
  }


}
