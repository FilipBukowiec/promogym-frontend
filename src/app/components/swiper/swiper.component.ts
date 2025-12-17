import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, EMPTY, filter, Subject, takeUntil } from 'rxjs';
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
  private isVideoPlaying: boolean = false;
  private pictureTimer: any;
  private readonly onDestroy$ = new Subject();

  public isLoading: boolean = true;
  public pictureSlideDuration: number = 5;

  constructor(
    private mediaService: MediaService,
    private userSettingsService: UserSettingsService,
  ) {}

  public ngOnInit(): void {
    this.watchUserSettings();
    this.initSwiper();
    this.watchRefreshMedia();
  }

  private watchUserSettings(): void {
    this.userSettingsService.settings$
      .pipe(
        filter((settings) => !!settings),
        takeUntil(this.onDestroy$)
      )
      .subscribe((settings) => {
        if (settings?.pictureSlideDuration !== undefined) {
          this.pictureSlideDuration = settings.pictureSlideDuration;
        }
      });
  }

  private watchRefreshMedia(): void {
    this.mediaService
      .refreshMedia()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        error: (err) => {
          console.error('Błąd ładowania mediów:', err);
          this.isLoading = false;
        },
      });
  }

  private initSwiper(): void {
    this.mediaService.media$
      .pipe(
        filter((media) => media && media.length > 0),
        catchError((err) => {
          console.error('Błąd w inicjalizacji Swipera:', err);
          this.isLoading = false;
          return EMPTY;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe((media) => {
        this.media = media.sort((a, b) => a.order - b.order);
        this.destroySwiper();
        this.initializeSwiper();
      });
  }

  public destroySwiper(): void {
    if (this.pictureTimer) {
      clearTimeout(this.pictureTimer);
      this.pictureTimer = null;
    }
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

    const adjustStoryRendering = (
      mediaElement: HTMLVideoElement | HTMLImageElement,
      slideElement: HTMLElement,
      isStory: boolean
    ) => {
      if (!isStory) return;

      let community_logo = slideElement.querySelector('.community') as HTMLImageElement;
      if (!community_logo) {
        community_logo = document.createElement('img');
        community_logo.classList.add('community');
        community_logo.src = '/assets/images/community.gif';
        community_logo.style.height = '70px';
        community_logo.style.position = 'absolute';
        community_logo.style.top = '10px';
        community_logo.style.right = '20px';
        community_logo.style.zIndex = '10';
        slideElement.appendChild(community_logo);
      }

      let mediaWidth: number;
      let mediaHeight: number;

      if (mediaElement instanceof HTMLVideoElement) {
        mediaWidth = mediaElement.videoWidth;
        mediaHeight = mediaElement.videoHeight;
      } else {
        mediaWidth = mediaElement.naturalWidth;
        mediaHeight = mediaElement.naturalHeight;
      }

      const isHorizontal = mediaWidth > mediaHeight;

      if (isHorizontal) {
        if (mediaElement.parentElement !== slideElement) {
          slideElement.appendChild(mediaElement);
          const oldBox = slideElement.querySelector('.media-box');
          if (oldBox) oldBox.remove();
        }

        const oldHeader = slideElement.querySelector('.story-header');
        if (oldHeader) oldHeader.remove();

        slideElement.style.display = '';
        slideElement.style.alignItems = '';
        slideElement.style.justifyContent = '';
        slideElement.style.paddingBottom = '';

        mediaElement.style.border = 'none';
        mediaElement.style.borderRadius = '0';
        mediaElement.style.borderImageSource = 'none';
        mediaElement.style.marginTop = '0';
        mediaElement.style.width = '100vw';
        mediaElement.style.height = '100%';
        mediaElement.style.objectFit = 'cover';
      } else {
        let box = slideElement.querySelector('.media-box') as HTMLElement;

        slideElement.style.display = 'flex';
        slideElement.style.justifyContent = 'center';
        slideElement.style.alignItems = 'center';

        if (!box) {
          box = document.createElement('div');
          box.classList.add('media-box');
          box.style.width = '100vw';
          box.style.height = '100vh';
          box.style.backgroundImage = 'url("assets/images/sm_bg.jpg")';
          box.style.backgroundPosition = 'center';
          box.style.backgroundSize = 'cover';
          box.style.display = 'flex';
          box.style.justifyContent = 'center';
          box.style.alignItems = 'center';
          box.style.paddingBottom = '10vh';
          slideElement.appendChild(box);
        }

        if (mediaElement.parentElement !== box) {
          box.appendChild(mediaElement);
        }

        mediaElement.style.maxWidth = '100%';
        mediaElement.style.maxHeight = '90%';
        mediaElement.style.width = 'auto';
        mediaElement.style.height = 'auto';
        mediaElement.style.objectFit = 'contain';
        mediaElement.style.borderRadius = '25px';
        mediaElement.style.boxShadow = `0 -5px 15px 0 #00E5FF, 0 5px 25px 0 #D53AFF, 0 0 10px rgba(255, 255, 255, 0.5)`;
      }
    };

    this.media.forEach((element) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');

      let filePath: string;
      let loadedElement: HTMLVideoElement | HTMLImageElement | null = null;

      if (element.isStory) {
        filePath = element.filePath;
        const isVideo = element.fileType.startsWith('video/');

        if (isVideo) {
          const videoElement = document.createElement('video');
          videoElement.src = filePath;
          videoElement.muted = true;
          videoElement.setAttribute('playsinline', '');
          videoElement.setAttribute('preload', 'auto');
          slide.appendChild(videoElement);
          loadedElement = videoElement;
        } else {
          const imgElement = document.createElement('img');
          imgElement.src = filePath;
          slide.appendChild(imgElement);
          loadedElement = imgElement;
        }
      } else {
        filePath = `${environment.publicUrl}${element.filePath}`;
        const isVideo = element.fileType.startsWith('video/');

        if (isVideo) {
          const videoElement = document.createElement('video');
          videoElement.src = filePath;
          videoElement.muted = true;
          videoElement.setAttribute('playsinline', '');
          videoElement.setAttribute('preload', 'auto');
          videoElement.style.width = '100vw';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          slide.appendChild(videoElement);
          loadedElement = videoElement;
        } else {
          const imgElement = document.createElement('img');
          imgElement.src = filePath;
          imgElement.style.width = '100vw';
          imgElement.style.height = '100%';
          imgElement.style.objectFit = 'cover';
          slide.appendChild(imgElement);
          loadedElement = imgElement;
        }
      }

      if (loadedElement) {
        const handleMediaLoaded = () => {
          if (element.isStory) {
            adjustStoryRendering(loadedElement as HTMLVideoElement | HTMLImageElement, slide, true);
          }
          loadedMediaCount++;
          checkIfAllMediaLoaded();
        };

        if (loadedElement instanceof HTMLVideoElement) {
          loadedElement.addEventListener('loadeddata', handleMediaLoaded, { once: true });
          loadedElement.addEventListener('error', () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          });
        } else if (loadedElement instanceof HTMLImageElement) {
          loadedElement.onload = handleMediaLoaded;
          loadedElement.onerror = () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          };
        }
      } else {
        loadedMediaCount++;
        checkIfAllMediaLoaded();
      }

      swiperWrapper.appendChild(slide);
    });
  }

  public initializeSwiperInstance(): void {
    if (this.mySwiper) return;

    this.mySwiper = new Swiper('.swiper', {
      slidesPerView: 1,
      loop: true,
      autoplay: {
        delay: 60 * 60 * 1000,
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

    this.handleSlideChange();
  }

  private handleSlideChange(): void {
    if (this.pictureTimer) {
      clearTimeout(this.pictureTimer);
      this.pictureTimer = null;
    }

    const currentSlide = this.mySwiper.slides[this.mySwiper.activeIndex];
    if (!currentSlide) return;

    const video = currentSlide.querySelector('video') as HTMLVideoElement;

    if (video) {
      this.mySwiper.autoplay.stop();
      this.isVideoPlaying = true;
      video.currentTime = 0;
      video.play().catch((err) => {
        console.error('Błąd wideo:', err);
        this.mySwiper.slideNext();
      });

      video.onended = () => {
        this.isVideoPlaying = false;
        this.mySwiper.slideNext();
      };
    } else {
      this.isVideoPlaying = false;
      this.mySwiper.autoplay.stop();

      this.pictureTimer = setTimeout(() => {
        if (!this.isVideoPlaying) {
          this.mySwiper.slideNext();
        }
      }, this.pictureSlideDuration * 1000);
    }
  }

  public ngOnDestroy(): void {
    if (this.pictureTimer) {
      clearTimeout(this.pictureTimer);
      this.pictureTimer = null;
    }
    this.onDestroy$.next(void 0);
    this.onDestroy$.complete();
    if (this.mySwiper) {
      this.mySwiper.destroy(true, true);
    }
  }
}