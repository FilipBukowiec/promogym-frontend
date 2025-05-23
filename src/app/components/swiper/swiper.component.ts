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
import { MediaService } from '../../services/media.service';
import { Media } from '../../models/media.model';
import { LoaderComponent } from '../loader/loader.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserSettingsService } from '../../services/user-settings.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { TenantChangeService } from '../../services/tenant-change.service';
import { environment } from '../../../environments/environment';

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
  ) {}

  ngOnInit(): void {
    this.mediaUpdateSubscription = this.mediaService.media$.subscribe(() => this.loadMediaData());
    this.tenantChangeSubscription = this.tenantChangeService.tenantChanged$.subscribe(() => this.loadMediaData());

    this.userSettingsService.getSettings().subscribe((settings) => {
      if (settings?.pictureSlideDuration) {
        this.pictureSlideDuration = settings.pictureSlideDuration;
      }
    });

    this.loadMediaData();
  }

  ngAfterViewInit(): void {}

  private loadMediaData(): void {
    this.isLoading = true;
    this.dataLoadSubscription?.unsubscribe();

    this.dataLoadSubscription = this.retryHelper.withRetry(this.mediaService.getFilesForSwiper()).subscribe({
      next: (media) => {
        if (!media || media.length === 0) {
          this.isLoading = false;
          throw new Error('Brak mediów do załadowania.');
        }

        this.media = media.sort((a, b) => a.order - b.order);
        this.destroySwiper();

        Promise.resolve().then(() => this.initializeSwiper());
      },
      error: (error) => {
        console.error('❌ Błąd podczas pobierania mediów:', error);
        this.isLoading = false;
      },
    });
  }

  private initializeSwiper(): void {
    const wrapper = this.swiperWrapperRef?.nativeElement as HTMLElement;
    if (!wrapper) return;

    wrapper.innerHTML = '';

    let loaded = 0;
    const total = this.media.length;
    const onLoaded = () => {
      loaded++;
      if (loaded === total) {
        this.isLoading = false;
        this.initializeSwiperInstance();
      }
    };

    this.media.forEach((item) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      const path = `${environment.publicUrl}${item.filePath}`;

    if (item.filePath.endsWith('.mp4')) {
  const video = document.createElement('video');
  video.muted = true;
  video.setAttribute('playsinline', '');         // <--- tutaj!
  video.setAttribute('webkit-playsinline', '');  // <--- i tutaj!
  video.autoplay = true;
  video.preload = 'auto';
  video.style.width = '100vw';
  video.style.height = '100%';
  video.style.objectFit = 'cover';

  video.src = path;

        video.addEventListener('loadeddata', onLoaded);
        video.addEventListener('canplaythrough', onLoaded);
        video.addEventListener('loadedmetadata', onLoaded);

        slide.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = path;
        img.style.width = '100vw';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.onload = onLoaded;
        slide.appendChild(img);
      }

      wrapper.appendChild(slide);
    });
  }

  private initializeSwiperInstance(): void {
    if (this.mySwiper) return;

    this.mySwiper = new Swiper('.swiper', {
      slidesPerView: 1,
      loop: true,
      autoplay: false,
      speed: 800,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      allowTouchMove: true,
      on: {
        slideChangeTransitionStart: () => this.handleSlideChange(),
      },
    });

    // Użyj requestAnimationFrame żeby na pewno uruchomić po renderze
    requestAnimationFrame(() => {
      this.handleSlideChange();
    });
  }

  private handleSlideChange(): void {
    const currentSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
    const video = currentSlide.querySelector('video') as HTMLVideoElement;

    if (video) {
      this.isVideoPlaying = true;
      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', '');

      // Zagraj video z małym delayem na iOS
      setTimeout(() => {
        video.play().catch((err) => {
          console.warn('Nie udało się odtworzyć wideo:', err);
          this.isVideoPlaying = false;
          this.mySwiper.slideNext();
        });
      }, 200);

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
      setTimeout(() => {
        if (!this.isVideoPlaying) {
          this.mySwiper.slideNext();
        }
      }, this.pictureSlideDuration * 1000);
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
    this.destroySwiper();
  }
}
