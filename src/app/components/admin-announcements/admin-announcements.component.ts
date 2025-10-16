import { Component, OnInit } from '@angular/core';
import { AnnouncementService } from '../../services/announcement.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { Announcement } from '../../models/announcement.model';

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  selector: 'app-announcements',
  templateUrl: './admin-announcements.component.html',
  styleUrls: ['./admin-announcements.component.scss'],
})
export class AdminAnnouncementsComponent implements OnInit {
  description: string = '';
  scheduledTime: string = '';
  file: File | null = null;
  announcementList: Announcement[] = [];

  scheduleType: 'oneTime' | 'cyclic' = 'oneTime';
  daysOption: 'allDays' | 'selectedDays' = 'allDays';
  hoursOption: 'allHours' | 'selectedHours' = 'allHours';
  minutesOption: 'allMinutes' | 'selectedMinutes' = 'allMinutes';

  selectedDays: boolean[] = new Array(7).fill(false);
  selectedHours: boolean[] = new Array(24).fill(false);
  selectedMinutes: boolean[] = new Array(60).fill(false);

  daysOfWeek = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = Array.from({ length: 60 }, (_, i) => i);

  constructor(private announcementService: AnnouncementService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    }
  }

  loadAnnouncements(): void {
    this.announcementService.fetchAnnouncements().subscribe({
      next: (data) => (this.announcementList = data),
      error: (err) => console.error('Błąd pobierania ogłoszeń:', err),
    });
  }

  addAnnouncement(): void {
    const formData = new FormData();
    if (this.file) {
      formData.append('file', this.file);
    }
    formData.append('description', this.description);
    formData.append('scheduleType', this.scheduleType);

    if (this.scheduleType === 'cyclic') {
      formData.append('selectedDays', this.daysOption === 'allDays' ? JSON.stringify([]) : JSON.stringify(this.getSelectedIndexes(this.selectedDays)));
      formData.append('selectedHours', this.hoursOption === 'allHours' ? JSON.stringify([]) : JSON.stringify(this.getSelectedIndexes(this.selectedHours)));
      formData.append(
        'selectedMinutes',
        this.minutesOption === 'allMinutes' ? JSON.stringify([]) : JSON.stringify(this.getSelectedIndexes(this.selectedMinutes))
      );
    } else {
      formData.append('scheduledTime', this.scheduledTime);
    }

    // Przykład pobrania nagłówków - dostosuj, jeśli potrzebujesz przekazać je do serwisu
    this.announcementService.createAnnouncement(formData).subscribe(() => {
      this.loadAnnouncements();
    });
  }

  private getSelectedIndexes(arr: boolean[]): number[] {
    return arr.map((selected, idx) => (selected ? idx : -1)).filter((idx) => idx !== -1);
  }

  getScheduledTime(announcement: Announcement): string {
    if (announcement.scheduleType === 'cyclic') return 'Cykliczne';
    if (!announcement.scheduledTime) return 'Brak daty';
    const date = new Date(announcement.scheduledTime);
    return isNaN(date.getTime()) ? 'Nieznana data' : date.toLocaleString();
  }

  deleteAnnouncement(id: string): void {
    this.announcementService.deleteAnnouncement(id).subscribe(() => {
      this.loadAnnouncements();
    });
  }
}
