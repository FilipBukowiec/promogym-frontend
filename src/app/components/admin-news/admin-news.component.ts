import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';  // <-- Zaimportuj FormsModule


@Component({
  selector: 'app-admin-news',
  imports: [FormsModule],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.scss'
})
export class AdminNewsComponent {

}
