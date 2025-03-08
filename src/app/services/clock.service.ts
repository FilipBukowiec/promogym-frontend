import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClockService {
  private currentTimeSubject = new BehaviorSubject<string>('');
  currentTime$ = this.currentTimeSubject.asObservable();
  private intervalId: any;
  private lastMinute: number | null = null;

  constructor() {
    this.updateTime();
    this.startClock();
  }

  private startClock(): void {
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    if (this.lastMinute !== minutes) {
      // Emitujemy TYLKO jeśli zmieniła się minuta
      this.currentTimeSubject.next(`${hours}:${formattedMinutes}`);
      this.lastMinute = minutes;
    }
  }
  
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
