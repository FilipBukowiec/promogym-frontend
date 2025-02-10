import { Injectable, NgZone, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FullscreenService {
  private isFullscreenSubject = new BehaviorSubject<boolean>(
    this.checkFullscreen()
  );
  isFullscreen$ = this.isFullscreenSubject.asObservable();

  constructor(private zone: NgZone) {
    document.addEventListener('fullscreenchange', () => {
      this.zone.run(() => {
        this.isFullscreenSubject.next(this.checkFullscreen());
      });
    });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.zone.run(() => {
      this.isFullscreenSubject.next(this.checkFullscreen());
    });
  }

  openFullscreen(): void {
    const elem: any = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .then(() => {
          this.isFullscreenSubject.next(true);
        })
        .catch((err: unknown) =>
          console.error('Error entering fullscreen:', err)
        );
    }
  }

  closeFullscreen(): void {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => {
          this.isFullscreenSubject.next(false);
        })
        .catch((err: unknown) =>
          console.error('Error exiting fullscreen:', err)
        );
    }
  }

  toggleFullscreen(): void {
    this.checkFullscreen() ? this.closeFullscreen() : this.openFullscreen();
  }

  private checkFullscreen(): boolean {
    return !!document.fullscreenElement || window.innerHeight === screen.height;
  }
}
