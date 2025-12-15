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

    const adjustStoryRendering = (mediaElement: HTMLVideoElement | HTMLImageElement, slideElement: HTMLElement, isStory: boolean) => {
      // Jeśli to NIE jest story, nic nie rób (zostaw domyślne style z pętli głównej)
      if (!isStory) return;

      let mediaWidth: number;
      let mediaHeight: number;

      // Pobierz wymiary
      if (mediaElement instanceof HTMLVideoElement) {
        mediaWidth = mediaElement.videoWidth;
        mediaHeight = mediaElement.videoHeight;
      } else {
        mediaWidth = mediaElement.naturalWidth;
        mediaHeight = mediaElement.naturalHeight;
      }

      const isHorizontal = mediaWidth > mediaHeight;

      // 1. SCENARIUSZ: SZERSZE NIŻ WYŻSZE (Traktuj jak !story)
      if (isHorizontal) {
        // Upewnij się, że element jest bezpośrednio w slide (nie w boxie)
        if (mediaElement.parentElement !== slideElement) {
          slideElement.appendChild(mediaElement);
          // Ewentualnie usuń box jeśli istnieje i jest pusty
          const oldBox = slideElement.querySelector('.media-box');
          if (oldBox) oldBox.remove();
        }

        // 🚨 CZYSZCZENIE: Usuwanie stylów i headera z trybu telefonu (Vertical)
        const oldHeader = slideElement.querySelector('.story-header');
        if (oldHeader) oldHeader.remove();
        slideElement.style.display = '';
        slideElement.style.alignItems = '';
        slideElement.style.justifyContent = '';
        slideElement.style.paddingBottom = ''; // Reset paddingu

        // Reset stylów ramki (gdyby były wcześniej nadane)
        mediaElement.style.border = 'none';
        mediaElement.style.borderRadius = '0';
        mediaElement.style.borderImageSource = 'none';
        mediaElement.style.marginTop = '0';

        // Style Fullscreen Cover (jak w !story)
        mediaElement.style.width = '100vw';
        mediaElement.style.height = '100%';
        mediaElement.style.objectFit = 'cover';
      }
      // 2. SCENARIUSZ: WYŻSZE NIŻ SZERSZE (Twórz Box, Ramkę i Flex-Start)
      else {
        // Sprawdź czy box już istnieje
        let box = slideElement.querySelector('.media-box') as HTMLElement;

        // 🚨 1. STYLE SLIDE'u: Definiowanie obszaru roboczego 93vh
        // Rodzic (slideElement) staje się kontenerem Flex do centrowania BOXA.
        slideElement.style.display = 'flex';
        slideElement.style.justifyContent = 'center';
        slideElement.style.alignItems = 'center';

        // 2. Tworzenie HEADERA (Tylko dla trybu telefonu)
        let storyHeader = slideElement.querySelector('.story-header') as HTMLElement;
        if (!storyHeader) {
          storyHeader = document.createElement('span');
          storyHeader.classList.add('story-header');
          storyHeader.textContent = 'Fajne Story!';
          storyHeader.style.position = 'absolute';
          storyHeader.style.top = '10px';
          storyHeader.style.left = '10%';
          storyHeader.style.color = 'white';
          storyHeader.style.backgroundColor = 'rgba(251, 0, 0, 0.5)';
          storyHeader.style.padding = '5px 10px';
          storyHeader.style.borderRadius = '5px';
          storyHeader.style.zIndex = '10';
          slideElement.appendChild(storyHeader);
        }

        // 3. Tworzenie KONTENERA 'BOX' (Obszar roboczy 93vh)
        if (!box) {
          box = document.createElement('div');
          box.classList.add('media-box');

          box.style.width = '100vw';
          box.style.height = '100%';
box.style.border = "1px solid red"
          box.style.display = 'flex';
          box.style.justifyContent = 'center';
          box.style.alignItems = 'center';
box.style.paddingBottom = '7vh'
          slideElement.appendChild(box);
        }

        // 4. Przenieś element media do boxa
        if (mediaElement.parentElement !== box) {
          box.appendChild(mediaElement);
        }

        // 5. Style Elementu (Telefon)
        mediaElement.style.maxWidth = '100%';

        mediaElement.style.maxHeight = '85%';
        mediaElement.style.width = 'auto';
        mediaElement.style.height = 'auto';
        mediaElement.style.objectFit = 'contain';
        mediaElement.style.border = '5px solid grey';
        mediaElement.style.borderRadius = '25px';
      }
    };

    // --- GŁÓWNA PĘTLA ---
    this.media.forEach((element) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      // const storyImgPath = 'assets/images/cf.jpg';
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
        // 🔵 LOGIKA DLA STANDARDOWYCH SLIDE'ÓW (!STORY) - BEZ ZMIAN
        filePath = `${environment.publicUrl}${element.filePath}`;
        const isVideo = element.fileType.startsWith('video/');

        if (isVideo) {
          const videoElement = document.createElement('video');
          videoElement.src = filePath;
          videoElement.muted = true;
          videoElement.setAttribute('playsinline', '');
          videoElement.setAttribute('preload', 'auto');

          // Standardowe style cover
          videoElement.style.width = '100vw';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';

          slide.appendChild(videoElement);
          loadedElement = videoElement;
        } else {
          const imgElement = document.createElement('img');
          imgElement.src = filePath;

          // Standardowe style cover
          imgElement.style.width = '100vw';
          imgElement.style.height = '100%';
          imgElement.style.objectFit = 'cover';

          slide.appendChild(imgElement);
          loadedElement = imgElement;
        }
      }

      // --- OBSŁUGA ŁADOWANIA I URUCHOMIENIE LOGIKI WYMIARÓW ---
      if (loadedElement) {
        const handleMediaLoaded = () => {
          // Tu jest cała magia: sprawdzamy wymiary i decydujemy czy tworzyć box, czy robić fullscreen
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
        // Fallback gdyby loadedElement był null (np. nieobsługiwany typ)
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
