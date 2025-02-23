import { Component, OnInit } from '@angular/core';
import { AnnouncementService } from '../../services/announcement.service';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  standalone:true,
  imports: [FormsModule, CommonModule],
  selector: 'app-user-announcements',
  templateUrl: './user-announcements.component.html',
  styleUrls: ['./user-announcements.component.scss']
})
export class UserAnnouncementsComponent implements OnInit {

  description: string = ''; // Właściwość description
  oneTimeDate: string = ''; // Właściwość oneTimeDate
  // FormData dla ogłoszenia
  announcementForm: FormGroup;
  file: File | null = null;
  announcementList: any[] = [];

  // Zmienne do harmonogramu cyklicznego
  scheduleType = 'oneTime';
  daysOption = 'allDays';
  hoursOption = 'allHours';
  minutesOption = 'allMinutes';
  selectedDays: boolean[] = new Array(7).fill(false);
  selectedHours: boolean[] = new Array(24).fill(false);
  selectedMinutes: boolean[] = new Array(60).fill(false);
  
  // Możliwe wartości dla dni, godzin i minut
  daysOfWeek = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    private announcementService: AnnouncementService, 
    private fb: FormBuilder,
    private authService: AuthService // Inicjalizacja AuthService
  ) {
    this.announcementForm = this.fb.group({
      description: [''],
      scheduleType: ['oneTime'],
      oneTimeDate: ['']
    });
  }

  ngOnInit() {
    this.loadAnnouncements();
  }

  // Obsługa wyboru pliku
  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  // Pobranie listy ogłoszeń
  loadAnnouncements() {
    this.announcementService.fetchAnnouncements().subscribe(data => {
      this.announcementList = data;
    });
  }

  // Dodanie ogłoszenia
  addAnnouncement() {
    const formData = new FormData();
    if (this.file) formData.append('file', this.file);
    formData.append('description', this.announcementForm.value.description);
    formData.append('scheduleType', this.scheduleType);

    // Obsługa harmonogramu cyklicznego
    if (this.scheduleType === 'cyclic') {
      formData.append('scheduleOption', this.daysOption);
      formData.append('selectedDays', this.daysOption === 'selectedDays' ? JSON.stringify(this.getSelectedIndexes(this.selectedDays)) : '');
      formData.append('selectedHours', this.hoursOption === 'selectedHours' ? JSON.stringify(this.getSelectedIndexes(this.selectedHours)) : '');
      formData.append('selectedMinutes', this.minutesOption === 'selectedMinutes' ? JSON.stringify(this.getSelectedIndexes(this.selectedMinutes)) : '');
    } else {
      // Harmonogram jednorazowy
      formData.append('oneTimeDate', this.announcementForm.value.oneTimeDate);
    }

    // Pobranie nagłówków z tokenem
    this.authService.getAuthHeaders().subscribe((headers: HttpHeaders) => {
      const requestOptions = { headers: headers };

      this.announcementService.createAnnouncement(formData).subscribe(() => {
        this.loadAnnouncements();
      });
    });
  }

  // Pobranie indeksów zaznaczonych checkboxów
  private getSelectedIndexes(array: boolean[]): number[] {
    return array.map((value, index) => value ? index : -1).filter(index => index !== -1);
  }

  // Pobranie czasu emisji ogłoszenia
  getScheduledTime(announcement: any): string {
    if (announcement.scheduleType === 'cyclic') return 'Cykliczne';
    return new Date(announcement.oneTimeDate).toLocaleString();
  }

  // Usunięcie ogłoszenia
  deleteAnnouncement(id: string) {
    this.announcementService.deleteAnnouncement(id).subscribe(() => {
      this.loadAnnouncements();
    });
  }
}
