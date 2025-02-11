import { Component } from '@angular/core';
import { GlobeComponent } from '../globe/globe.component';  // Importujemy GlobeComponent

@Component({

  // imports: [GlobeComponent],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  // Możesz dodać logikę do komponentu WelcomeComponent, np. dane powitalne
}
