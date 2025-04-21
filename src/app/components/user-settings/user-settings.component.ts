import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";

import { UserSettingsService } from "../../services/user-settings.service";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { RadioStreamService } from "../../services/radio-stream.service";
import { RetryHelperService } from "../../services/retry-helper.service";

import { UserSettings } from "../../models/user-settings.model";
import { LoaderComponent } from "../loader/loader.component";

@Component({
  selector: "app-user-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: "./user-settings.component.html",
  styleUrls: ["./user-settings.component.scss"],
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  userSettings: UserSettings = {
    tenant_id: "",
    language: "",
    country: "",
    name: "",
    selectedRadioStream: "",
    footerVisibilityRules: [],
    pictureSlideDuration: 0,
    logoFilePath: "",
    separatorFilePath: "",
  };

  tempLogoFile: File | null = null;
  tempSeparatorFile: File | null = null;
  tempLogoPreviewUrl: string | null = null;
  tempSeparatorPreviewUrl: string | null = null;
  selectedRadioIndex: number | null = null;
  editUserName: boolean = false;
  time: number[] = Array.from({ length: 60 }, (_, i) => i);
  languages: string[] = [];
  newStartMinute: number | null = null;
  newEndMinute: number | null = null;
  radioStreamList: { url: string; description: string }[] = [];
  currentPlayingStreamIndex: number | null = null;
  currentPlayingStreamUrl: string | null = null;

  editFooterVisibilityIndex: number | null = null;
  loading: boolean = false;
  error: string | null = null;
  private streamSubscription: Subscription = new Subscription();

  logoMarkedForDeletion: boolean = false;
  separatorMarkedForDeletion: boolean = false;

  constructor(
    private userSettingsService: UserSettingsService,
    private adminSettingsService: AdminSettingsService,
    public radioStreamService: RadioStreamService,
    private cdr: ChangeDetectorRef,
    private retryHelper: RetryHelperService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.getAdminSettings();
    this.radioStreamService.currentPlayingStreamIndexState$.subscribe(
      (index) => {
        this.currentPlayingStreamIndex = index;
      }
    );
  }

  ngOnDestroy(): void {
    this.streamSubscription.unsubscribe();
  }

  loadSettings(): void {
    this.loading = true;
    this.retryHelper
      .withRetry(this.userSettingsService.getSettings())
      .subscribe({
        next: (response) => {
          if (!response) {
            this.error = "Brak danych użytkownika.";
            console.warn("❗ Brak danych ustawień użytkownika.");
            return;
          }
          this.userSettings = response;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.error = "Nie udało się załadować ustawień użytkownika.";
          console.error("❌ Błąd podczas pobierania ustawień:", error);
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
    const confirmDelete = confirm(
      "Are you sure you want to delete this Footer Visibility Rule?"
    );
    if (confirmDelete) {
      this.userSettings.footerVisibilityRules.splice(index, 1);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      if (this.logoMarkedForDeletion) {
        await this.userSettingsService.deleteLogo("mainlogo").toPromise();
        this.logoMarkedForDeletion = false;
        this.tempLogoPreviewUrl = null;
      }

      if (this.separatorMarkedForDeletion) {
        await this.userSettingsService.deleteLogo("separator").toPromise();
        this.separatorMarkedForDeletion = false;
        this.tempSeparatorPreviewUrl = null;
      }

      if (this.tempLogoFile) {
        if (this.userSettings.logoFilePath) {
          await this.userSettingsService.deleteLogo("mainlogo").toPromise();
        }

        const res = await this.userSettingsService
          .uploadLogo(this.tempLogoFile, "mainlogo")
          .toPromise();

        if (res) {
          this.userSettings = res;
          if (this.userSettings.logoFilePath) {
            this.tempLogoPreviewUrl = `http://localhost:3000/${this.userSettings.logoFilePath}?t=${Date.now()}`;
          }
        }

        this.tempLogoFile = null;
      }

      if (this.tempSeparatorFile) {
        if (this.userSettings.separatorFilePath) {
          await this.userSettingsService
            .deleteLogo("separator")
            .toPromise();
        }

        const res = await this.userSettingsService
          .uploadLogo(this.tempSeparatorFile, "separator")
          .toPromise();

        if (res) {
          this.userSettings = res;
          if (this.userSettings.separatorFilePath) {
            this.tempSeparatorPreviewUrl = `http://localhost:3000/${this.userSettings.separatorFilePath}?t=${Date.now()}`;
          }
        }

        this.tempSeparatorFile = null;
      }

      this.userSettingsService.updateSettings(this.userSettings).subscribe({
        next: () => {
          alert("Settings saved successfully");
          this.loadSettings();
        },
        error: (error) => {
          console.error("Błąd podczas zapisywania", error);
          alert("Błąd podczas zapisywania ustawień. Spróbuj ponownie później.");
        },
      });
    } catch (err) {
      console.error("Błąd podczas zapisu:", err);
      alert("Błąd podczas zapisu. Spróbuj ponownie.");
    }
  }

  updateSelectedIndex(event: Event): void {
    const selectedElement = event.target as HTMLSelectElement;
    this.selectedRadioIndex = selectedElement.selectedIndex;
  }

  playRadioStream(): void {}

  onFileSelected(event: Event, type: "mainlogo" | "separator"): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const url = URL.createObjectURL(file);

      if (type === "mainlogo") {
        this.tempLogoFile = file;
        this.tempLogoPreviewUrl = url;
      } else {
        this.tempSeparatorFile = file;
        this.tempSeparatorPreviewUrl = url;
      }

      this.cdr.detectChanges();
    }
  }

  deleteLogo(type: "mainlogo" | "separator"): void {
    const confirmed = confirm(
      `Are you sure you want to mark the ${type} logo for deletion?`
    );
    if (!confirmed) return;

    if (type === "mainlogo") {
      this.logoMarkedForDeletion = true;
      this.userSettings.logoFilePath = "";
      this.tempLogoPreviewUrl = null;
      this.tempLogoFile = null;
    }

    if (type === "separator") {
      this.separatorMarkedForDeletion = true;
      this.userSettings.separatorFilePath = "";
      this.tempSeparatorPreviewUrl = null;
      this.tempSeparatorFile = null;
    }
  }

  refreshPage(): void {
    window.location.reload();
  }
}
