import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { combineLatest, switchMap, take } from 'rxjs';
import { AuthService } from './auth/services/auth.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { UserSettingsService } from './services/user-settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly userSettingsService: UserSettingsService,
    private readonly adminSettings: AdminSettingsService
  ) {}

  public ngOnInit(): void {
    this.initToken();
    this.initSettings();
  }

  private initToken(): void {
    this.authService.initToken().pipe(take(1)).subscribe();
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
}
