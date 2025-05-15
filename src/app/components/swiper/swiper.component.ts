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
import { combineLatest, Subscription } from 'rxjs';
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
  ) { }

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

  ngAfterViewInit(): void {
    // Swiper init will happen once media is loaded
  }

  private loadMediaData(): void {
    this.isLoading = true;
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
          setTimeout(() => this.initializeSwiper(), 0); // ensure DOM is rendered
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

    this.media.forEach((element) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      const filePath = `${environment.publicUrl}${element.filePath}`;

      if (element.filePath.endsWith('.mp4')) {
        const videoElement = document.createElement('video');
        videoElement.src = filePath;
        videoElement.setAttribute('muted', '');
        videoElement.muted = true;
        videoElement.setAttribute('playsinline', '');
        (videoElement as any).playsInline = true;
        videoElement.setAttribute('autoplay', '');
        videoElement.autoplay = true;
        videoElement.setAttribute('preload', 'auto');
        videoElement.style.width = '100vw';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';

        // Fallbacks for Safari/Firefox
        videoElement.addEventListener('loadeddata', checkIfAllMediaLoaded);
        videoElement.addEventListener('canplaythrough', checkIfAllMediaLoaded);
        videoElement.addEventListener('loadedmetadata', checkIfAllMediaLoaded);

        videoElement.addEventListener('ended', () => {
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        });

        slide.appendChild(videoElement);
      } else {
        const imgElement = document.createElement('img');
        imgElement.src = filePath;
        imgElement.style.width = '100vw';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'cover';
        imgElement.onload = checkIfAllMediaLoaded;
        slide.appendChild(imgElement);
      }

      swiperWrapper.appendChild(slide);
    });
  }

  private initializeSwiperInstance(): void {
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
                .catch((err) => {
                  console.warn('Autoplay failed, retrying on interaction:', err);
                });

              video.addEventListener('ended', () => {
                this.mySwiper.slideNext();
                this.isVideoPlaying = false;
              }, { once: true });
            } else {
              if (!this.isVideoPlaying) {
                this.mySwiper.autoplay.start();
              }
            }
          },
        },
      });

      // Auto-play first video if present
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
