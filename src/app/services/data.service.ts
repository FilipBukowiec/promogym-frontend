import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AdminSettingsService } from './admin-settings.service';
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { AuthService } from './auth.service';
import { AdminSettings } from '../models/admin-settings.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(private router: Router,
    private auth: Auth0Service,
    private adminSettings: AdminSettingsService,
    private authService: AuthService
  ) { }

  private dataSubject = new BehaviorSubject<{ [key: string]: boolean }>({});
  data$ = this.dataSubject.asObservable();

  updateData(newData: { [key: string]: boolean }): void {
    const currentData = this.dataSubject.getValue();
    this.dataSubject.next({ ...currentData, ...newData });
  }





  reloadRouterOutlet(): void {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);

      this.loadInitialData();
    })
  }



  public loadInitialData() {
    this.auth.getAccessTokenSilently().subscribe(() => { });
    this.adminSettings.getSettings().subscribe({
      next: (settings: AdminSettings) => {
        console.log("ustawienia", settings);
      },
    });
    this.authService.getUserInfo();
  }



}
