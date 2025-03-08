import { Component } from '@angular/core';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({

  // imports: [GlobeComponent],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  user: string = "";

  constructor(private userSettingsService: UserSettingsService){}

ngOnInit():void {
  this.userSettingsService.getSettings().subscribe(settings => {
    this.user = settings.name;
  })

  }
}
