import { Component, OnInit } from '@angular/core';
import { Advertisement } from '../../models/advertisement.model';
import { AuthService } from '../../services/auth.service';
import { AdvertisementsService } from '../../services/advertisements.service';
import { switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-advertisements',
  imports: [CommonModule],
  templateUrl: './user-advertisements.component.html',
  styleUrl: './user-advertisements.component.scss'
})
export class UserAdvertisementsComponent implements OnInit {
  advertisementsList: Advertisement[] = [];

  constructor(private authService: AuthService, private advertisementsService: AdvertisementsService) { }


  ngOnInit(): void {
    this.showAdsForTenantCountry();
  }

  showAdsForTenantCountry(): void {
    this.authService.selectedTenant$.pipe(switchMap(tenant => {
      if (tenant?.country) {
        return this.advertisementsService.getAdvertisements(tenant.country)
      }
      return [];

    })
    ).subscribe({
      next: ads => this.advertisementsList = ads,
      error: err => console.error("Błąd pobierania reklam", err)
    })
  }

  getFullFilePath(filePath: string): string {
    return `${environment.publicUrl}${filePath}`;
  }
}
