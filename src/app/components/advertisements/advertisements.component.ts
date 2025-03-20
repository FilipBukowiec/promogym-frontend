import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdvertisementsService } from "../../services/advertisements.service";
import { Advertisement } from "../../models/advertisement.model";
import { AdminSettingsService } from "../../services/admin-settings.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: "app-advertisement",
  templateUrl: "./advertisements.component.html",
  styleUrls: ["./advertisements.component.scss"],
})
export class AdvertisementsComponent implements OnInit {
  advertisementList: Advertisement[] = [];
  selectedFile: File | null = null;
  availableCountries: string[] = [];
  selectedCountry: string[] = [];
  selectedMediaCountries: string[] = [];
  editingAdvertisementId: string | null = null;
  editedCountries: string[] = [];

  constructor(
    private advertisementsService: AdvertisementsService,
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
        console.log(this.availableCountries);
      },
      (error) =>
        console.error(
          "Błąd podczas pobierania ustawień administracyjnych:",
          error
        )
    );
  }

  loadAdvertisements(): void {
    this.advertisementsService.getAdvertisements().subscribe(
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
    if (!this.selectedFile) {
      console.error("Plik wymagany");
      return;
    }

    this.advertisementsService
      .uploadFile(this.selectedFile, this.selectedCountry)
      .subscribe(
        (response) => {
          console.log("tak poszło do backendu", this.selectedCountry);
          console.log("Reklama została dodana:", response);
          this.selectedFile = null;
          this.selectedCountry = [];
          this.loadAdvertisements(); // Odświeżenie listy
        },
        (error) => console.error("Błąd podczas dodawania reklamy:", error)
      );
  }


  startEditing(advertisement:Advertisement):void{
    this.editingAdvertisementId = advertisement._id;
    this.editedCountries = [...(advertisement.countries || [])]
  }


  saveChanges(advertisement: Advertisement): void {
    // Sortowanie krajów przed wysłaniem
    const sortedCountries = [...this.editedCountries].sort();
  
    // Wywołanie metody aktualizacji na backendzie
    this.advertisementsService.updateAdvertisement(advertisement._id, { countries: sortedCountries }).subscribe(
      () => {
        // Aktualizacja lokalnie po zapisaniu
        advertisement.countries = sortedCountries;
        this.editingAdvertisementId = null; // Zakończ edycję
      },
      (error) => {
        console.error("Błąd podczas aktualizacji krajów reklamy:", error);
      }
    );
  }

  // 📌 Usuwanie reklamy
  deleteAdvertisement(id: string): void {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę reklamę?");
    if (confirmed) {
      this.advertisementsService.delete(id).subscribe(
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
    this.advertisementsService.moveUp(id).subscribe(
      () => this.loadAdvertisements(),
      (error) =>
        console.error("Błąd podczas przesuwania reklamy w górę:", error)
    );
  }

  // 📌 Przesunięcie reklamy w dół
  moveDown(id: string): void {
    this.advertisementsService.moveDown(id).subscribe(
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

    // Dodajemy logowanie, aby sprawdzić, co się dzieje z 'country'
    console.log("Toggling selection for country:", country);

    // Sprawdzamy, czy kraj jest już wybrany
    if (index > -1) {
      // Jeśli kraj już jest wybrany, usuń go
      console.log(`Usuwamy kraj: ${country}`);
      this.selectedCountry.splice(index, 1);
    } else {
      // Jeśli kraj nie jest wybrany, dodaj go
      console.log(`Dodajemy kraj: ${country}`);
      this.selectedCountry.push(country);
    }

    // Logujemy aktualną zawartość selectedCountry
    console.log("Aktualny stan selectedCountry:", this.selectedCountry);
  }


  toggleEditRegionSelection(country: string): void {
    const index = this.editedCountries.indexOf(country);
    
    if (index > -1) {
      this.editedCountries.splice(index, 1); // Usuwa kraj, jeśli był już wybrany
    } else {
      this.editedCountries.push(country); // Dodaje kraj, jeśli nie był wybrany
    }
  }
  
  

}
