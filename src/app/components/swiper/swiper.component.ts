import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
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
  @ViewChild('swiperWrapper', { static: false }) swiperWrapperRef!: ElementRef;

  private mySwiper!: Swiper;
  isLoading = true;
  private isVideoPlaying = false;
  pictureSlideDuration = 5;

  private dataLoadSubscription?: Subscription;
  private mediaUpdateSubscription?: Subscription;
  private tenantChangeSubscription?: Subscription;

  constructor(
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
    private retryHelper: RetryHelperService,
    private tenantChangeService: TenantChangeService
  ) { }

  ngOnInit(): void {
    this.mediaUpdateSubscription = this.mediaService.media$.subscribe(() => {
      this.loadMediaData();
    });

    this.tenantChangeSubscription = this.tenantChangeService.tenantChanged$.subscribe(() => {
      this.loadMediaData();
    });

    this.userSettingsService.getSettings().subscribe((settings) => {
      if (settings?.pictureSlideDuration) {
        this.pictureSlideDuration = settings.pictureSlideDuration;
      }
    });

    this.loadMediaData();
  }

  ngAfterViewInit(): void {
    // Swiper init happens after media is loaded (in loadMediaData -> initializeSwiper)
  }

  private loadMediaData(): void {
    this.isLoading = true;
    this.dataLoadSubscription?.unsubscribe();

    this.dataLoadSubscription = this.retryHelper
      .withRetry(this.mediaService.getFilesForSwiper())
      .subscribe({
        next: (media) => {
          if (!media || media.length === 0) {
            this.isLoading = false;
            throw new Error('Brak mediów do załadowania.');
          }

          this.media = media.sort((a, b) => a.order - b.order);
          this.destroySwiper();

          // Używamy Promise + nextTick do pewnego odświeżenia DOM
          Promise.resolve().then(() => this.initializeSwiper());
        },
        error: (error) => {
          console.error('❌ Błąd podczas pobierania mediów:', error);
          this.isLoading = false;
        },
      });
  }

  private initializeSwiper(): void {
    const swiperWrapper = this.swiperWrapperRef?.nativeElement as HTMLElement;
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = '';

    let loadedMediaCount = 0;
    const totalMediaCount = this.media.length;

    const checkIfAllMediaLoaded = () => {
      loadedMediaCount++;
      if (loadedMediaCount === totalMediaCount) {
        this.isLoading = false;
        this.initializeSwiperInstance();
      }
    };

    this.media.forEach((mediaItem) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      const filePath = `${environment.publicUrl}${mediaItem.filePath}`;

      if (mediaItem.filePath.endsWith('.mp4')) {
        const video = document.createElement('video');
        video.src = filePath;
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        // (video as any).playsInline = true;
        // video.setAttribute('autoplay', '');
        // video.autoplay = true;
        video.setAttribute('preload', 'auto');
        video.style.width = '100vw';
        video.style.height = '100%';
        video.style.objectFit = 'cover';

        // Ładowanie wideo - zdarzenia zapewniające, że video jest gotowe
        const loadHandler = () => {
          video.removeEventListener('loadeddata', loadHandler);
          video.removeEventListener('canplaythrough', loadHandler);
          video.removeEventListener('loadedmetadata', loadHandler);
          checkIfAllMediaLoaded();
        };

        video.addEventListener('loadeddata', loadHandler);
        video.addEventListener('canplaythrough', loadHandler);
        video.addEventListener('loadedmetadata', loadHandler);

        video.addEventListener('ended', () => {
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        });

        slide.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = filePath;
        img.style.width = '100vw';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        img.onload = () => {
          checkIfAllMediaLoaded();
        };

        slide.appendChild(img);
      }

      swiperWrapper.appendChild(slide);
    });
  }

  private initializeSwiperInstance(): void {
    if (this.mySwiper) return;

    this.mySwiper = new Swiper('.swiper', {
      slidesPerView: 1,
      loop: true,
      autoplay: {
        delay: this.pictureSlideDuration * 1000,
        disableOnInteraction: false,
      },
      speed: 800,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      allowTouchMove: true,
      on: {
        slideChangeTransitionStart: () => {
          const currentSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
          const video = currentSlide.querySelector('video') as HTMLVideoElement;

          if (video) {
            this.mySwiper.autoplay.stop();
            video.currentTime = 0;

            video.play()
              .then(() => (this.isVideoPlaying = true))
              .catch((err) => {
                console.warn('Autoplay video failed:', err);
                // Możesz tu dodać retry na interakcję użytkownika, jeśli chcesz
              });

            // Ustawiamy event listener tylko raz dla 'ended', żeby uniknąć multiplikacji
            video.addEventListener(
              'ended',
              () => {
                this.isVideoPlaying = false;
                this.mySwiper.slideNext();
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

    // Auto-play pierwszego video jeśli jest
    const firstSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
    const firstVideo = firstSlide.querySelector('video') as HTMLVideoElement;

    if (firstVideo) {
      this.mySwiper.autoplay.stop();
      firstVideo.currentTime = 0;

      firstVideo.play()
        .then(() => (this.isVideoPlaying = true))
        .catch((err) => console.error('Błąd odtwarzania pierwszego wideo:', err));

      firstVideo.addEventListener(
        'ended',
        () => {
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        },
        { once: true }
      );
    }
  }

  destroySwiper(): void {
    if (this.mySwiper) {
      this.mySwiper.destroy(true, true);
      this.mySwiper = null as any;
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
