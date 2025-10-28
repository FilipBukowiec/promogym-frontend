import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { Tenant } from '../../../models/tenant.model';
import { TenantChangeService } from '../../../services/tenant-change.service';
import { UserSettingsService } from '../../../services/user-settings.service';
import { WebSocketService } from '../../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-kiosk-settings',
  templateUrl: 'kiosk-settings.component.html',
  styleUrls: ['./kiosk-settings.component.scss'],
  imports: [CommonModule],
})
export class KioskSettingsComponent implements OnInit, OnDestroy {
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly authService = inject(AuthService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly tenantChangeService = inject(TenantChangeService);
  private readonly cookieService = inject(CookieService);
  private readonly onDestroy$ = new Subject();
  public tenants: Tenant[] = [];
  public selectedTenant: Tenant | null = null;

  public ngOnInit(): void {
    this.initSelectedTenant();
    this.initTenants();
  }

  private initSelectedTenant(): void {
    const tenant_id = localStorage.getItem('tenant_id');
    const country = localStorage.getItem('country');
    const tenant = { tenant_id, country };
    this.selectedTenant = tenant;
  }

  private initTenants(): void {
    this.userSettingsService
      .getAllTenants()
      .pipe(
        tap((tenants) => (this.tenants = tenants)),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  public onTenantChange(tenant: Tenant): void {
    const previousTenant = this.selectedTenant;

    this.selectedTenant = tenant;
    localStorage.setItem('tenant_id', tenant.tenant_id);
    localStorage.setItem('country', tenant.country);
    this.authService.dispatchCurrentTenant(tenant);

    this.webSocketService.changeRoomForTenant(previousTenant, tenant);
    this.tenantChangeService.notifyTenantChanged();
  }

  public ngOnDestroy(): void {
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
  }
}
