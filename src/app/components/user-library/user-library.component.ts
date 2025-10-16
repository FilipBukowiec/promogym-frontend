import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, Subject, switchMap, take, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Advertisement } from '../../models/advertisement.model';
import { Media } from '../../models/media.model';
import { AdvertisementsService } from '../../services/advertisements.service';
import { AuthService } from '../../auth/services/auth.service';
import { LibraryService } from '../../services/library.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { WebSocketService } from '../../services/websocket.service';
import { LoaderComponent } from '../loader/loader.component';
import { UserAdvertisementsComponent } from '../user-advertisements/user-advertisements.component';
import { MediaFileNamePipe } from '../../shared/pipes/media-file-name.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, LoaderComponent, UserAdvertisementsComponent, MediaFileNamePipe],
  selector: 'app-user-library',
  templateUrl: './user-library.component.html',
  styleUrls: ['./user-library.component.scss'],
})
export class UserLibraryComponent implements OnInit, OnDestroy {
  mediaList: Media[] = [];
  libraryIdsByTenant: string[] = [];
  loading: boolean = true;
  error: string | null = null;
  public readonly isNotPremium$ = this.authService.isPremiumUser().pipe(map((isPremium) => !isPremium));
  private readonly onDestroy$ = new Subject();

  constructor(
    private retryHelper: RetryHelperService,
    private webSocketService: WebSocketService,
    private readonly authService: AuthService,
    private readonly libraryService: LibraryService
  ) {}

  ngOnInit(): void {
    this.loadMedia();
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

  // 📌 Generowanie pełnej ścieżki do pliku
  getFullFilePath(filePath: string): string {
    return `${environment.publicUrl}${filePath}`;
  }

  liveUpdate(): void {
    this.webSocketService.requestMediaUpdate();
  }

  private getLibraryIdByTenantId(): void {
    this.authService
      .selectCurrentTenant()
      .pipe(
        switchMap((tenant) => this.libraryService.getLibraryByTenantId(tenant?.tenant_id as string)),
        tap((data) => (this.libraryIdsByTenant = data.map((item) => item._id)))
      )
      .subscribe();
  }

  public addTenant(id: string): void {
    this.authService
      .selectCurrentTenant()
      .pipe(
        switchMap((tenant) => this.libraryService.addTenant(tenant?.tenant_id as string, id)),
        take(1)
      )
      .subscribe();
  }

  public removeTenant(id: string): void {
    this.authService
      .selectCurrentTenant()
      .pipe(
        switchMap((tenant) => this.libraryService.removeTenant(tenant?.tenant_id as string, id)),
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

  public ngOnDestroy(): void {
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
  }
}
