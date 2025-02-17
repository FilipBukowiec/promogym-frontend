import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news.service'; // Importujemy nasz serwis
import { AuthService } from '@auth0/auth0-angular'; // Importujemy AuthService z Auth0
import {jwtDecode} from 'jwt-decode'; // Prawidłowy sposób importu
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports:[FormsModule, CommonModule],
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
})
export class NewsComponent implements OnInit {
  newsList: any[] = [];
  tenant_id: string = ''; // Zmienna na tenant_id, którą będziemy wyciągać z tokenu
  content: string = ''; // Treść nowego newsa
  order: number = 0; // Kolejność nowego newsa

  constructor(private newsService: NewsService, private auth: AuthService) {}

  ngOnInit(): void {
    // Pobieramy token JWT, dekodujemy go, a potem ustawiamy tenant_id
    this.auth.getAccessTokenSilently().subscribe(
      (token) => {
        const decodedToken = this.decodeToken(token);
        this.tenant_id = decodedToken.tenant_id; // Ustawiamy tenant_id
        console.log('Tenant ID z tokenu:', this.tenant_id); // Logowanie, aby upewnić się, że mamy tenant_id
        this.loadNews(); // Ładujemy newsy po ustawieniu tenant_id
      },
      (error) => {
        console.error('Błąd podczas pobierania tokenu', error);
      }
    );
  }

  // Metoda do pobierania newsów
  loadNews() {
    this.newsService.getNewsByTenant().subscribe(
      (news) => {
        this.newsList = news;
      },
      (error) => {
        console.error('Błąd podczas ładowania newsów', error);
      }
    );
  }

  // Metoda do dodawania newsa
  addNews() {
    this.newsService.addNews(this.content, this.order).subscribe(
      (response) => {
        console.log('News został dodany', response);
        this.loadNews(); // Po dodaniu nowego newsa, ładujemy je ponownie
      },
      (error) => {
        console.error('Błąd podczas dodawania newsa', error);
      }
    );
  }

  // Dekodowanie tokenu JWT (przy pomocy jwt-decode)
  private decodeToken(token: string): any {
    return jwtDecode(token); // Zwróci cały obiekt dekodowany z JWT, w tym tenant_id
  }
}
