import { Component } from '@angular/core';
import { UserSettingsService } from '../../services/user-settings.service';
import { UserSettings } from '../../models/user-settings.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss'
})
export class UserSettingsComponent {
  
  userSettings: UserSettings = {
  tenant_id: '',
  language: '',
  country: "",
  name: '',
  selectedRadioStream: '',
  footerVisibilityRules: [],
  pictureSlideDuration: 15,
   };

   editUserName: boolean = false;

  time: number[] = Array.from({ length: 60 }, (_, i) => i);
  languages: string[] = ['pl', 'eng']
  newStartMinute: number | null = null;
  newEndMinute: number | null = null;
  newRadioUrl: string = '';
  editRadioStreamIndex: number | null = null;
  editFooterVisibilityIndex: number | null = null;

  loading: boolean = false; // Dodano stan ładowania
  error: string | null = null; // Dodano stan błędu

  constructor(
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
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
        this.error =
          'Błąd podczas ładowania ustawień. Spróbuj ponownie później.';
        console.error('Błąd podczas ładowania', error);
      },
    });
  }




  editUserNameField(): void {
    this.editUserName = true;
  }

  saveUserName(): void {
    this.editUserName = false;
  }


  addFooterVisibilityRule() {
    if (this.newStartMinute === null || this.newEndMinute === null) {
      alert('Please select both start and end minutes.');
      return;
    } else if (this.newStartMinute >= this.newEndMinute) {
      alert('Start time must be less than end time.');
      return;
    }
    this.userSettings.footerVisibilityRules.push({
      startMinute: this.newStartMinute,
      endMinute: this.newEndMinute,
    });
    console.log(this.userSettings.footerVisibilityRules);
    this.newStartMinute = null;
    this.newEndMinute = null;
  }

 
  editFooterVisibilityRule(index: number): void {
    this.editFooterVisibilityIndex = index;
  }

  saveFooterVisibilityRule(index: number): void {
    const rule = this.userSettings.footerVisibilityRules[index];

    if (rule.startMinute === null || rule.endMinute === null) {
      alert('Both start and end minutes must be selected.');
      return;
    }
    if (rule.startMinute >= rule.endMinute) {
      alert('Start minute must be less than end minute.');
      return;
    }

    this.editFooterVisibilityIndex = null;
  }

  deleteFooterVisibilityRule(index: number): void {
    const confirmDelete = confirm(
      'Are you sure you want to delete this Footer Visibility Rule?'
    );
    if (confirmDelete) {
      this.userSettings.footerVisibilityRules.splice(index, 1);
    }
  }

  saveSettings(): void {
    this.userSettingsService.updateSettings(this.userSettings).subscribe({
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
