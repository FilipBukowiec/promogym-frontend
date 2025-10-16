import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FullscreenService } from '../../services/fullscreen.service';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { RadioStreamService } from '../../services/radio-stream.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { UserSettings } from '../../models/user-settings.model';
import { AuthService } from '../../auth/services/auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Tenant } from '../../models/tenant.model';
import { TenantChangeService } from '../../services/tenant-change.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements AfterViewInit {
  public readonly isAdmin$ = this.authService.isAdmin();
  isOnStartPage$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  shouldRefresh$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false); // <-- Zmienione na BehaviorSubject
  isFullscreen$: Observable<boolean>;
  isStreamPlaying$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  userSettings$: Observable<UserSettings | null>;
  // isAnnouncementPlaying$: Observable<boolean>;

  tenants: Tenant[] = [];
  selectedTenant: Tenant | null = null;

  constructor(
    private fullscreenService: FullscreenService,
    private router: Router,
    private dataService: DataService,
    public radioStreamService: RadioStreamService,
    private userSettingsService: UserSettingsService,
    private authService: AuthService,
    private auth0Service: Auth0Service,
    private tenantChangeService: TenantChangeService,
    private retryHelperService: RetryHelperService,
    private webSocketService: WebSocketService
  ) {
    this.userSettings$ = this.userSettingsService.settings$;
    this.isFullscreen$ = this.fullscreenService.isFullscreen$;

    // this.userSettings$ = this.userSettingsService.settings$;

    // this.isStreamPlaying$ = this.radioStreamService.isStreamPlaying$;
    // this.isAnnouncementPlaying$ = this.announcementService.isPlaying$;
  }

  ngOnInit(): void {
    this.retryHelperService
      .withRetry(this.userSettingsService.getAllTenants())
      .pipe(
        tap((tenants) => (this.tenants = tenants)),
        switchMap(() => this.userSettings$),
        tap((settings) => {
          if (settings?.tenant_id) {
            const matchingTenant = this.tenants.find((tenant) => tenant.tenant_id === settings.tenant_id);

            if (matchingTenant) {
              this.selectedTenant = matchingTenant;
              this.authService.dispatchCurrentTenant(matchingTenant);
              console.log('✅ Domyślny tenant ustawiony:', matchingTenant.tenant_id);
            } else {
              console.warn('⚠️ Tenant z ustawień nie znaleziony na liście');
            }
          }
        })
      )
      .subscribe();

    this.isOnStartPage$.next(this.router.url === '/dashboard/start');
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event: NavigationEnd) => event.url === '/dashboard/start')
      )
      .subscribe((isOnStart) => {
        this.isOnStartPage$.next(isOnStart);
      });

    this.userSettings$.pipe(take(1)).subscribe((settings) => {
      console.log('Załadowane ustawienia użytkownika:', settings);
    });
  }

  onTenantChange(newTenant: Tenant) {
    const previousTenant = this.selectedTenant;
    console.log('🟡 Poprzedni tenant:', previousTenant);
    console.log('🟢 Nowy tenant:', newTenant);

    this.selectedTenant = newTenant;
    this.authService.dispatchCurrentTenant(newTenant);

    this.webSocketService.changeRoomForTenant(previousTenant, newTenant);
    this.tenantChangeService.notifyTenantChanged();
  }

  ngAfterViewInit(): void {}

  toggleFullscreen(): void {
    this.fullscreenService.toggleFullscreen();
  }

  refreshComponents(componentKeys: string[]): void {
    const newData: { [key: string]: boolean } = {};
    componentKeys.forEach((key) => {
      newData[key] = false;
    });
    this.dataService.updateData(newData);
    setTimeout(() => {
      const updatedData: { [key: string]: boolean } = {};
      componentKeys.forEach((key) => {
        updatedData[key] = true;
      });
      this.dataService.updateData(updatedData);
    }, 100);
  }

  navigateToStart(): void {
    if (!this.isOnStartPage$) {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate(['dashboard/start']).then(() => {
        this.shouldRefresh$.next(true);
      });
    } else {
      if (this.shouldRefresh$) {
        this.shouldRefresh$.next;
      }
    }
  }

  onStartClick(event: MouseEvent): void {
    if (this.isOnStartPage$.value) {
      this.refreshComponents(['swiper', 'footer']);
      event.preventDefault();
    } else {
      this.navigateToStart();
    }
  }

  toggleRadioStream(): void {
    this.userSettings$.pipe(take(1)).subscribe((settings) => {
      if (settings?.selectedRadioStream) {
        if (this.radioStreamService.sideMenuAudio$.value) {
          // Jeśli radio gra → zatrzymujemy
          this.radioStreamService.stopRadioStream(this.radioStreamService.sideMenuAudio$);
        } else {
          // Jeśli nie gra → uruchamiamy
          this.radioStreamService.playRadioStream(settings.selectedRadioStream, this.radioStreamService.sideMenuAudio$, [
            this.radioStreamService.userSettingsAudio$,
            this.radioStreamService.adminSettingsAudio$,
          ]);
          console.log('Radyjko startuje:', settings.selectedRadioStream);
        }
      } else {
        console.error('❌ Brak ustawionego strumienia radiowego w ustawieniach użytkownika');
      }
    });
  }

  logout(): void {
    this.auth0Service.logout({
      logoutParams: { returnTo: document.location.origin },
    });
  }
}
