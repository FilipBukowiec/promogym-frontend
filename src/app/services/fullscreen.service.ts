import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FullscreenService {
  private isFullscreenSubject = new BehaviorSubject<boolean>(this.checkFullscreen());
  isFullscreen$ = this.isFullscreenSubject.asObservable();

  constructor(private zone: NgZone) {
    const changeEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    changeEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.zone.run(() => {
          this.isFullscreenSubject.next(this.checkFullscreen());
        });
      });
    });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.zone.run(() => {
      this.isFullscreenSubject.next(this.checkFullscreen());
    });
  }

  openFullscreen(targetId: string = 'app-root'): void {
    const elem = document.getElementById(targetId) || document.documentElement;
    const anyElem = elem as any;

    try {
      if (anyElem.requestFullscreen) {
        anyElem.requestFullscreen();
      } else if (anyElem.webkitRequestFullscreen) {
        anyElem.webkitRequestFullscreen(); // Safari
      } else if (anyElem.mozRequestFullScreen) {
        anyElem.mozRequestFullScreen(); // Firefox
      } else if (anyElem.msRequestFullscreen) {
        anyElem.msRequestFullscreen(); // IE/Edge
      } else {
        console.warn('Fullscreen API is not supported in this browser.');
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  }

  closeFullscreen(): void {
    const doc: any = document;

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen(); // Safari
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen(); // Firefox
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen(); // IE/Edge
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
    }
  }

  toggleFullscreen(targetId: string = 'app-root'): void {
    this.checkFullscreen() ? this.closeFullscreen() : this.openFullscreen(targetId);
  }

  private checkFullscreen(): boolean {
    const doc: any = document;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }
}
