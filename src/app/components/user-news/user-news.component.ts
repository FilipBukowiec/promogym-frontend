import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { News } from '../../models/news.model';
import { WebSocketService } from '../../services/websocket.service';
import { LoaderComponent } from '../loader/loader.component';
import { RetryHelperService } from '../../services/retry-helper.service';
import { switchMap, take, tap } from 'rxjs';

@Component({
  selector: 'app-user-news',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './user-news.component.html',
  styleUrl: './user-news.component.scss',
})
export class UserNewsComponent implements OnInit {
  newsList: News[] = [];
  newContent: string = '';
  editedContent: string = '';
  editingNewsId: string | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(private newsService: NewsService, private webSocketService: WebSocketService, private retryHelper: RetryHelperService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  onTenantChange() {
    this.loadNews();
  }

  loadNews(): void {
    this.loading = true;
    this.retryHelper.withRetry(this.newsService.getNewsByTenant()).subscribe({
      next: (data) => {
        this.newsList = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Błąd ładowania newsów:', err);
        this.error = 'Nie udało się załadować newsów.';
        this.loading = false;
      },
    });
  }

  public addNews(): void {
    if (this.newContent.trim()) {
      this.newsService
        .addNews(this.newContent)
        .pipe(
          tap((newNews) => {
            this.newsList.unshift(newNews);
            this.newContent = '';
          }),
          switchMap(() => this.newsService.refreshNews()),
          take(1)
        )
        .subscribe();
    }
  }

  startEditing(news: News): void {
    this.editingNewsId = news._id;
    this.editedContent = news.content;
  }

  saveChanges(): void {
    if (this.editingNewsId && this.editedContent.trim()) {
      this.newsService.updateNews(this.editingNewsId, this.editedContent).subscribe((updatedNews) => {
        const index = this.newsList.findIndex((news) => news._id === this.editingNewsId);
        if (index !== -1) {
          this.newsList[index] = updatedNews;
        }
        this.editingNewsId = null;
      });
    }
  }

  deleteNews(newsId: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this news?');
    if (confirmed) {
      this.newsService.deleteNews(newsId).subscribe(
        () => {
          this.newsList = this.newsList.filter((news) => news._id !== newsId);
        },
        (error) => {
          console.error('Error deleting news:', error);
          alert('Failed to delete news.');
        }
      );
    }
  }

  moveUp(newsId: string): void {
    this.newsService.moveNewsUp(newsId).subscribe(() => {
      this.loadNews();
    });
  }

  moveDown(newsId: string): void {
    this.newsService.moveNewsDown(newsId).subscribe(() => {
      this.loadNews();
    });
  }

  liveUpdate(): void {
    this.webSocketService.requestNewsUpdate();
  }
}
