import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, switchMap, take } from 'rxjs';
import { AdminSettingsService } from './admin-settings.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { AuthService } from '../auth/services/auth.service';
import { AdminSettings } from '../models/admin-settings.model';
import { UserSettingsService } from './user-settings.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private readonly router: Router,
    private readonly userSettingsService: UserSettingsService,
    private readonly adminSettings: AdminSettingsService,
    private readonly authService: AuthService
  ) {}

  private dataSubject = new BehaviorSubject<{ [key: string]: boolean }>({});
  data$ = this.dataSubject.asObservable();

  public updateData(newData: { [key: string]: boolean }): void {
    const currentData = this.dataSubject.getValue();
    this.dataSubject.next({ ...currentData, ...newData });
  }

  public reloadRouterOutlet(): void {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);

      this.loadInitialData();
    });
  }

  public loadInitialData() {
    combineLatest([this.userSettingsService.initSettings(), this.adminSettings.initSettings()]).pipe(take(1)).subscribe();
  }
}
