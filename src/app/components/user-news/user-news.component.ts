import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { News } from '../../models/news.model';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-user-news',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-news.component.html',
  styleUrl: './user-news.component.scss'
})
export class UserNewsComponent  implements OnInit {
  newsList: News[] = [];
  newContent: string = '';
  editedContent: string = '';
  editingNewsId: string | null = null;

  constructor(private newsService: NewsService, private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.loadNews();
   
  }

  loadNews(): void {
    this.newsService.getNewsByTenant().subscribe((data) => {
      this.newsList = data;
    });
  }

  addNews(): void {
    if (this.newContent.trim()) {
      this.newsService.addNews(this.newContent).subscribe((newNews) => {
        this.newsList.unshift(newNews);
        this.newContent = ''; // Reset the input field
        
      });
    }

    
  }

  startEditing(news: any): void {
    this.editingNewsId = news._id;
    this.editedContent = news.content;
  }

  saveChanges(): void {
    if (this.editingNewsId && this.editedContent.trim()) {
      this.newsService.updateNews(this.editingNewsId, this.editedContent).subscribe((updatedNews) => {
        const index = this.newsList.findIndex(news => news._id === this.editingNewsId);
        if (index !== -1) {
          this.newsList[index] = updatedNews;
        }
        this.editingNewsId = null; // Reset editing state
      });
    }
  }

  deleteNews(newsId: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this news?');
    if (confirmed) {
      this.newsService.deleteNews(newsId).subscribe(
        () => {
          // Usuwanie newsa z listy po pomyślnym usunięciu
          this.newsList = this.newsList.filter(news => news._id !== newsId);
        },
        (error) => {
          // Obsługa błędów
          console.error('Error deleting news:', error);
          alert('Failed to delete news.');
        }
      );
    }
  }
  


  moveUp(newsId: string): void {
    this.newsService.moveNewsUp(newsId).subscribe(() => {
      this.loadNews();  // Reload the list after movement
    });
  }

  moveDown(newsId: string): void {
    this.newsService.moveNewsDown(newsId).subscribe(() => {
      this.loadNews();  // Reload the list after movement
    });
  }

liveUpdate():void{
  this.webSocketService.requestNewsUpdate()
}

}
 



