import { Component } from "@angular/core";
import { UserSettingsService } from "../../services/user-settings.service";
import { LoaderComponent } from "../loader/loader.component";
import { CommonModule } from "@angular/common";
import { TenantChangeService } from "../../services/tenant-change.service";
import { Subject, takeUntil } from "rxjs";
import { ViewChild, ElementRef } from "@angular/core";
import { RouterLink } from "@angular/router";
import { QuoteService } from "../../services/quote.service";
import { ClockService } from "../../services/clock.service";



@Component({
  imports: [LoaderComponent, CommonModule, RouterLink],
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  styleUrls: ["./welcome.component.scss"],
})
export class WelcomeComponent {
  user: string = "";
  today: string = "";
  todayQuote: string = "";
  isLoading: boolean = true;
  isStarting: boolean = false;
  email: string = "";
  private destroy$ = new Subject<void>();

  @ViewChild('bgVideo', { static: false }) bgVideoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    public clockService: ClockService,
    private quoteService: QuoteService,
    private userSettingsService: UserSettingsService,
    private tenantChangeService: TenantChangeService,
  ) { }

  ngOnInit(): void {
    this.loadSettings();
    this.tenantChangeService.tenantChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoading = true;
        this.isStarting = false;
        this.loadSettings();
      });

    const date = new Date();
    this.today = date.toLocaleDateString();
    this.todayQuote = this.quoteService.getQuoteOfTheDay();

  };

  ngAfterViewInit(): void {
    if (this.bgVideoRef?.nativeElement) {
      const video = this.bgVideoRef.nativeElement;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video
        .play()
        .catch((err) => console.warn('🎥 Autoplay blocked:', err));
    }
  }


  private loadSettings() {
    this.userSettingsService.getSettings().subscribe((settings) => {
      this.user = settings.name;
      this.isLoading = false;
      this.isStarting = true;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
