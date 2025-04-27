import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RadioStreamService {
  private audioPlayer: HTMLAudioElement = new Audio();
  private currentPlayingStreamIndex$ = new BehaviorSubject<number | null>(null);

  public sideMenuAudio$ = new BehaviorSubject<boolean>(false);
  public userSettingsAudio$ = new BehaviorSubject<boolean>(false);
  public adminSettingsAudio$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  get currentPlayingStreamIndexState$(): Observable<number | null> {
    return this.currentPlayingStreamIndex$.asObservable();
  }

  playRadioStream(url: string, trueObservable: BehaviorSubject<boolean>, falseObservable?:BehaviorSubject<boolean>[], index?: number): void {
    this.stopRadioStream(trueObservable); 

    this.audioPlayer.src = url;
    this.audioPlayer.load();

    this.audioPlayer
      .play()
      .then(() => {
        this.currentPlayingStreamIndex$.next(index ?? null); 
        console.log(`Playing stream ${index}: ${url}`);
        trueObservable.next(true);
        if(falseObservable&& falseObservable.length >0){
          falseObservable.forEach(observable => observable.next(false))
        }
        
      })
      .catch((error) => {
        console.error('Error playing radio stream:', error);
        this.stopRadioStream(trueObservable);
      });

    this.audioPlayer.onerror = () => {
      console.error('Stream error, stopping...');
      this.stopRadioStream(trueObservable);
    };
  }

  stopRadioStream(trueObservable: BehaviorSubject<boolean>): void {
    this.audioPlayer.pause();
    this.currentPlayingStreamIndex$.next(null); 
    trueObservable.next(false);
  }


 
  get sideMenuAudioState$() {
    return this.sideMenuAudio$.asObservable();
  }

  get userSettingsAudioState$() {
    return this.userSettingsAudio$.asObservable();
  }

  get adminSettingsAudioState$() {
    return this.adminSettingsAudio$.asObservable();
  }
}
