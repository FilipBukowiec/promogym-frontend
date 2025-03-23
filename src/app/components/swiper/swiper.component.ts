import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
import { MediaService } from '../../services/media.service';
import { Media } from '../../models/media.model';
import { LoaderComponent } from '../loader/loader.component';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { UserSettingsService } from '../../services/user-settings.service';
import { WebSocketService } from '../../services/websocket.service';

Swiper.use([Autoplay]);

@Component({
  selector: 'app-swiper',
  templateUrl: './swiper.component.html',
  styleUrls: ['./swiper.component.scss'],
  standalone: true,
  imports: [LoaderComponent, CommonModule],
})
export class SwiperComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() media: Media[] = [];
  private mySwiper!: Swiper;
  isLoading: boolean = true;
  private isVideoPlaying: boolean = false;
  pictureSlideDuration: number = 5; // Domyślna wartość
  private combinedSubscription: Subscription | null = null;
  private mediaUpdateSubscription!: Subscription;

  
  
  constructor(
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void { this.mediaUpdateSubscription = this.webSocketService.mediaUpdate$.subscribe(() => {
    console.log('🔄 Otrzymano event mediaUpdate – odświeżam Swiper!');
    this.loadSwiperData();
  });
}

    private loadSwiperData(): void {
      // Jeśli była aktywna subskrypcja, anuluj ją
      if (this.combinedSubscription) {
        this.combinedSubscription.unsubscribe();
      }
  
      this.combinedSubscription = combineLatest([
        this.mediaService.getFilesForSwiper(),
        this.userSettingsService.getSettings(),
      ]).subscribe({
        next: ([media, settings]) => {
          console.log('Media:', media);
          console.log('Settings:', settings);
  
          // Ustaw media
          if (media) {
            this.media = media.sort((a, b) => a.order - b.order);
          }
  
          // Ustaw czas trwania slajdu
          if (settings && settings.pictureSlideDuration) {
            this.pictureSlideDuration = settings.pictureSlideDuration;
          }
  
          // Przeładuj Swipera
          this.destroySwiper();
          this.initializeSwiper();
        },
        error: (error) =>
          console.error('Błąd podczas pobierania danych:', error),
      });
    }





  destroySwiper(): void {
    if (this.mySwiper) {
      this.mySwiper.destroy(true, true);
      this.mySwiper = null as any;
    }
  }





  ngAfterViewInit(): void {}

  initializeSwiper(): void {
    const swiperWrapper = document.querySelector('.swiper-wrapper') as HTMLElement;
    if (!swiperWrapper) return; // Jeśli nie ma swiper-wrapper, przerwij

    // Wyczyść poprzednie slajdy
    swiperWrapper.innerHTML = '';

    // Dodaj nowe slajdy
    this.media.forEach((element, index) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      const filePath = `http://localhost:3000/${element.filePath}`;
      console.log('Sprawdzanie pliku:', filePath);

      if (element.filePath.endsWith('.mp4')) {
        const videoElement = document.createElement('video');
        videoElement.src = filePath;
        videoElement.muted = true;
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('preload', 'metadata');
        videoElement.style.width = '100vw';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        slide.appendChild(videoElement);

        videoElement.addEventListener('loadeddata', () => {
          if (index === 0) {
            videoElement
              .play()
              .then(() => {
                this.isVideoPlaying = true;
                this.isLoading = false;
                this.mySwiper.autoplay.stop();
              })
              .catch((err) => console.error('Błąd odtwarzania wideo:', err));
          }
        });

        videoElement.addEventListener('ended', () => {
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        });
      } else {
        const imgElement = document.createElement('img');
        imgElement.src = filePath;
        imgElement.style.width = '100vw';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'cover';
        slide.appendChild(imgElement);

        if (index === 0) {
          imgElement.onload = () => {
            console.log('Pierwszy slajd obraz załadowany');
            this.isLoading = false;
          };
        }
      }

      swiperWrapper.appendChild(slide);
    });

    // Zainicjuj Swipera tylko raz
    if (!this.mySwiper) {
      this.mySwiper = new Swiper('.swiper', {
        slidesPerView: 1,
        loop: true,
        autoplay: {
          delay: this.pictureSlideDuration * 1000,
          disableOnInteraction: false,
        },
        speed: 800,
        effect: 'fade',
        fadeEffect: {
          crossFade: true,
        },
        allowTouchMove: true,
        on: {
          slideChangeTransitionStart: () => {
            const currentSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
            const video = currentSlide.querySelector('video') as HTMLVideoElement;

            if (video) {
              this.mySwiper.autoplay.stop();
              video.currentTime = 0;
              video
                .play()
                .then(() => {
                  this.isVideoPlaying = true;
                })
                .catch((err) => console.error('Błąd odtwarzania wideo:', err));

              video.addEventListener(
                'ended',
                () => {
                  this.mySwiper.slideNext();
                  this.isVideoPlaying = false;
                },
                { once: true }
              );
            } else {
              if (!this.isVideoPlaying) {
                this.mySwiper.autoplay.start();
              }
            }
          },
        },
      });
    }
  }

  refreshSwiper(): void {
    console.log('Odświeżanie Swipera...');
    this.loadSwiperData();
  }

  ngOnDestroy(): void {
    if (this.combinedSubscription) {
      this.combinedSubscription.unsubscribe();
    }
    if (this.mySwiper) {
      this.mySwiper.destroy(true, true);
    }
  }
}
