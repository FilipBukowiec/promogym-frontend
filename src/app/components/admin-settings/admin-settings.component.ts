import { Component, computed, OnInit, signal, Signal } from "@angular/core";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { RadioStreamService } from "../../services/radio-stream.service";
import { AdminSettings } from "../../models/admin-settings.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { WebSocketService } from "../../services/websocket.service";

@Component({
  imports: [CommonModule, FormsModule],
  selector: "app-admin-settings",
  templateUrl: "./admin-settings.component.html",
  styleUrls: ["./admin-settings.component.scss"],
})
export class AdminSettingsComponent implements OnInit {
  adminSettings: AdminSettings = {
    languages: [],
    countries: [],
    radioStreamList: [],
  };

  newRadioDescription: string = "";
  newRadioUrl: string = "";
  editRadioStreamIndex: number | null = null;
  editCountryIndex: number | null = null;
  newCountry: string = "";
  currentPlayingStreamIndex!: Signal<number | null>;
  isPlaying!: Signal<boolean>;




  constructor(
    public adminSettingsService: AdminSettingsService,
    public radioStreamService: RadioStreamService,
    private websocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.loadAdminSettings();
    this.currentPlayingStreamIndex = this.radioStreamService.currentPlayingStreamIndexSignal;
    this.isPlaying = computed(() => this.currentPlayingStreamIndex() !== null);
  }



  loadAdminSettings(): void {
    this.adminSettingsService.getSettings().subscribe({
      next: (adminSettings) => {
        if (adminSettings) {
          this.adminSettings = adminSettings;
          console.log("Admin settings loaded", adminSettings);
        }
      },
      error: (err) => {
        console.error("Error loading admin settings", err);
      },
    });
  }

  playRadioStream(index: number, url: string): void {
    this.radioStreamService.playRadioStream(
      url,
      () => this.radioStreamService.adminSettingsAudio.set(true),
      [
        () => this.radioStreamService.sideMenuAudio.set(false),
        () => this.radioStreamService.userSettingsAudio.set(false),
      ],
      index
    );
  }


get currentPlayingStreamIndexValue(): number | null {
  return this.currentPlayingStreamIndex();
}


  addRadioStream(): void {
    if (
      this.newRadioDescription.trim() === "" ||
      this.newRadioUrl.trim() === ""
    ) {
      alert("Please fill in both fields.");
      return;
    }

    this.adminSettings.radioStreamList.push({
      description: this.newRadioDescription,
      url: this.newRadioUrl,
    });

    this.newRadioDescription = "";
    this.newRadioUrl = "";
  }

  /** Usuwanie radia */
  deleteRadioStream(index: number): void {
    const confirmDelete = confirm(
      "Are you sure you want to delete this radio stream?"
    );
    if (confirmDelete) {
      this.adminSettings.radioStreamList.splice(index, 1);
    }
  }

  /** Edycja radia */
  editRadioStream(index: number): void {
    this.editRadioStreamIndex = index;
  }

  /** Zapisanie edytowanego radia */
  saveRadioStream(index: number): void {
    this.editRadioStreamIndex = null;
  }

  /** Zapisanie wszystkich ustawień */
  saveSettings(): void {
    this.adminSettingsService.updateSettings(this.adminSettings).subscribe({
      next: (response) => {
        alert("Settings saved successfully");
        console.log(response);
        this.loadAdminSettings();
      },
      error: (error) => {
        console.error("Error saving settings", error);
        alert("Error saving settings. Please try again later.");
      },
    });
  }

  /** Dodanie nowego kraju */
  addNewCountry(): void {
    if (this.newCountry.trim() === "") {
      alert("Please enter a country name");
      return;
    }
    this.adminSettings.countries.push(this.newCountry);
    this.newCountry = "";
  }

  /** Usunięcie kraju */
  deleteCountry(index: number): void {
    const confirmDelete = confirm(
      "Are you sure you want to delete this country?"
    );
    if (confirmDelete) {
      this.adminSettings.countries.splice(index, 1);
    }
  }

  /** Edycja kraju */
  editCountry(index: number): void {
    this.editCountryIndex = index;
  }

  /** Zapisanie edytowanego kraju */
  saveCountry(index: number): void {
    this.editCountryIndex = null;
  }

  /** Track by dla krajów */
  trackByCountry(index: number, country: string): number {
    return index;
  }

  liveUpdate(): void {
    const confirmed = window.confirm(
      "Are you sure you want to reload devices in all users?"
    );

    if (confirmed) {
      this.websocketService.requestGlobalSettingsUpdate();
    }
  }
}
