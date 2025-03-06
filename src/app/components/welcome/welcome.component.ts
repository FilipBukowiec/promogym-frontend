import { Component } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

@Component({

  // imports: [GlobeComponent],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  user: string = "";

  constructor(private settingsService: SettingsService){}

ngOnInit():void {
  this.settingsService.getSettings().subscribe(settings => {
    this.user = settings.name;
  })

  }
}
