// import { Injectable } from '@angular/core';
// import { SettingsService } from './settings.service';
// import { BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class RadioStreamService {
//   private audioElement: HTMLAudioElement | null = null;
//   private streamUrl: string = '';
//   private isPlaying: boolean = false;
//   private monitoringInterval: any = null;
//   private isPlayingSubject = new BehaviorSubject<boolean>(this.isPlaying);

//   constructor(private settingsService: SettingsService) {
//     this.settingsService.observeSettings().subscribe((settings) => {
//       if (settings?.selectedRadioStream) {
//         this.handleStreamChange(settings.selectedRadioStream);
//       }
//     });
//   }

//   private async handleStreamChange(url: string): Promise<void> {
//     if (!url) {
//       return;
//     }

//     if (url !== this.streamUrl) {
//       if (this.isPlaying) {
//         await this.stopStream();
//         this.streamUrl = url;
//         await this.startStream();
//       } else {
//         this.streamUrl = url;
//       }
//     }
//   }

//   async stopStream(): Promise<void> {
//     try {
//       if (this.isPlaying && this.audioElement) {
//         await this.fadeVolume(1, 0, 1000);

//         this.audioElement.pause();

//         this.audioElement.src = '';

//         this.audioElement.load();

//         this.audioElement = null;
//         this.isPlaying = false;
//         this.stopMonitoring();
//         this.isPlayingSubject.next(this.isPlaying);
//       }
//     } catch (error) {
//     }
//   }

//   async startStream(): Promise<void> {
//     try {
//       if (!this.isPlaying) {
//         this.audioElement = new Audio();

//         this.audioElement.preload = 'auto';
//         this.audioElement.volume = 0;

//         this.audioElement.src = this.streamUrl;

//         this.audioElement.load();

//         this.audioElement.addEventListener('ended', () => {
//           this.handleUnexpectedStop();
//         });

//         await this.audioElement.play();

//         await this.fadeVolume(0, 1, 1000);

//         this.isPlaying = true;
//         this.startMonitoring();
//         this.isPlayingSubject.next(this.isPlaying);
//       }
//     } catch (error) {
//     }
//   }

//   async setStreamUrl(url: string): Promise<void> {
//     try {
//       this.streamUrl = url;

//       if (this.audioElement) {
//         this.audioElement.src = url;
//         this.audioElement.load();
//       }
//     } catch (error) {
//     }
//   }

//   toggleStream(): void {
//     if (this.isPlaying) {
//       this.stopStream();
//     } else {
//       this.startStream();
//     }
//   }

//   isStreamPlaying$ = this.isPlayingSubject.asObservable();

//   isStreamPlaying(): boolean {
//     return this.isPlaying;
//   }

//   private fadeVolume(from: number, to: number, duration: number): Promise<void> {
//     const steps = 20;
//     const interval = duration / steps;
//     const volumeStep = (to - from) / steps;

//     return new Promise((resolve) => {
//       let currentStep = 0;

//       const fadeInterval = setInterval(() => {
//         currentStep++;
//         if (this.audioElement) {
//           const newVolume = Math.min(Math.max(from + volumeStep * currentStep, 0), 1);
//           this.audioElement.volume = newVolume;
//         }

//         if (currentStep >= steps) {
//           clearInterval(fadeInterval);
//           resolve();
//         }
//       }, interval);
//     });
//   }

//   private handleUnexpectedStop(): void {
//     if (this.isPlaying) {
//       this.startStream();
//     }
//   }

//   private startMonitoring(): void {
//     this.stopMonitoring();

//     this.monitoringInterval = setInterval(() => {
//       if (this.audioElement) {
//         const isPaused = this.audioElement.paused;

//         if (isPaused && this.isPlaying) {
//           this.startStream();
//         }
//       }
//     }, 5000);
//   }

//   private stopMonitoring(): void {
//     if (this.monitoringInterval) {
//       clearInterval(this.monitoringInterval);
//       this.monitoringInterval = null;
//     }
//   }
// }
