import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdvertisementsService } from "../../services/advertisements.service";
import { Advertisement } from "../../models/advertisement.model";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: "app-advertisements",
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
    private adminSettingsService: AdminSettingsService,
  ) { }

  ngOnInit(): void {
    console.log("🔄 Inicjalizacja komponentu reklam");
    this.loadAdminSettings();
    this.loadAdvertisements();
  }


  loadAdminSettings(): void {
    console.log("📥 Ładowanie ustawień administracyjnych...");
    this.adminSettingsService.getSettings().subscribe(
      (data) => {
        this.availableCountries = data.countries || [];
        console.log("✅ Dostępne kraje:", this.availableCountries);
      },
      (error) =>
        console.error("❌ Błąd podczas pobierania ustawień administracyjnych:", error)
    );
  }

  loadAdvertisements(): void {
    console.log("📥 Ładowanie reklam...");
    this.advertisementsService.getAdvertisements().subscribe(
      (data) => {
        console.log("✅ Odebrane reklamy:", data);
        this.advertisementList = data;
      },
      (error) => console.error("❌ Błąd podczas pobierania reklam:", error)
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log("📁 Wybrany plik:", this.selectedFile.name);
    }
  }

  addAdvertisement(): void {
    if (!this.selectedFile) {
      console.error("❌ Plik wymagany");
      return;
    }

    console.log("📤 Dodawanie reklamy:");
    console.log("➡️ Plik:", this.selectedFile.name);
    console.log("➡️ Kraje:", this.selectedCountry);

    this.advertisementsService
      .uploadFile(this.selectedFile, this.selectedCountry)
      .subscribe(
        (response) => {
          console.log("✅ Reklama została dodana:", response);
          this.selectedFile = null;
          this.selectedCountry = [];
          this.loadAdvertisements();
        },
        (error) => console.error("❌ Błąd podczas dodawania reklamy:", error)
      );
  }

  startEditing(advertisement: Advertisement): void {
    console.log("✏️ Rozpoczęto edycję reklamy:", advertisement._id);
    this.editingAdvertisementId = advertisement._id;
    this.editedCountries = [...(advertisement.countries || [])];
    console.log("➡️ Aktualne kraje reklamy:", this.editedCountries);
  }

  saveChanges(advertisement: Advertisement): void {
    const sortedCountries = [...this.editedCountries].sort();
    console.log("💾 Zapisywanie zmian dla reklamy:", advertisement._id);
    console.log("➡️ Nowe kraje:", sortedCountries);

    this.advertisementsService
      .updateAdvertisement(advertisement._id, { countries: sortedCountries })
      .subscribe(
        () => {
          advertisement.countries = sortedCountries;
          this.editingAdvertisementId = null;
          console.log("✅ Zmiany zapisane.");
        },
        (error) => {
          console.error("❌ Błąd podczas aktualizacji krajów reklamy:", error);
        }
      );
  }

  deleteAdvertisement(id: string): void {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć tę reklamę?");
    if (confirmed) {
      console.log("🗑️ Usuwanie reklamy:", id);
      this.advertisementsService.delete(id).subscribe(
        () => {
          console.log("✅ Reklama usunięta:", id);
          this.advertisementList = this.advertisementList.filter(
            (ad) => ad._id !== id
          );
          this.loadAdvertisements();
        },
        (error) => {
          console.error("❌ Błąd podczas usuwania reklamy:", error);
          alert("Nie udało się usunąć reklamy.");
        }
      );
    } else {
      console.log("❎ Usunięcie anulowane przez użytkownika");
    }
  }

  moveUp(id: string): void {
    console.log("⬆️ Przesuwanie reklamy w górę:", id);
    this.advertisementsService.moveUp(id).subscribe(
      () => {
        console.log("✅ Przesunięcie w górę zakończone");
        this.loadAdvertisements();
      },
      (error) => {
        console.error("❌ Błąd podczas przesuwania reklamy w górę:", error);
      }
    );
  }

  moveDown(id: string): void {
    console.log("⬇️ Przesuwanie reklamy w dół:", id);
    this.advertisementsService.moveDown(id).subscribe(
      () => {
        console.log("✅ Przesunięcie w dół zakończone");
        this.loadAdvertisements();
      },
      (error) => {
        console.error("❌ Błąd podczas przesuwania reklamy w dół:", error);
      }
    );
  }

  getFullFilePath(filePath: string): string {
    const fullPath = `${environment.publicUrl}${filePath}`;
    console.log("🧭 Generowanie ścieżki do pliku:", fullPath);
    return fullPath;
  }

  toggleRegionSelection(country: string): void {
    console.log("🔁 Zmieniamy wybór kraju:", country);
    const index = this.selectedCountry.indexOf(country);
    if (index > -1) {
      console.log("➖ Usuwamy kraj:", country);
      this.selectedCountry.splice(index, 1);
    } else {
      console.log("➕ Dodajemy kraj:", country);
      this.selectedCountry.push(country);
    }
    console.log("📌 Aktualne selectedCountry:", this.selectedCountry);
  }

  toggleEditRegionSelection(country: string): void {
    console.log("🔁 Zmieniamy wybór edytowanych krajów:", country);
    const index = this.editedCountries.indexOf(country);
    if (index > -1) {
      console.log("➖ Usuwamy z edycji:", country);
      this.editedCountries.splice(index, 1);
    } else {
      console.log("➕ Dodajemy do edycji:", country);
      this.editedCountries.push(country);
    }
    console.log("📌 Aktualne editedCountries:", this.editedCountries);
  }
}
