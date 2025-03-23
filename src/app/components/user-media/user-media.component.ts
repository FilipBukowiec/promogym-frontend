import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../services/media.service';
import { CommonModule } from '@angular/common';
import { Media } from '../../models/media.model';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  standalone:true,
  imports: [CommonModule],
  selector: 'app-user-media',
  templateUrl: './user-media.component.html',
  styleUrls: ['./user-media.component.scss'],
})
export class UserMediaComponent implements OnInit {
  mediaList: Media[] = [];
  selectedFile: File | null = null;

  constructor(private mediaService: MediaService, private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.loadMedia();
  }

  // 📌 Pobieranie listy plików
  loadMedia(): void {
    // this.mediaService.getFilesForSwiper().subscribe(
    this.mediaService.getFiles().subscribe(
      (data) => {
        this.mediaList = data;
      },
      (error) => console.error('Błąd podczas pobierania mediów:', error)
    );
  }

  // 📌 Obsługa wyboru pliku
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // 📌 Dodawanie pliku
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

  // 📌 Usuwanie pliku
  deleteMedia(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this media?');
  
    if (confirmed) {
      this.mediaService.deleteFile(id).subscribe(
        () => {
          // Usuwamy tylko usunięte media z lokalnej listy
          this.mediaList = this.mediaList.filter(media => media._id !== id);
          // Opcjonalnie: Możesz odświeżyć listę mediów z backendu, aby mieć pewność, że masz aktualne dane
          this.loadMedia(); // Odświeżenie listy po usunięciu
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
    return `http://localhost:3000/${filePath}`;
  }

  liveUpdate():void{
    this.webSocketService.requestMediaUpdate();
      }
}
