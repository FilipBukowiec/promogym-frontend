import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../footer/footer.component';
import { TopMenuComponent } from '../top-menu/top-menu.component';


@Component({
  standalone:true,
  imports: [CommonModule, FormsModule, TopMenuComponent],
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent {


}