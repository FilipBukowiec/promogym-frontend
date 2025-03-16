import { Component } from "@angular/core";
import { AdminSettingsService } from "../../services/admin-settings.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AdminSettings } from "../../models/admin-settings.model";

@Component({
  selector: "app-admin-settings",
  imports: [FormsModule, CommonModule],
  templateUrl: "./admin-settings.component.html",
  styleUrl: "./admin-settings.component.scss",
})
export class AdminSettingsComponent {
  adminSettings: AdminSettings = {
    languages: [],
    countries: [],
    radioStreamList: [],
  };

  newRadioDescription: string = "";
  newRadioUrl: string = "";
  editRadioStreamIndex: number | null = null;
 

  constructor(private adminSettingsService: AdminSettingsService) {}

  ngOnInit(): void {
    this.loadAdminSettings();
  }

  loadAdminSettings(): void {
    this.adminSettingsService.getSettings().subscribe({
      next: (adminSettings) => {
        if (adminSettings?.radioStreamList) {
          this.adminSettings.radioStreamList = adminSettings.radioStreamList;
        }
      },
    });
  }

  addRadioStream() {
    if (
      this.newRadioDescription.trim() === "" ||
      this.newRadioUrl.trim() === ""
    ) {
      alert("Please fill in both fields.");
      return;
    }
    this.adminSettings.radioStreamList.push({
      url: this.newRadioUrl,
      description: this.newRadioDescription,
    });

    this.newRadioDescription = "";
    this.newRadioUrl = "";
  }

  deleteRadioStream(index: number): void {
    const confirmDelete = confirm(
      "Are you sure you want to delete this radio stream?"
    );
    if (confirmDelete) {
      const deletedUrl = this.adminSettings.radioStreamList[index]?.url;
      this.adminSettings.radioStreamList.splice(index, 1);
    }
  }

  editRadioStream(index: number): void {
    this.editRadioStreamIndex = index;
  }

  saveRadioStream(index: number): void {
    this.editRadioStreamIndex = null;
  }

  saveSettings(){
    this.adminSettingsService.updateSettings(this.adminSettings).subscribe({
      next: (response) => {
        alert('Settings saved successfully');
        console.log(response);
      },
      error: (error) => {
        console.error('Błąd podczas zapisywania', error);
        alert('Błąd podczas zapisywania ustawień. Spróbuj ponownie później.');
      },
    });
  }
}
