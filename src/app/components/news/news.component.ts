// news.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular'; // Import Auth0 SDK
import { NewsService } from '../../services/news.service'; // Importujemy nasz serwis
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],  // Import AuthService dla tego komponentu
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
  news: any[] = [];

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    this.newsService.getNews().subscribe(
      (data) => {
        this.news = data;
      },
      (error) => {
        console.error('Błąd podczas pobierania newsów', error);
      }
    );
  }
}