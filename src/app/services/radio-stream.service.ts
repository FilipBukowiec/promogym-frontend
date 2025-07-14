import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RadioStreamService {
  private audioPlayer: HTMLAudioElement = new Audio();

  private currentPlayingStreamIndex = signal<number | null>(null);

  public sideMenuAudio = signal<boolean>(false);
  public userSettingsAudio = signal<boolean>(false);
  public adminSettingsAudio = signal<boolean>(false);

  constructor() { }

  get currentPlayingStreamIndexSignal() {
    return this.currentPlayingStreamIndex;
  }

  playRadioStream(
    url: string,
    trueSignal: () => void,
    falseSignals: (() => void)[] = [],
    index?: number
  ): void {
    this.stopRadioStream(trueSignal);

    this.audioPlayer.src = url;
    this.audioPlayer.load();

    this.audioPlayer
      .play()
      .then(() => {
        this.currentPlayingStreamIndex.set(index ?? null);
        trueSignal();
        falseSignals.forEach((setFalse) => setFalse());
      })
      .catch((error) => {
        console.error('Error playing radio stream:', error);
        this.stopRadioStream(trueSignal);
      });

    this.audioPlayer.onerror = () => {
      console.error('Stream error, stopping...');
      this.stopRadioStream(trueSignal);
    };
  }

  stopRadioStream(setFalse: () => void): void {
    this.audioPlayer.pause();
    this.audioPlayer.src = '';
    this.audioPlayer.load();
    this.currentPlayingStreamIndex.set(null);
    setFalse();
  }

  get sideMenuAudioSignal() {
    return this.sideMenuAudio;
  }

  get userSettingsAudioSignal() {
    return this.userSettingsAudio;
  }

  get adminSettingsAudioSignal() {
    return this.adminSettingsAudio;
  }
}
