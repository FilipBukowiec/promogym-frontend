import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClockService } from '../../services/clock.service';
import { SettingsService } from '../../services/settings.service';
import { combineLatest, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NewsTickerComponent } from '../news-ticker/news-ticker.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NewsTickerComponent, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  isVisible: boolean = false;
  private subscription: Subscription | undefined;

  constructor(
    private clockService: ClockService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.clockService.currentTime$,
    ]).subscribe({
      next: ([currentTime, 
        // settings
      ]) => {
        this.currentTime = currentTime;
      },
      error: (error) => console.error('Error observing combineLatest changes', error),
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private evaluateVisibility(settings: any): void {
    const now = new Date();
    const currentMinute = now.getMinutes();

    this.isVisible = false; // Reset na początku

    if (settings?.footerVisibilityRules) {
      settings.footerVisibilityRules.forEach((rule: any) => {
        if (
          rule.startMinute !== null &&
          rule.endMinute !== null &&
          currentMinute >= rule.startMinute &&
          currentMinute <= rule.endMinute
        ) {
          this.isVisible = true; // Ustaw na true jeśli warunek spełniony
        }
      });
    }
  }
}
