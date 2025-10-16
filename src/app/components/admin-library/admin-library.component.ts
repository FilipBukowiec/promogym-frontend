import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, EMPTY, filter, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { Advertisement } from '../../models/advertisement.model';
import { Media } from '../../models/media.model';
import { AdvertisementsService } from '../../services/advertisements.service';
import { LibraryService } from '../../services/library.service';
import { MediaService } from '../../services/media.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { MediaFileNamePipe } from '../../shared/pipes/media-file-name.pipe';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, LoaderComponent, MediaFileNamePipe],
  selector: 'app-admin-library',
  templateUrl: './admin-library.component.html',
  styleUrls: ['./admin-library.component.scss'],
})
export class AdminLibraryComponent implements OnInit, OnDestroy {
  selectedFileName: string = '';
  selectedFile: File | null = null;
  mediaList: Media[] = [];
  loading: boolean = true;
  error: string | null = null;
  advertisementsList: Advertisement[] = [];
  private readonly onDestroy$ = new Subject();

  constructor(
    private mediaService: MediaService,
    private retryHelper: RetryHelperService,
    private authService: AuthService,
    private advertisementsService: AdvertisementsService,
    private readonly libraryService: LibraryService
  ) {}

  ngOnInit(): void {
    this.loadMedia();
    this.loadAdvertisementsForUserCountry();
  }

  public loadMedia(): void {
    this.retryHelper
      .withRetry(this.libraryService.getFiles())
      .pipe(
        catchError(() => {
          this.loading = false;
          return EMPTY;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe((data) => {
        this.mediaList = data;
        this.loading = false;
      });
  }

  public loadAdvertisementsForUserCountry(): void {
    this.authService
      .isPremiumUser()
      .pipe(
        filter((isPremium) => !isPremium),
        switchMap(() => this.authService.selectUserInfo()),
        switchMap((userInfo) => this.retryHelper.withRetry(this.advertisementsService.getAdvertisements(userInfo.country))),
        tap((ads) => {
          this.advertisementsList = ads;
          this.loading = false;
        }),
        catchError(() => {
          this.loading = false;
          return EMPTY;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  // 📌 Obsługa wyboru pliku
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const maxSize = 50 * 1024 * 1024;

      if (file.size > maxSize) {
        alert('The file is too large! Maximum allowed size is 50 MB.');
        this.selectedFile = null;
        this.selectedFileName = '';
        input.value = '';
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
    }
  }

  // 📌 Dodawanie pliku
  addMedia(): void {
    if (!this.selectedFile) return;

    this.libraryService.uploadFile(this.selectedFile).subscribe(
      () => {
        this.selectedFile = null;
        this.loadMedia(); // Odświeżenie listy
      },
      (error) => console.error('Błąd podczas dodawania pliku:', error)
    );
  }

  // 📌 Usuwanie pliku
  deleteMedia(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this media?');

    if (confirmed) {
      this.mediaService.deleteFile(id).subscribe(
        () => {
          this.mediaList = this.mediaList.filter((media) => media._id !== id);
          this.loadMedia();
        },
        (error) => {
          console.error('Błąd podczas usuwania pliku:', error);
          alert('Failed to delete media.');
        }
      );
    }
  }

  // 📌 Przesunięcie pliku w górę
  moveUp(id: string): void {
    this.mediaService.moveFileUp(id).subscribe(
      () => this.loadMedia(),
      (error) => console.error('Błąd podczas przesuwania pliku w górę:', error)
    );
  }

  // 📌 Przesunięcie pliku w dół
  moveDown(id: string): void {
    this.mediaService.moveFileDown(id).subscribe(
      () => this.loadMedia(),
      (error) => console.error('Błąd podczas przesuwania pliku w dół:', error)
    );
  }

  // 📌 Generowanie pełnej ścieżki do pliku
  getFullFilePath(filePath: string): string {
    return `${environment.publicUrl}${filePath}`;
  }

  public ngOnDestroy(): void {
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
  }
}
