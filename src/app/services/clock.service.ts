import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClockService {
  private currentTimeSubject = new BehaviorSubject<string>('');
  currentTime$ = this.currentTimeSubject.asObservable();
  private intervalId: any;

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
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    this.currentTimeSubject.next(`${hours}:${formattedMinutes}`);
  }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
