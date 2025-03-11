import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvertisementService } from '../../services/advertisement.service';
import { Advertisement } from '../../models/advertisement.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-advertisement',
  templateUrl: './advertisement.component.html',
  styleUrls: ['./advertisement.component.scss'],
})
export class AdvertisementComponent implements OnInit {
  advertisementList: Advertisement[] = [];
  selectedFile: File | null = null;
  // Jeśli chcesz przekazywać opcjonalnie języki, możesz dodać np.:
  // selectedLanguages: string[] = [];

  constructor(private advertisementService: AdvertisementService) {}

  ngOnInit(): void {
    this.loadAdvertisements();
  }

  // 📌 Pobieranie listy reklam
  loadAdvertisements(): void {
    // Jeśli nie filtrujesz po języku, wywołaj bez argumentu:
    this.advertisementService.getAll().subscribe(
      (data) => {
        this.advertisementList = data;
      },
      (error) => console.error('Błąd podczas pobierania reklam:', error)
    );
  }

  // 📌 Obsługa wyboru pliku
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // 📌 Dodawanie reklamy
  addAdvertisement(): void {
    if (!this.selectedFile) return;

    // Jeśli chcesz przekazać języki, możesz je tutaj podać (np. ['pl', 'en'])
    // const languages = this.selectedLanguages; 
    // W tym przykładzie pomijamy languages
    this.advertisementService.uploadFile(this.selectedFile).subscribe(
      () => {
        this.selectedFile = null;
        this.loadAdvertisements(); // Odświeżenie listy
      },
      (error) => console.error('Błąd podczas dodawania reklamy:', error)
    );
  }

  // 📌 Usuwanie reklamy
  deleteAdvertisement(id: string): void {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę reklamę?');
    if (confirmed) {
      this.advertisementService.delete(id).subscribe(
        () => {
          // Aktualizujemy lokalną listę lub odświeżamy ją z backendu
          this.advertisementList = this.advertisementList.filter(ad => ad._id !== id);
          // Alternatywnie, możesz odświeżyć całą listę:
          this.loadAdvertisements();
        },
        (error) => {
          console.error('Błąd podczas usuwania reklamy:', error);
          alert('Nie udało się usunąć reklamy.');
        }
      );
    }
  }

  // 📌 Przesunięcie reklamy w górę
  moveUp(id: string): void {
    this.advertisementService.moveUp(id).subscribe(
      () => this.loadAdvertisements(),
      (error) => console.error('Błąd podczas przesuwania reklamy w górę:', error)
    );
  }

  // 📌 Przesunięcie reklamy w dół
  moveDown(id: string): void {
    this.advertisementService.moveDown(id).subscribe(
      () => this.loadAdvertisements(),
      (error) => console.error('Błąd podczas przesuwania reklamy w dół:', error)
    );
  }

  // 📌 Generowanie pełnej ścieżki do pliku
  getFullFilePath(filePath: string): string {
    return `http://localhost:3000/${filePath}`;
  }
}
