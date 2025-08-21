import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { switchMap, take, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Advertisement } from '../../models/advertisement.model';
import { Media } from '../../models/media.model';
import { AdvertisementsService } from '../../services/advertisements.service';
import { AuthService } from '../../services/auth.service';
import { LibraryService } from '../../services/library.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { WebSocketService } from '../../services/websocket.service';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  selector: 'app-user-library',
  templateUrl: './user-library.component.html',
  styleUrls: ['./user-library.component.scss'],
})
export class UserLibraryComponent implements OnInit {
  mediaList: Media[] = [];
  libraryIdsByTenant: string[] = [];
  loading: boolean = true;
  error: string | null = null;
  isPremium: boolean = false;
  advertisementsList: Advertisement[] = [];

  constructor(
    private retryHelper: RetryHelperService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private advertisementsService: AdvertisementsService,
    private readonly libraryService: LibraryService
  ) {}

  ngOnInit(): void {
    this.loadMedia();

    this.authService.checkIfPremiumUser();

    this.authService.isPremium$.pipe(take(1)).subscribe((isPremium) => {
      this.isPremium = isPremium;
      if (!isPremium) {
        this.loadAdvertisementsForUserCountry();
      }
    });

    this.getLibraryIdByTenantId();
  }

  onTenantChange() {
    this.loadMedia();
  }

  // 📌 Pobieranie listy plików
  loadMedia(): void {
    this.loading = true;

    this.retryHelper.withRetry(this.libraryService.getFiles()).subscribe({
      next: (data) => {
        this.mediaList = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Błąd ładowania mediów:', err);
        this.error = 'Nie udało się załadować mediów.';
        this.loading = false;
      },
    });
  }

  // Pobieranie reklam dla kraju tenanta

  loadAdvertisementsForUserCountry(): void {
    this.loading = true;
    this.error = null;

    this.authService
      .getUserData()
      .pipe(
        take(1),
        switchMap((userData) => {
          const country = userData.country;
          return this.retryHelper.withRetry(
            this.advertisementsService.getAdvertisements(country)
          );
        })
      )
      .subscribe({
        next: (ads) => {
          this.advertisementsList = ads;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Błąd ładowania reklam:', err);
          this.error = 'Nie udało się załadować reklam.';
          this.loading = false;
        },
      });
  }

  // 📌 Generowanie pełnej ścieżki do pliku
  getFullFilePath(filePath: string): string {
    return `${environment.publicUrl}${filePath}`;
  }

  liveUpdate(): void {
    this.webSocketService.requestMediaUpdate();
  }

  private getLibraryIdByTenantId(): void {
    this.authService.userTenant$
      .pipe(
        switchMap((tenantId) =>
          this.libraryService.getLibraryByTenantId(tenantId)
        ),
        tap((data) => (this.libraryIdsByTenant = data.map((item) => item._id))),
        take(1)
      )
      .subscribe();
  }

  public addTenant(id: string): void {
    this.authService.userTenant$
      .pipe(
        switchMap((tenantId) => this.libraryService.addTenant(tenantId, id)),
        take(1)
      )
      .subscribe();
  }

  public removeTenant(id: string): void {
    this.authService.userTenant$
      .pipe(
        switchMap((tenantId) => this.libraryService.removeTenant(tenantId, id)),
        take(1)
      )
      .subscribe();
  }

  public toggleLibraryItem(item: Media, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.addTenant(item._id);
    } else {
      this.removeTenant(item._id);
    }
  }
}
