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
import { Subscription } from 'rxjs';
import { UserSettingsService } from '../../services/user-settings.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { TenantChangeService } from '../../services/tenant-change.service';
import { environment } from '../../../environments/environment';

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
  private dataLoadSubscription: Subscription | null = null;
  private mediaUpdateSubscription!: Subscription;
  private tenantChangeSubscription!: Subscription;

  constructor(
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
    private retryHelper: RetryHelperService,
    private tenantChangeService: TenantChangeService,
  ) {}

  ngOnInit(): void {
    this.userSettingsService.getSettings().subscribe((settings) => {
      if (settings?.pictureSlideDuration) {
        this.pictureSlideDuration = settings.pictureSlideDuration;
      }
    });

    this.mediaUpdateSubscription = this.mediaService.media$.subscribe(() => {
      this.loadMediaData();
    });

    this.tenantChangeSubscription = this.tenantChangeService.tenantChanged$.subscribe(() => {
      this.loadMediaData();
    });

    this.loadMediaData();
  }

  private loadMediaData(): void {
    if (this.dataLoadSubscription) {
      this.dataLoadSubscription.unsubscribe();
    }

    this.dataLoadSubscription = this.retryHelper
      .withRetry(this.mediaService.getFilesForSwiper())
      .subscribe({
        next: (media) => {
          if (!media || media.length === 0) {
            throw new Error('Brak mediów do załadowania.');
          }

          this.media = media.sort((a, b) => a.order - b.order);
          this.destroySwiper();
          this.initializeSwiper();
        },
        error: (error) => {
          console.error('❌ Błąd podczas pobierania mediów:', error);
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
      const filePath = `${environment.publicUrl}${element.filePath}`;

      if (element.filePath.endsWith('.mp4')) {
        const videoElement = document.createElement('video');
        videoElement.src = filePath;
        videoElement.muted = true;
        videoElement.setAttribute('playsinline', '');
        // videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('preload', 'auto');
        videoElement.style.width = '100vw';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        slide.appendChild(videoElement);

        videoElement.addEventListener('loadeddata', () => {
          loadedMediaCount++;
          checkIfAllMediaLoaded();
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
          delay: 60 * 60 * 1000, // 1 godzina – ręczna kontrola przejść
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
            this.handleSlideChange();
          },
        },
      });

      // Obsługa pierwszego slajdu
      this.handleSlideChange();
    }
  }

  private handleSlideChange(): void {
    const currentSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
    const video = currentSlide.querySelector('video') as HTMLVideoElement;

    if (video) {
      this.mySwiper.autoplay.stop();
      video.currentTime = 0;
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('preload', 'auto');

      video
        .play()
        .then(() => {
          this.isVideoPlaying = true;
        })
        .catch((err) => {
          console.error('Błąd odtwarzania wideo:', err);
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        });

      video.addEventListener(
        'ended',
        () => {
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        },
        { once: true }
      );
    } else {
      this.isVideoPlaying = false;
      this.mySwiper.autoplay.stop();

      setTimeout(() => {
        if (!this.isVideoPlaying) {
          this.mySwiper.slideNext();
        }
      }, this.pictureSlideDuration * 1000);
    }
  }

  refreshSwiper(): void {
    this.loadMediaData();
  }

  ngOnDestroy(): void {
    this.dataLoadSubscription?.unsubscribe();
    this.mediaUpdateSubscription?.unsubscribe();
    this.tenantChangeSubscription?.unsubscribe();
    this.mySwiper?.destroy(true, true);
  }
}
