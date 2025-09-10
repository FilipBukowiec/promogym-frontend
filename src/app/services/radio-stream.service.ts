// src/app/services/radio-stream.service.ts
import { Injectable, signal } from '@angular/core';

type Context = 'side' | 'user' | 'admin' | null;

@Injectable({
  providedIn: 'root',
})
export class RadioStreamService {
  private audioPlayer: HTMLAudioElement = new Audio();

  // signals exposed to components
  public sideMenuAudio = signal<boolean>(false);
  public userSettingsAudio = signal<boolean>(false);
  public adminSettingsAudio = signal<boolean>(false);

  private currentPlayingStreamIndex = signal<number | null>(null);

  // internal tracking
  private _currentUrl: string | null = null;
  private _pendingContext: Context = null;
  private _pendingIndex: number | null = null;
  private _playAttempt = 0; // incrementowane, aby unieważnić stare próby

  constructor() {
    // opcjonalne: crossOrigin jeśli potrzebne
    this.audioPlayer.crossOrigin = 'anonymous';
    this.audioPlayer.preload = 'auto';

    // Event listeners z zabezpieczeniem na _playAttempt
    this.audioPlayer.addEventListener('playing', () => {
      console.debug('[Radio] event: playing (attempt=', this._playAttempt, ')');
      this._applyPlayingStateIfValid();
    });

    this.audioPlayer.addEventListener('pause', () => {
      console.debug('[Radio] event: pause');
      // pause może zostać wywołane automatycznie, ale zostawimy stop jako canonical
      this._clearPlayingState();
    });

    this.audioPlayer.addEventListener('ended', () => {
      console.debug('[Radio] event: ended');
      this.stopRadioStream();
    });

    this.audioPlayer.addEventListener('error', (ev) => {
      console.error('[Radio] event: error', ev);
      this.stopRadioStream();
    });
  }

  get currentPlayingStreamIndexSignal() {
    return this.currentPlayingStreamIndex;
  }

  /**
   * Uruchom stream.
   * context — który komponent zaczyna (ustawi odpowiedni signal).
   */
  playRadioStream(url: string, context: Context = 'side', index?: number): void {
    if (!url) {
      console.warn('[Radio] playRadioStream called with empty url');
      return;
    }

    // nowa próba -> unieważnia stare
    this._playAttempt++;
    const attemptId = this._playAttempt;
    console.debug('[Radio] playRadioStream attempt', attemptId, 'url=', url, 'context=', context);

    // zatrzymaj poprzedni natychmiast i oczyść stany
    this._stopInternal(); // nie inkrementujemy _playAttempt tutaj (już jest)

    // ustaw pending info
    this._currentUrl = url;
    this._pendingContext = context;
    this._pendingIndex = index ?? null;

    // przygotuj player
    this.audioPlayer.src = url;
    this.audioPlayer.load();

    const playPromise = this.audioPlayer.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // promise resolves, ale event 'playing' także prawdopodobnie już nastąpi lub nastąpi wkrótce
          console.debug('[Radio] play() promise resolved (attempt', attemptId, ')');
          // zastosuj stan tylko jeśli nadal aktualna próba
          if (attemptId === this._playAttempt) {
            this._applyPlayingStateIfValid();
          } else {
            console.debug('[Radio] play() resolved but attempt invalidated');
          }
        })
        .catch((err) => {
          console.error('[Radio] play() failed (attempt', attemptId, '):', err);
          // Inwaliduj tę próbę i oczyść
          if (attemptId === this._playAttempt) {
            this.stopRadioStream();
          }
        });
    } else {
      // starsze przeglądarki: polegamy na eventach
      console.debug('[Radio] play() returned undefined — relying on "playing" event');
    }
  }

  /**
   * Zatrzymuje stream i czyści wszystkie signals.
   */
  stopRadioStream(): void {
    // inkrementacja unieważnia wszelkie pending attempts
    this._playAttempt++;
    console.debug('[Radio] stopRadioStream called, invalidating attempts ->', this._playAttempt);
    this._stopInternal();
  }

  /**
   * Zwraca true jeśli audio aktualnie gra (szybka kontrola)
   */
  isActuallyPlaying(): boolean {
    try {
      return !this.audioPlayer.paused && !this.audioPlayer.ended && this.audioPlayer.currentTime > 0;
    } catch {
      return false;
    }
  }

  /***************************************************************************
   *  INTERNAL
   ***************************************************************************/

  private _applyPlayingStateIfValid() {
    // jeśli pending została unieważniona, nie robimy nic
    // (w przypadku gdy stop() lub nowy play() nastąpił wcześniej)
    if (!this._currentUrl) {
      console.debug('[Radio] applyPlayingState skipped — no currentUrl');
      return;
    }
    // ustaw index i sygnały
    this.currentPlayingStreamIndex.set(this._pendingIndex ?? null);
    this._setSignalsForContext(this._pendingContext);
    console.info('[Radio] playing state applied - context=', this._pendingContext, 'index=', this._pendingIndex);
  }

  private _setSignalsForContext(ctx: Context) {
    this.sideMenuAudio.set(ctx === 'side');
    this.userSettingsAudio.set(ctx === 'user');
    this.adminSettingsAudio.set(ctx === 'admin');
  }

  private _clearPlayingState() {
    this.currentPlayingStreamIndex.set(null);
    this.sideMenuAudio.set(false);
    this.userSettingsAudio.set(false);
    this.adminSettingsAudio.set(false);
    this._currentUrl = null;
    this._pendingContext = null;
    this._pendingIndex = null;
  }

  private _stopInternal() {
    try {
      this.audioPlayer.pause();
      // czyszczenie źródła żeby przeglądarka zwolniła połączenie
      this.audioPlayer.src = '';
      this.audioPlayer.load();
    } catch (err) {
      console.warn('[Radio] error while stopping audio:', err);
    }

    this._clearPlayingState();
    console.debug('[Radio] stopped & cleared state');
  }
}
