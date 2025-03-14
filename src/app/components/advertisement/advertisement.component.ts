import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdvertisementService } from "../../services/advertisement.service";
import { Advertisement } from "../../models/advertisement.model";
import { environment } from "../../../environments/environment";
import { AdminSettingsService } from "../../services/admin-settings.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: "app-advertisement",
  templateUrl: "./advertisement.component.html",
  styleUrls: ["./advertisement.component.scss"],
})
export class AdvertisementComponent implements OnInit {
  advertisementList: Advertisement[] = [];
  selectedFile: File | null = null;
  availableCountries: string[]=[];
  selectedCountry: string[] = [];

  constructor(
    private advertisementService: AdvertisementService,
    private adminSettingsService: AdminSettingsService
  ) {}

  ngOnInit(): void {
    this.loadAdminSettings();
    this.loadAdvertisements();
  }

  loadAdminSettings(): void {
    this.adminSettingsService.getSettings().subscribe(
      (data) => {
        this.availableCountries = data.countries || [];
        console.log(this.availableCountries)
      },
      (error) =>
        console.error(
          "Błąd podczas pobierania ustawień administracyjnych:",
          error
        )
    );
  }

  loadAdvertisements(): void {
    this.advertisementService.getAdvertisements().subscribe(
      (data) => {
        this.advertisementList = data;
      },
      (error) => console.error("Błąd podczas pobierania reklam:", error)
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  } 

  // 📌 Dodawanie reklamy
  addAdvertisement(): void {
    if (!this.selectedFile || this.selectedCountry.length === 0){
      console.error("Plik i kraje sa wymagane")
      return;
    } 

    this.advertisementService.uploadFile(this.selectedFile, this.selectedCountry).subscribe(
      (response) => {
        console.log("Reklama została dodana:", response);
        this.selectedFile = null;
        this.selectedCountry = [];
        this.loadAdvertisements(); // Odświeżenie listy
      },
      (error) => console.error("Błąd podczas dodawania reklamy:", error)
    );
  }

  // 📌 Usuwanie reklamy
  deleteAdvertisement(id: string): void {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę reklamę?");
    if (confirmed) {
      this.advertisementService.delete(id).subscribe(
        () => {
          // Aktualizujemy lokalną listę lub odświeżamy ją z backendu
          this.advertisementList = this.advertisementList.filter(
            (ad) => ad._id !== id
          );
          // Alternatywnie, możesz odświeżyć całą listę:
          this.loadAdvertisements();
        },
        (error) => {
          console.error("Błąd podczas usuwania reklamy:", error);
          alert("Nie udało się usunąć reklamy.");
        }
      );
    }
  }

  // 📌 Przesunięcie reklamy w górę
  moveUp(id: string): void {
    this.advertisementService.moveUp(id).subscribe(
      () => this.loadAdvertisements(),
      (error) =>
        console.error("Błąd podczas przesuwania reklamy w górę:", error)
    );
  }

  // 📌 Przesunięcie reklamy w dół
  moveDown(id: string): void {
    this.advertisementService.moveDown(id).subscribe(
      () => this.loadAdvertisements(),
      (error) => console.error("Błąd podczas przesuwania reklamy w dół:", error)
    );
  }

  // 📌 Generowanie pełnej ścieżki do pliku
  getFullFilePath(filePath: string): string {
    return `http://localhost:3000/${filePath}`;
  }

  toggleRegionSelection(country: string): void {
    const index = this.selectedCountry.indexOf(country);
    if (index > -1) {
      // Jeśli kraj już jest wybrany, usuń go
      this.selectedCountry.splice(index, 1);
    } else {
      // Jeśli kraj nie jest wybrany, dodaj go
      this.selectedCountry.push(country);
    }
  }

}
