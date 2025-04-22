import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import { RouterModule, RouterOutlet } from "@angular/router";
import { TopMenuComponent } from "../top-menu/top-menu.component";
import { TenantChangeService } from "../../services/tenant-change.service";

@Component({
  selector: "app-management",
  imports: [RouterModule, CommonModule, TopMenuComponent],
  templateUrl: "./management.component.html",
  styleUrl: "./management.component.scss",
})
export class ManagementComponent implements AfterViewInit {
  @ViewChild(RouterOutlet) outlet!: RouterOutlet;

  constructor(private tenantChangeService: TenantChangeService) {}

  ngAfterViewInit() {
    this.tenantChangeService.tenantChanged$.subscribe(() => {
      const activeComponent = this.outlet.component as any;
      if (activeComponent && typeof activeComponent.onTenantChange === 'function') {
        activeComponent.onTenantChange(); // 👈 Wywołaj metodę w child komponencie
      }
    });
  }
}