import { Component } from "@angular/core";
import { UserSettingsService } from "../../services/user-settings.service";
import { LoaderComponent } from "../loader/loader.component";
import { CommonModule } from "@angular/common";
import { TenantChangeService } from "../../services/tenant-change.service";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../services/auth.service";

@Component({
  imports: [LoaderComponent, CommonModule],
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  styleUrls: ["./welcome.component.scss"],
})
export class WelcomeComponent {
  user: string = "";
  isLoading: boolean = true;
  isStarting: boolean = false;
  private destroy$ = new Subject<void>();
  email: string = "";

  constructor(
    private userSettingsService: UserSettingsService,
    private tenantChangeService: TenantChangeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSettings();

    // 🔁 Subskrybujemy zmianę tenantów
    this.tenantChangeService.tenantChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoading = true;
        this.isStarting = false;
        this.loadSettings(); // <-- ponownie pobierz dane
      });
    
  };


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
