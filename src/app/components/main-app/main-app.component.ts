import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
// import { SwiperComponent } from '../swiper/swiper.component';
// import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-app',
  standalone: true,
  // imports: [FooterComponent, SwiperComponent, CommonModule],
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.scss'],
})
export class MainAppComponent {}

// implements OnInit {
//   showComponent: { [key: string]: boolean } = {};

//   constructor(private dataService: DataService) {}

//   ngOnInit(): void {
//     this.setDefaultComponentsVisibility();
//     this.dataService.data$.subscribe(data => {
//         console.log('Otrzymane dane z dataService:', data); // Dodany log
//         this.showComponent = { ...this.showComponent, ...data };
//         console.log('Aktualizacja showComponent:', this.showComponent); // Dodany log
//     });
// }

//   private setDefaultComponentsVisibility(): void {
//     this.showComponent['swiper'] = true; // Domyślnie widoczny
//     this.showComponent['footer'] = true; // Domyślnie widoczny
//   }

//   refreshComponents(): void {
//     const newData = { swiper: true, footer: true };
//     this.dataService.updateData(newData); // Odśwież dane
//   }
// }
