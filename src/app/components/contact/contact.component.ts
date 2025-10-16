import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ContactService } from '../../services/contact.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  subject: string = '';
  message: string = '';
  tenant: string = '';
  succes: boolean = false;
  error: string = '';
  email: string = '';
  country: string = '';

  subjects: string[] = ['Problems', 'Improvement', 'Support', 'Other'];

  constructor(private contactService: ContactService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.selectUserInfo().subscribe((userInfo) => {
      this.email = userInfo.email;
      this.country = userInfo.country;
      this.tenant = userInfo.tenant_id;
    });
  }

  onSubmit() {
    if (!this.subject || !this.message) {
      this.error = 'All fields must be completed.';
      this.succes = false;
      return;
    }

    const finalMessage = `Wiadomość od usera:${this.tenant},\nWiadomość od usera ktory ma adres: ${this.email}\nKraj usera:${this.country}\n\nTreść wiadomości:${this.message}`;

    this.contactService.sendContactForm(this.subject, finalMessage).subscribe({
      next: () => {
        this.succes = true;
        this.error = '';
        this.subject = '';
        this.message = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'wystąpił błąd';
        this.succes = false;
      },
    });
  }

  newMessage(): void {
    this.succes = false;
  }
}
