import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserSettingsService } from "../../services/user-settings.service";
import { UserSettings } from "../../models/user-settings.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { RadioStreamService } from "../../services/radio-stream.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-user-settings",
  imports: [CommonModule, FormsModule],
  templateUrl: "./user-settings.component.html",
  styleUrl: "./user-settings.component.scss",
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  userSettings: UserSettings = {
    tenant_id: "",
    language: "",
    country: "",
    name: "",
    selectedRadioStream: "",
    footerVisibilityRules: [],
    pictureSlideDuration: 15,
  };
  selectedRadioIndex: number | null = null;
   editUserName: boolean = false;
  time: number[] = Array.from({ length: 60 }, (_, i) => i);
  languages: string[] = [];
  newStartMinute: number | null = null;
  newEndMinute: number | null = null;
  radioStreamList: { url: string; description: string }[] = [];
  currentPlayingStreamIndex: number | null = null;
  currentPlayingStreamUrl: string | null = null; // Poprawka - dodana zmienna

  editFooterVisibilityIndex: number | null = null;
  loading: boolean = false;
  error: string | null = null;
  private streamSubscription: Subscription = new Subscription(); // Zmienna do subskrypcji

  constructor(
    private userSettingsService: UserSettingsService,
    private adminSettingsService: AdminSettingsService,
    public radioStreamService: RadioStreamService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.getAdminSettings();
    this.radioStreamService.currentPlayingStreamIndexState$.subscribe((index) => {
      this.currentPlayingStreamIndex = index;
  })
  }

  ngOnDestroy(): void {
    this.streamSubscription.unsubscribe(); // Odsubskrybowanie przy usunięciu komponentu
  }

  loadSettings(): void {
    this.loading = true;
    this.userSettingsService.getSettings().subscribe({
      next: (response) => {
        this.userSettings = response;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = "Błąd podczas ładowania ustawień. Spróbuj ponownie później.";
        console.error("Błąd podczas ładowania", error);
      },
    });
  }

  

  getAdminSettings(): void {
    this.adminSettingsService.settings$.subscribe({
      next: (adminSettings) => {
        if (adminSettings?.languages) {
          this.languages = adminSettings.languages;
        }
        if (adminSettings?.radioStreamList) {
          this.radioStreamList = adminSettings.radioStreamList;
        }
      },
    });
  }






  editUserNameField(): void {
    this.editUserName = true;
  }

  saveUserName(): void {
    this.editUserName = false;
  }

  addFooterVisibilityRule(): void {
    if (this.newStartMinute === null || this.newEndMinute === null) {
      alert("Please select both start and end minutes.");
      return;
    }
    if (this.newStartMinute >= this.newEndMinute) {
      alert("Start time must be less than end time.");
      return;
    }

    this.userSettings.footerVisibilityRules.push({
      startMinute: this.newStartMinute,
      endMinute: this.newEndMinute,
    });

    this.newStartMinute = null;
    this.newEndMinute = null;
  }

  editFooterVisibilityRule(index: number): void {
    this.editFooterVisibilityIndex = index;
  }

  saveFooterVisibilityRule(index: number): void {
    const rule = this.userSettings.footerVisibilityRules[index];

    if (rule.startMinute === null || rule.endMinute === null) {
      alert("Both start and end minutes must be selected.");
      return;
    }
    if (rule.startMinute >= rule.endMinute) {
      alert("Start minute must be less than end minute.");
      return;
    }

    this.editFooterVisibilityIndex = null;
  }

  deleteFooterVisibilityRule(index: number): void {
    const confirmDelete = confirm("Are you sure you want to delete this Footer Visibility Rule?");
    if (confirmDelete) {
      this.userSettings.footerVisibilityRules.splice(index, 1);
    }
  }

  saveSettings(): void {
    this.userSettingsService.updateSettings(this.userSettings).subscribe({
      next: (response) => {
        alert("Settings saved successfully");
        this.loadSettings();
      },
      error: (error) => {
        console.error("Błąd podczas zapisywania", error);
        alert("Błąd podczas zapisywania ustawień. Spróbuj ponownie później.");
      },
    });
  }



updateSelectedIndex(event: Event): void {
  const selectedElement = event.target as HTMLSelectElement;
  this.selectedRadioIndex = selectedElement.selectedIndex;
}

  playRadioStream(): void {

    }
  }

