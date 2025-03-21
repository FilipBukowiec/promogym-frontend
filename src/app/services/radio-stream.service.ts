import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RadioStreamService {
  private audioPlayer: HTMLAudioElement = new Audio();
  private currentPlayingStreamIndex$ = new BehaviorSubject<number | null>(null);

  // Stany audio dla różnych komponentów
  public sideMenuAudio$ = new BehaviorSubject<boolean>(false);
  public userSettingsAudio$ = new BehaviorSubject<boolean>(false);
  public adminSettingsAudio$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  // Getter do obserwowania aktualnie odtwarzanego strumienia
  get currentPlayingStreamIndexState$(): Observable<number | null> {
    return this.currentPlayingStreamIndex$.asObservable();
  }

  playRadioStream(url: string, trueObservable: BehaviorSubject<boolean>, falseObservable?:BehaviorSubject<boolean>[], index?: number): void {
    this.stopRadioStream(trueObservable); // Zatrzymanie aktualnie odtwarzanego strumienia

    this.audioPlayer.src = url;
    this.audioPlayer.load();

    this.audioPlayer
      .play()
      .then(() => {
        this.currentPlayingStreamIndex$.next(index ?? null); // Aktualizacja obserwowalnej wartości
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
    this.currentPlayingStreamIndex$.next(null); // Resetowanie indeksu
    trueObservable.next(false);
  }


 
  // Funkcja do subskrypcji stanu audio
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
