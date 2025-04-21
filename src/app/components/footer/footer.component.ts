import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClockService } from '../../services/clock.service';
import { UserSettingsService } from '../../services/user-settings.service';
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

  logoPath: string = '/assets/images/promogym_logo1.svg';


  
  constructor(
    private clockService: ClockService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.clockService.currentTime$,
      this.userSettingsService.observeSettings(),
    ]).subscribe({
      next: ([currentTime, settings]) => {

        console.log('⏳ Otrzymane settings w FooterComponent:', settings);
        this.currentTime = currentTime;
        this.evaluateVisibility(settings);
        this.logoPath = settings?.logoFilePath?.trim()
      ? `http://localhost:3000/${settings.logoFilePath}`
      : '/assets/images/promogym_logo1.svg';
      },
      error: (error) => console.error('❌ Błąd w subscribe:', error),
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
        
    if (!settings || !settings.footerVisibilityRules || settings.footerVisibilityRules.length === 0) {
      console.warn('⚠️ Brak reguł widoczności stopki lub ustawienia są niepoprawne!');
      return;
    }
  
    this.isVisible = false; // Resetuj widoczność
  
    settings.footerVisibilityRules.forEach((rule: any) => {
      console.log(`⏳ Sprawdzam regułę: ${JSON.stringify(rule)}`);
  
      if (
        rule.startMinute !== undefined &&
        rule.endMinute !== undefined &&
        rule.startMinute !== null &&
        rule.endMinute !== null &&
        currentMinute >= rule.startMinute &&
        currentMinute <= rule.endMinute
      ) {
        console.log('✅ Warunek spełniony, stopka powinna być widoczna!');
        this.isVisible = true;
      }
    });
  
    console.log('👀 Stopka widoczna?', this.isVisible);
  }
  
}
