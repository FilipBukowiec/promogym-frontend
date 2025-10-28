import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { combineLatest, filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { AuthService } from './auth/services/auth.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { UserSettingsService } from './services/user-settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly onDestroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly userSettingsService: UserSettingsService,
    private readonly adminSettings: AdminSettingsService,
    private readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.initSettings();
    this.initKioskMode();
  }

  private initKioskMode(): void {
    this.authService
      .isKiosk()
      .pipe(
        filter((isKiosk) => isKiosk),
        tap(() => this.router.navigate(['dashboard', 'start'])),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  private initSettings(): void {
    this.authService
      .initUserInfo()
      .pipe(
        take(1),
        switchMap(() => combineLatest([this.userSettingsService.initSettings(), this.adminSettings.initSettings()]))
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
  }
}
