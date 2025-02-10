import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-management",
  imports: [RouterModule, CommonModule],
  templateUrl: "./management.component.html",
  styleUrl: "./management.component.scss",
})
export class ManagementComponent {}
