import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { Marquee, loop, LoopReturn } from 'dynamic-marquee';
import { News } from '../../models/news.model';
import { NewsService } from '../../services/news.service';
import { Subscription } from 'rxjs';
import { UserSettingsService } from '../../services/user-settings.service';
import { UserSettings } from '../../models/user-settings.model';
import { RetryHelperService } from '../../services/retry-helper.service';
import { TenantChangeService } from '../../services/tenant-change.service'; // Dodajemy serwis do zmian tenant'a
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-news-ticker',
  standalone: true,
  templateUrl: './news-ticker.component.html',
  styleUrls: ['./news-ticker.component.scss'],
})
export class NewsTickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('marquee') marqueeElement!: ElementRef<HTMLElement>;
  marqueeInstance?: Marquee;
  loopInstance?: LoopReturn;
  newsList: News[] = [];
  userSettings: UserSettings | null = null;

  private newsSubscription?: Subscription;
  private settingsSubscription?: Subscription;
  private tenantChangeSubscription?: Subscription; // Subskrypcja na zmiany tenant'a

  constructor(
    private newsService: NewsService,
    private userSettingsService: UserSettingsService,
    private retryHelper: RetryHelperService,
    private tenantChangeService: TenantChangeService // Iniekcja serwisu do zmian tenant'a
  ) {}

  ngAfterViewInit(): void {
    // Pobieranie ustawień użytkownika
    this.settingsSubscription = this.retryHelper
      .withRetry(this.userSettingsService.getSettings())
      .subscribe({
        next: (settings) => {
          this.userSettings = settings;
          this.subscribeToNewsUpdates();
        },
        error: (err) => {
          console.error('❌ Błąd pobierania ustawień po ponowieniach:', err);
          // Nawet jeśli się nie udało – pokażemy newsy
          this.subscribeToNewsUpdates();
        },
      });

    // Subskrypcja na zmiany tenant'a
    this.tenantChangeSubscription =
      this.tenantChangeService.tenantChanged$.subscribe(() => {
        this.retryHelper
          .withRetry(this.userSettingsService.getSettings())
          .subscribe({
            next: (settings) => {
              this.userSettings = settings;
              this.loadNews();
            },
            error: (err) => {
              console.error(
                "❌ Błąd przy pobieraniu ustawień po zmianie tenant'a:",
                err
              );
              this.loadNews(); // fallback
            },
          });
      });
  }

  subscribeToNewsUpdates(): void {
    if (this.newsSubscription) {
      this.newsSubscription.unsubscribe();
    }

    this.newsSubscription = this.newsService.news$.subscribe((news: News[]) => {
      this.newsList = news;
      if (this.marqueeElement?.nativeElement) {
        this.resetMarquee();
      }
    });
  }

  loadNews(): void {
    this.newsService.getNewsByTenant().subscribe((news: News[]) => {
      if (!news || news.length === 0) {
        console.warn('⚠️ Brak newsów do wyświetlenia.');
        return;
      }

      this.newsList = news;
      if (this.marqueeElement?.nativeElement) {
        this.resetMarquee();
      }
    });
  }

  resetMarquee(): void {
    console.log('🔄 Resetowanie marquee');

    if (this.marqueeInstance) {
      this.marqueeInstance = undefined;
    }

    const $marquee = this.marqueeElement.nativeElement;
    while ($marquee.firstChild) {
      $marquee.removeChild($marquee.firstChild);
    }

    this.initializeMarquee();
  }

  initializeMarquee(): void {
    if (!this.marqueeElement?.nativeElement || this.newsList.length === 0)
      return;

    const $marquee = this.marqueeElement.nativeElement;
    this.marqueeInstance = new Marquee($marquee, {
      rate: -110,
    });

    console.log(
      '📰 Tworzenie marquee z logo:',
      this.userSettings?.logoFilePath
    );

    this.loopInstance = loop(
      this.marqueeInstance,
      this.newsList.map((news) => () => news.content),
      () => {
        const $separator = document.createElement('img');
        const path = this.userSettings?.separatorFilePath?.trim();
        $separator.src = path
          ? `${environment.publicUrl}${path}`
          : '/assets/images/promogym_logo1.svg';

        const width = window.innerWidth;

        if (width <= 430) {
          $separator.style.height = '1.5rem';
          $separator.style.padding = '0 1rem';
          // $separator.style.paddingBottom = '0.5rem';
        } else if (width > 430 && width <= 767) {
          $separator.style.height = '3rem';
          $separator.style.padding = '0 2rem';
          $separator.style.paddingBottom = '0.2rem';
        } else if (width > 767) {
          $separator.style.height = '4rem';
          $separator.style.padding = '0 3rem';
          $separator.style.paddingBottom = '0.5rem';
        }
        return $separator;
      }
    );
  }

  ngOnDestroy(): void {
    this.newsSubscription?.unsubscribe();
    this.settingsSubscription?.unsubscribe();
    this.tenantChangeSubscription?.unsubscribe(); // Usuwamy subskrypcję tenant'a
    this.marqueeInstance = undefined;
  }
}
