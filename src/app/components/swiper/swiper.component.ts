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
import { RetryHelperService } from '../../services/retry-helper.service';
import { TenantChangeService } from '../../services/tenant-change.service';

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
  pictureSlideDuration: number = 5;
  private combinedSubscription: Subscription | null = null;
  private mediaUpdateSubscription!: Subscription;
  private tenantChangeSubscription!: Subscription;

  constructor(
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
    private webSocketService: WebSocketService,
    private retryHelper: RetryHelperService,
    private tenantChangeService: TenantChangeService,
  ) {}

  ngOnInit(): void {
    this.mediaUpdateSubscription = this.webSocketService.mediaUpdate$.subscribe(() => {
      console.log('🔄 Otrzymano event mediaUpdate – odświeżam Swiper!');
      this.loadSwiperData();
    });

    this.tenantChangeSubscription = this.tenantChangeService.tenantChanged$.subscribe(() => {
      console.log('🏢 Zmiana tenant\'a – odświeżam media Swipera!');
      this.loadSwiperData();
    });

    this.loadSwiperData();
  }

  private loadSwiperData(): void {
    if (this.combinedSubscription) {
      this.combinedSubscription.unsubscribe();
    }

    this.combinedSubscription = this.retryHelper
      .withRetry(
        combineLatest([
          this.mediaService.getFilesForSwiper(),
          this.userSettingsService.getSettings(),
        ]),
      )
      .subscribe({
        next: ([media, settings]) => {
          if (!media || media.length === 0) {
            throw new Error('Brak mediów do załadowania.');
          }

          this.media = media.sort((a, b) => a.order - b.order);
          if (settings?.pictureSlideDuration) {
            this.pictureSlideDuration = settings.pictureSlideDuration;
          }

          this.destroySwiper();
          this.initializeSwiper();
        },
        error: (error) => {
          console.error('❌ Błąd podczas pobierania danych po ponowieniach:', error);
          this.isLoading = false;
        },
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
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = '';

    let loadedMediaCount = 0;
    const totalMediaCount = this.media.length;

    const checkIfAllMediaLoaded = () => {
      if (loadedMediaCount === totalMediaCount) {
        this.isLoading = false;
        this.initializeSwiperInstance();
      }
    };

    this.media.forEach((element) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      const filePath = `http://localhost:3000/${element.filePath}`;

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
          loadedMediaCount++;
          checkIfAllMediaLoaded();
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

        imgElement.onload = () => {
          loadedMediaCount++;
          checkIfAllMediaLoaded();
        };
      }

      swiperWrapper.appendChild(slide);
    });
  }

  initializeSwiperInstance(): void {
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

      // ⬇️ Sprawdzenie pierwszego slajdu po inicjalizacji
      const firstSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
      const video = firstSlide.querySelector('video') as HTMLVideoElement;

      if (video) {
        this.mySwiper.autoplay.stop();
        video.currentTime = 0;
        video
          .play()
          .then(() => {
            this.isVideoPlaying = true;
          })
          .catch((err) => console.error('Błąd odtwarzania pierwszego wideo:', err));

        video.addEventListener(
          'ended',
          () => {
            this.mySwiper.slideNext();
            this.isVideoPlaying = false;
          },
          { once: true }
        );
      }
    }
  }

  refreshSwiper(): void {
    console.log('🔁 Ręczne odświeżanie Swipera...');
    this.loadSwiperData();
  }

  ngOnDestroy(): void {
    this.combinedSubscription?.unsubscribe();
    this.mediaUpdateSubscription?.unsubscribe();
    this.tenantChangeSubscription?.unsubscribe();
    this.mySwiper?.destroy(true, true);
  }
}
