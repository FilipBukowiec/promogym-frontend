import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RadioStreamService {
  private audioPlayer: HTMLAudioElement = new Audio();
  private currentPlayingStreamIndex: number | null = null;

  // Stan audio dla różnych komponentów
  private sideMenuAudio$ = new BehaviorSubject<boolean>(false);
  private userSettingsAudio$ = new BehaviorSubject<boolean>(false);
  public adminSettingsAudio$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  playRadioStream(url: string, trueObservable: BehaviorSubject<boolean>, index?: number): void {
    // Zatrzymanie aktualnie odtwarzanego audio, bez względu na to, czy strumień jest ten sam czy inny
    this.stopRadioStream(trueObservable);
  
    // Ustawiamy nowe źródło audio
    this.audioPlayer.src = url;
    this.audioPlayer.load();
  
    this.audioPlayer
      .play()
      .then(() => {
        this.currentPlayingStreamIndex = index ?? null; // Jeśli nie ma indeksu, ustawiamy null
        console.log(`Playing stream ${index}: ${url}`);
        
        // Ustawiamy stan na 'true' dla aktualnie odtwarzanego strumienia
        trueObservable.next(true);
      })
      .catch((error) => {
        console.error('Error playing radio stream:', error);
        this.stopRadioStream(trueObservable);
      });
  
    // Obsługa błędów
    this.audioPlayer.onerror = () => {
      console.error('Stream error, stopping...');
      this.stopRadioStream(trueObservable);
    };
  }
  
  
  stopRadioStream(trueObservable: BehaviorSubject<boolean>): void {
    this.audioPlayer.pause();
    this.currentPlayingStreamIndex = null;
  
    // Zatrzymanie audio i ustawienie stanu na 'false' w odpowiednim observable
    trueObservable.next(false); // Ustawiamy stan na 'false' po zatrzymaniu strumienia
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
