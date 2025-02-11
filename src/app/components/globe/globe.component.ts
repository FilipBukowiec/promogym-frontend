import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import Globe from 'globe.gl';  // Importujemy bibliotekę three-globe

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.scss']
})
export class GlobeComponent implements AfterViewInit {
  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRef;
  private globeInstance: any;  // Typ any, ponieważ Globe jest obiektem dynamicznym

  ngAfterViewInit() {
    // Tworzymy instancję globu
    this.globeInstance = new Globe(this.globeContainer.nativeElement)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')  // Ziemia
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')  // Tekstura wypukłości
      .backgroundColor('rgba(0, 0, 0, 1)')  // Tło przezroczyste
      // .backgroundImageUrl('/assets/images/map.png')  // Ustawiamy obraz jako tło

      .showAtmosphere(true)  // Pokazujemy atmosferę
      .atmosphereColor('#fff')  // Kolor atmosfery
      .atmosphereAltitude(0.1);  // Wysokość atmosfery

    // Ustawiamy rotację globu
    this.startRotation();
  }

  private startRotation() {
    // Funkcja animacji
    const animate = () => {
      requestAnimationFrame(animate);
      this.globeInstance.controls().autoRotate = true;  // Włączamy automatyczny obrót
      this.globeInstance.controls().autoRotateSpeed = 0.5;  // Prędkość obrotu
    };
    animate();
  }
}
