import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import Globe from 'globe.gl';
import * as THREE from 'three';

@Component({
  selector: 'app-globe',
  standalone: true,
 templateUrl: './globe.component.html',
  styleUrl: './globe.component.scss'
})




export class GlobeComponent implements AfterViewInit {
  @ViewChild('globeContainer', { static: true }) globeContainer!: ElementRef;
  private globeInstance!: any;

  ngAfterViewInit() {
    this.globeInstance = new Globe(this.globeContainer.nativeElement)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg') // Zielona Ziemia
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)') // Przezroczyste tło
      .showAtmosphere(true)
      .atmosphereColor('#ffffff') // Atmosfera lekko biała
      .atmosphereAltitude(0.2);

    // Ustawienie rotacji globu
    this.startRotation();
  }

  private startRotation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.globeInstance.controls().autoRotate = true; // Włączamy obracanie
      this.globeInstance.controls().autoRotateSpeed = 0.5; // Prędkość obrotu
    };
    animate();
  }
}