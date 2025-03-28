import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TopMenuComponent } from "../top-menu/top-menu.component";

@Component({
  selector: "app-management",
  imports: [RouterModule, CommonModule, TopMenuComponent],
  templateUrl: "./management.component.html",
  styleUrl: "./management.component.scss",
})
export class ManagementComponent {}
