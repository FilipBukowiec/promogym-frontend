import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { Advertisement } from '../../models/advertisement.model';
import { Media } from '../../models/media.model';
import { MediaService } from '../../services/media.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { WebSocketService } from '../../services/websocket.service';
import { MediaFileNamePipe } from '../../shared/pipes/media-file-name.pipe';
import { LoaderComponent } from '../loader/loader.component';
import { UserAdvertisementsComponent } from '../user-advertisements/user-advertisements.component';

@Component({
  standalone: true,
  imports: [CommonModule, LoaderComponent, UserAdvertisementsComponent, MediaFileNamePipe],
  selector: 'app-user-media',
  templateUrl: './user-media.component.html',
  styleUrls: ['./user-media.component.scss'],
})
export class UserMediaComponent implements OnInit {
  selectedFileName: string = '';
  selectedFile: File | null = null;
  mediaList: Media[] = [];
  loading: boolean = true;
  error: string | null = null;
  advertisementsList: Advertisement[] = [];
  public readonly isStandardUser$ = this.authService.isStandardUser();

  constructor(
    private mediaService: MediaService,
    private retryHelper: RetryHelperService,
    private webSocketService: WebSocketService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.authService
      .selectCurrentTenant()
      .pipe(
        switchMap((tenant) => {
          if (!tenant) return of([]);
          this.loading = true;
          return this.retryHelper.withRetry(this.mediaService.getFiles());
        })
      )
      .subscribe({
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

  loadMedia(): void {
    this.loading = true;

    this.retryHelper.withRetry(this.mediaService.getFiles()).subscribe({
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

  addMedia(): void {
    if (!this.selectedFile) return;

    this.mediaService.uploadFile(this.selectedFile).subscribe(
      () => {
        this.selectedFile = null;
        this.loadMedia(); // Odświeżenie listy
      },
      (error) => console.error('Błąd podczas dodawania pliku:', error)
    );
  }

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

  moveUp(id: string): void {
    this.mediaService.moveFileUp(id).subscribe(
      () => this.loadMedia(),
      (error) => console.error('Błąd podczas przesuwania pliku w górę:', error)
    );
  }

  moveDown(id: string): void {
    this.mediaService.moveFileDown(id).subscribe(
      () => this.loadMedia(),
      (error) => console.error('Błąd podczas przesuwania pliku w dół:', error)
    );
  }

  getFullFilePath(filePath: string): string {
    return `${environment.publicUrl}${filePath}`;
  }

  liveUpdate(): void {
    this.webSocketService.requestMediaUpdate();
  }
}
