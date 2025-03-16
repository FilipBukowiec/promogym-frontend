import { Component } from "@angular/core";
import { UserSettingsService } from "../../services/user-settings.service";
import { LoaderComponent } from "../loader/loader.component";
import { CommonModule } from "@angular/common";

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

  constructor(private userSettingsService: UserSettingsService) {}

  ngOnInit(): void {
    this.userSettingsService.getSettings().subscribe((settings) => {
      this.user = settings.name;
      this.isLoading = false;
      this.isStarting = true;
    });
  }
}
