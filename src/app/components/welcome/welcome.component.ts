import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { filter, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Sentence } from '../../models/sentence.model';
import { ClockService } from '../../services/clock.service';
import { SentencesService } from '../../services/sentences.service';
import { TenantChangeService } from '../../services/tenant-change.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  imports: [LoaderComponent, CommonModule, RouterLink],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  user: string = '';
  today: string = '';
  todayQuote!: Observable<Sentence>;
  isLoading: boolean = true;
  isStarting: boolean = false;
  email: string = '';
  private destroy$ = new Subject<void>();

  @ViewChild('bgVideo', { static: false }) bgVideoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    public clockService: ClockService,
    private sentencesService: SentencesService,
    private userSettingsService: UserSettingsService,
    private tenantChangeService: TenantChangeService
  ) {}

  ngOnInit(): void {
    this.tenantChangeService.tenantChanged$
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = true;
          this.isStarting = false;
        }),
        switchMap(() => this.userSettingsService.settings$),
        filter(settings => !!settings),
        tap((settings) => {
          {
            this.user = settings.name;
            this.isLoading = false;
            this.isStarting = true;
          }
        })
      )
      .subscribe();

    const date = new Date();
    this.today = date.toLocaleDateString();
    this.todayQuote = this.sentencesService.getSentenceOfTheDay();
  }

  ngAfterViewInit(): void {
    if (this.bgVideoRef?.nativeElement) {
      const video = this.bgVideoRef.nativeElement;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.play().catch((err) => console.warn('🎥 Autoplay blocked:', err));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
