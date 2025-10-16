import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, combineLatest, EMPTY, map, Subject, Subscription, take, takeUntil } from 'rxjs';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
import { environment } from '../../../environments/environment';
import { Media } from '../../models/media.model';
import { MediaService } from '../../services/media.service';
import { TenantChangeService } from '../../services/tenant-change.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { LoaderComponent } from '../loader/loader.component';

Swiper.use([Autoplay]);

@Component({
  selector: 'app-swiper',
  templateUrl: './swiper.component.html',
  styleUrls: ['./swiper.component.scss'],
  standalone: true,
  imports: [LoaderComponent, CommonModule],
})
export class SwiperComponent implements OnInit, OnDestroy {
  @Input() media: Media[] = [];
  private mySwiper!: Swiper;
  isLoading: boolean = true;
  private isVideoPlaying: boolean = false;
  pictureSlideDuration: number = 5;
  private readonly onDestroy$ = new Subject();

  constructor(private mediaService: MediaService, private userSettingsService: UserSettingsService, private tenantChangeService: TenantChangeService) {}

  public ngOnInit(): void {
    this.watchRefreshMedia();
    this.initPictureSlideDuration();
    this.initSwiper();
  }

  private watchRefreshMedia(): void {
    this.mediaService.refreshMedia().pipe(takeUntil(this.onDestroy$)).subscribe();
  }

  private initSwiper(): void {
    combineLatest([this.mediaService.media$, this.tenantChangeService.tenantChanged$])
      .pipe(
        map((data) => data[0]),
        catchError(() => {
          this.isLoading = false;
          return EMPTY;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe((media) => {
        if (!media || media.length === 0) {
          throw new Error('Brak mediów do załadowania.');
        }
        this.media = media.sort((a, b) => a.order - b.order);
        this.destroySwiper();
        this.initializeSwiper();
      });
  }

  private initPictureSlideDuration(): void {
    this.userSettingsService.settings$.subscribe((settings) => {
      if (settings?.pictureSlideDuration) {
        this.pictureSlideDuration = settings.pictureSlideDuration;
      }
    });
  }

  public destroySwiper(): void {
    if (this.mySwiper) {
      this.mySwiper.destroy(true, true);
      this.mySwiper = null as any;
    }
  }

  public initializeSwiper(): void {
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

      if (element.filePath.endsWith('.mp4') || element.filePath.endsWith('.mov')) {
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

  public initializeSwiperInstance(): void {
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

  public ngOnDestroy(): void {
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
    this.mySwiper?.destroy(true, true);
  }
}
