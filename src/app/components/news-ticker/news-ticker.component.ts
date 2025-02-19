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
  private newsSubscription!: Subscription;

  constructor(private newsService: NewsService) {}

  ngAfterViewInit(): void {
    this.initializeMarquee();
    // this.subscribeToNewsUpdates();
  }

  // subscribeToNewsUpdates(): void {
  //   this.newsSubscription = this.newsService.news$.subscribe((news: News[]) => {
  //     console.log('Zmienione dane na backendzie:', news);
  //     this.newsList = news;
  //     this.resetMarquee();
  //   });
  // }

  resetMarquee(): void {
    console.log('Komponent NewsTickerComponent został załadowany');
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
    const $marquee = this.marqueeElement.nativeElement;
    this.marqueeInstance = new Marquee($marquee, {
      rate: -110,
    });

    this.loopInstance = loop(
      this.marqueeInstance,
      this.newsList.map((news) => () => news.content),
      () => {
        const $separator = document.createElement('img');
        $separator.src = '/assets/images/promogym_logo1.svg';
        $separator.style.height = '4.5rem';
        $separator.style.padding = '0 3rem';
        $separator.style.paddingBottom = '0.5rem';

        return $separator;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.newsSubscription) {
      this.newsSubscription.unsubscribe();
    }
    if (this.marqueeInstance) {
      this.marqueeInstance = undefined; 
    }
  }
}
