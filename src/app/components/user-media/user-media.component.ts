import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MediaService } from '../../services/media.service';
import { CommonModule } from '@angular/common';
import { Media } from '../../models/media.model';
import { WebSocketService } from '../../services/websocket.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { LoaderComponent } from '../loader/loader.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { AdvertisementsService } from '../../services/advertisements.service';
import { Advertisement } from '../../models/advertisement.model'
import { Observable, of, switchMap} from 'rxjs';
import { AdvertisementsComponent } from "../advertisements/advertisements.component";
import { UserAdvertisementsComponent } from '../user-advertisements/user-advertisements.component';
import { MediaFileNamePipe } from '../../shared/pipes/media-file-name.pipe';

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

  constructor(private mediaService: MediaService, private retryHelper: RetryHelperService, private webSocketService: WebSocketService, public authService: AuthService, private advertisementsService: AdvertisementsService) { }

  ngOnInit(): void {
    this.loading = true;

    this.authService.selectedTenant$
      .pipe(
        switchMap(tenant => {
          if (!tenant) return of([]);
          this.loading = true;
          return this.retryHelper.withRetry(this.mediaService.getFiles());
        })
      )
      .subscribe({
        next: data => {
          this.mediaList = data;
          this.loading = false;
        },
        error: err => {
          console.error('❌ Błąd ładowania mediów:', err);
          this.error = 'Nie udało się załadować mediów.';
          this.loading = false;
        }
      });
    
  }



  loadMedia(): void {
    this.loading = true;

    this.retryHelper.withRetry(this.mediaService.getFiles()).subscribe({
      next: (data) => {

        this.mediaList = data;
        this.loading = false
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
        alert("The file is too large! Maximum allowed size is 50 MB.");
        this.selectedFile = null;
        this.selectedFileName = '';
        input.value = "";
        return
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
    else {
      this.selectedFile = null;
      this.selectedFileName = "";
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
          this.mediaList = this.mediaList.filter(media => media._id !== id);
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
