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
  isLoading: boolean = true;
  private isVideoPlaying: boolean = false;
  pictureSlideDuration: number = 5;
  private readonly onDestroy$ = new Subject();

  constructor(private mediaService: MediaService, private userSettingsService: UserSettingsService, private tenantChangeService: TenantChangeService) {}

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
      const storyImgPath = 'assets/images/cf.jpg';
      let filePath: string;
      let loadedElement: HTMLVideoElement | HTMLImageElement; // Dodane dla ujednoliconej obsługi ładowania

      if (element.isStory) {
        // 🟢 LOGIKA DLA STORY

        // TWORZENIE KONTENERA DLA CENTROWANIA I RAMKI
        const box = document.createElement('div');
        box.style.width = '100vw';
        box.style.height = '100%';
        box.style.backgroundColor = 'black';
        box.style.display = 'flex';
        box.style.justifyContent = 'center';
        box.style.alignItems = 'flex-start';
        // box.style.gap = '10px'
        box.style.paddingTop='30px';
        slide.appendChild(box);

        // ... (Reszta stylów slajdu i storyHeader) ...
        slide.style.backgroundImage = `url('${storyImgPath}')`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';

        // ... (tworzenie storyHeader i slide.appendChild(storyHeader)) ...
        const storyHeader = document.createElement('span');
        storyHeader.textContent = 'Fajne Story!';
        storyHeader.style.position = 'absolute';
        storyHeader.style.top = '10px';
        storyHeader.style.left = '10%';
        storyHeader.style.color = 'white';
        storyHeader.style.backgroundColor = 'rgba(251, 0, 0, 0.5)';
        storyHeader.style.padding = '5px 10px';
        storyHeader.style.borderRadius = '5px';
        storyHeader.style.zIndex = '10';
        slide.appendChild(storyHeader);

        filePath = element.filePath;
        const isVideo = element.fileType.startsWith('video/');

        if (isVideo) {
          const videoElement = document.createElement('video');
          videoElement.src = filePath;
          videoElement.muted = true;
          videoElement.setAttribute('playsinline', '');
          videoElement.setAttribute('preload', 'auto');

          videoElement.style.maxWidth = '100%';
          videoElement.style.maxHeight = '100%';
          videoElement.style.objectFit = 'contain';
          videoElement.style.border = '8px solid grey';
          videoElement.style.borderRadius = '25px';

          box.appendChild(videoElement);
          loadedElement = videoElement; // Zapisz element do obsługi ładowania
        } else {
          // 🚨 POPRAWKA! Dodano obsługę obrazków w Story
          const imgElement = document.createElement('img');
          imgElement.src = filePath;

          imgElement.style.maxWidth = '100%';
          imgElement.style.maxHeight = '100%';
          imgElement.style.objectFit = 'contain';
          imgElement.style.border = '10px solid grey';
          imgElement.style.borderRadius = '20px';

          box.appendChild(imgElement); // Dodaj obraz do boxa (kontenera)
          loadedElement = imgElement; // Zapisz element do obsługi ładowania
        }
      } else {
        // 🔵 LOGIKA DLA STANDARDOWYCH SLIDE'ÓW
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
          // 🚨 POPRAWKA! Usuń element.isStory ? 'contain' : 'cover',
          // ponieważ jesteśmy w bloku "NIE Story", więc zawsze powinno być 'cover'.
          imgElement.style.objectFit = 'cover';
          slide.appendChild(imgElement);
          loadedElement = imgElement;
        }
      }

      // Ujednolicona obsługa ładowania mediów (przeniesiona poza if/else)
      if (loadedElement) {
        if (loadedElement instanceof HTMLVideoElement) {
          loadedElement.addEventListener('loadeddata', () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          });
          loadedElement.addEventListener('error', () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          });
        } else if (loadedElement instanceof HTMLImageElement) {
          loadedElement.onload = () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          };
          loadedElement.onerror = () => {
            loadedMediaCount++;
            checkIfAllMediaLoaded();
          };
        }
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
