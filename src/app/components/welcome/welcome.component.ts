import { Component } from '@angular/core';
import { GlobeComponent } from '../globe/globe.component';

@Component({
  selector: 'app-welcome',
  imports: [GlobeComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {

}
