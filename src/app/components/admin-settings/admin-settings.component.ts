import { Component, computed, OnInit, Signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { RadioStreamService } from "../../services/radio-stream.service";
import { AdminSettings } from "../../models/admin-settings.model";
import { WebSocketService } from "../../services/websocket.service";

@Component({
  selector: "app-admin-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin-settings.component.html",
  styleUrls: ["./admin-settings.component.scss"],
})
export class AdminSettingsComponent implements OnInit {
  adminSettings: AdminSettings = {
    languages: [],
    countries: [],
    radioStreamList: [],
  };

  newRadioDescription = "";
  newRadioUrl = "";
  editRadioStreamIndex: number | null = null;
  editCountryIndex: number | null = null;
  newCountry = "";

  currentPlayingStreamIndex!: Signal<number | null>;
  isPlaying!: Signal<boolean>;

  constructor(
    public adminSettingsService: AdminSettingsService,
    public radioStreamService: RadioStreamService,
    private websocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadAdminSettings();

    // signals z serwisu
    this.currentPlayingStreamIndex =
      this.radioStreamService.currentPlayingStreamIndexSignal;

    this.isPlaying = computed(() => this.currentPlayingStreamIndex() !== null);
  }

  loadAdminSettings(): void {
    this.adminSettingsService.getSettings().subscribe({
      next: (adminSettings) => {
        if (adminSettings) {
          this.adminSettings = adminSettings;
          console.log("✅ Admin settings loaded", adminSettings);
        }
      },
      error: (err) => {
        console.error("❌ Error loading admin settings", err);
      },
    });
  }

  playRadioStream(index: number, url: string): void {
    this.radioStreamService.playRadioStream(url, "admin", index);
  }

  stopRadioStream(): void {
    this.radioStreamService.stopRadioStream();
  }

  get currentPlayingStreamIndexValue(): number | null {
    return this.currentPlayingStreamIndex();
  }

  addRadioStream(): void {
    if (!this.newRadioDescription.trim() || !this.newRadioUrl.trim()) {
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

  deleteRadioStream(index: number): void {
    if (confirm("Are you sure you want to delete this radio stream?")) {
      this.adminSettings.radioStreamList.splice(index, 1);
    }
  }

  editRadioStream(index: number): void {
    this.editRadioStreamIndex = index;
  }

  saveRadioStream(index: number): void {
    this.editRadioStreamIndex = null;
  }

  saveSettings(): void {
    this.adminSettingsService.updateSettings(this.adminSettings).subscribe({
      next: (response) => {
        alert("Settings saved successfully");
        console.log(response);
        this.loadAdminSettings();
      },
      error: (error) => {
        console.error("❌ Error saving settings", error);
        alert("Error saving settings. Please try again later.");
      },
    });
  }

  addNewCountry(): void {
    if (!this.newCountry.trim()) {
      alert("Please enter a country name");
      return;
    }
    this.adminSettings.countries.push(this.newCountry);
    this.newCountry = "";
  }

  deleteCountry(index: number): void {
    if (confirm("Are you sure you want to delete this country?")) {
      this.adminSettings.countries.splice(index, 1);
    }
  }

  editCountry(index: number): void {
    this.editCountryIndex = index;
  }

  saveCountry(index: number): void {
    this.editCountryIndex = null;
  }

  trackByCountry(index: number, country: string): number {
    return index;
  }

  liveUpdate(): void {
    if (
      confirm("Are you sure you want to reload devices in all users?")
    ) {
      this.websocketService.requestGlobalSettingsUpdate();
    }
  }
}
