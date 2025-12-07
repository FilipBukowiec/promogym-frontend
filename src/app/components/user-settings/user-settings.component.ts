import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs'; // Używamy firstValueFrom zamiast lastValueFrom
import { toSignal } from '@angular/core/rxjs-interop'; // Kluczowe do łączenia RxJS i Sygnałów

// Serwisy i Modele
import { UserSettingsService } from '../../services/user-settings.service';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { RadioStreamService } from '../../services/radio-stream.service';
import { RetryHelperService } from '../../services/retry-helper.service';
import { WebSocketService } from '../../services/websocket.service';
import { FacebookService } from '../../services/facebook.service';
import { UserSettings } from '../../models/user-settings.model';
import { FacebookPage, FacebookStory } from '../../models/facebook.model';
import { LoaderComponent } from '../loader/loader.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
})
export class UserSettingsComponent implements OnInit {
  // --- WSTRZYKIWANIE ZALEŻNOŚCI (inject() i public) ---
  private userSettingsService = inject(UserSettingsService);
  private adminSettingsService = inject(AdminSettingsService);
  // radioStreamService musi być public, aby był dostępny w szablonie (.html)
  public radioStreamService = inject(RadioStreamService);
  private retryHelper = inject(RetryHelperService);
  private webSocketService = inject(WebSocketService);
  private facebookService = inject(FacebookService);

  public environmentPublicUrl = environment.publicUrl;

  // --- STAN APLIKACJI (SYGNAŁY) ---

  // 1. Główne Ustawienia (Zawsze Sygnał)
  userSettings = signal<UserSettings>({
    tenant_id: '',
    language: '',
    country: '',
    name: '',
    selectedRadioStream: '',
    footerVisibilityRules: [],
    pictureSlideDuration: 0,
    logoFilePath: '',
    separatorFilePath: '',
    enableFacebookModule: false,
    selectedFacebookPage: null,
    facebookPageAccess: null,
    facebookPageId: null,
    facebookPageAdress: null,
  });

  // 2. Stan UI i Pól Tymczasowych
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  editUserName = signal<boolean>(false);

  // Pliki i Podglądy (Sygnały)
  tempLogoFile = signal<File | null>(null);
  tempSeparatorFile = signal<File | null>(null);
  tempLogoPreviewUrl = signal<string | null>(null);
  tempSeparatorPreviewUrl = signal<string | null>(null);
  logoMarkedForDeletion = signal<boolean>(false);
  separatorMarkedForDeletion = signal<boolean>(false);

  // Pola formularzy tymczasowych (Sygnały)
  newStartMinute = signal<number | null>(null);
  newEndMinute = signal<number | null>(null);
  editFooterVisibilityIndex = signal<number | null>(null);

  // 3. Dane Administracyjne i Strumienie (Sygnały)
  languages = signal<string[]>([]);
  radioStreamList = signal<{ url: string; description: string }[]>([]);

  // selectedRadioIndex, fbPages, fbUserToken muszą być Sygnałami!
  selectedRadioIndex = signal<number | null>(null);
  fbPages = signal<FacebookPage[]>([]);
  fbUserToken = signal<string | null>(null);
  selectedFacebookPage = signal<FacebookPage | null>(null); // Dodajemy do wiązania w HTML

  // Konwersja RxJS Observable na Sygnał (automatyczne zarządzanie subskrypcją)
  currentPlayingStreamIndex = toSignal(this.radioStreamService.currentPlayingStreamIndexState$, { initialValue: null });

  // Stała tablica minut
  time: number[] = Array.from({ length: 60 }, (_, i) => i);

  ngOnInit(): void {
    this.loadSettings();
    this.getAdminSettings();
  }

  onTenantChange() {
    console.log('🔄 Tenant zmieniony – przeładowuję dane...');
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.retryHelper.withRetry(this.userSettingsService.settings$).subscribe({
      next: (response) => {
        if (response) {
          this.userSettings.set(response);
        } else {
          this.error.set('Brak danych użytkownika.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Nie udało się załadować ustawień.');
        console.error('❌ Błąd podczas pobierania ustawień:', err);
      },
    });
  }

  getAdminSettings(): void {
    this.adminSettingsService.settings$.subscribe({
      next: (adminSettings) => {
        if (adminSettings) {
          this.languages.set(adminSettings.languages || []);
          this.radioStreamList.set(adminSettings.radioStreamList || []);
        }
      },
    });
  }

  // --- LOGIKA FORMULARZY ---

  editUserNameField(): void {
    this.editUserName.set(true);
  }

  saveUserName(): void {
    this.editUserName.set(false);
  }

  updateSelectedIndex(event: Event): void {
    const selectedElement = event.target as HTMLSelectElement;
    // Aktualizujemy Sygnał
    this.selectedRadioIndex.set(selectedElement.selectedIndex);
  }

  // ... reszta prostych metod (playRadioStream)

  // --- ZARZĄDZANIE REGUŁAMI STOPKI (Mutacja tablic wewnątrz Sygnału) ---

  addFooterVisibilityRule(): void {
    const start = this.newStartMinute();
    const end = this.newEndMinute();

    if (start === null || end === null) {
      alert('Please select both start and end minutes.');
      return;
    }
    if (start >= end) {
      alert('Start time must be less than end time.');
      return;
    }

    // Używamy .update() do bezpiecznej mutacji obiektu wewnątrz Sygnału
    this.userSettings.update((current) => ({
      ...current,
      footerVisibilityRules: [...current.footerVisibilityRules, { startMinute: start, endMinute: end }],
    }));

    this.newStartMinute.set(null);
    this.newEndMinute.set(null);
  }

  editFooterVisibilityRule(index: number): void {
    this.editFooterVisibilityIndex.set(index);
  }

  saveFooterVisibilityRule(index: number): void {
    // W TDF to wystarczy, aby zatwierdzić edycję UI
    this.editFooterVisibilityIndex.set(null);
  }

  deleteFooterVisibilityRule(index: number): void {
    if (confirm('Are you sure you want to delete this Footer Visibility Rule?')) {
      this.userSettings.update((current) => {
        const newRules = [...current.footerVisibilityRules];
        newRules.splice(index, 1);
        return { ...current, footerVisibilityRules: newRules };
      });
    }
  }

  // --- OBSŁUGA PLIKÓW ---

  onFileSelected(event: Event, type: 'mainlogo' | 'separator'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const url = URL.createObjectURL(file);

      if (type === 'mainlogo') {
        this.tempLogoFile.set(file);
        this.tempLogoPreviewUrl.set(url);
      } else {
        this.tempSeparatorFile.set(file);
        this.tempSeparatorPreviewUrl.set(url);
      }
    }
  }

  deleteLogo(type: 'mainlogo' | 'separator'): void {
    if (!confirm(`Are you sure you want to mark the ${type} logo for deletion?`)) return;

    this.userSettings.update((settings) => {
      if (type === 'mainlogo') {
        this.logoMarkedForDeletion.set(true);
        this.tempLogoPreviewUrl.set(null);
        this.tempLogoFile.set(null);
        return { ...settings, logoFilePath: '' };
      } else {
        this.separatorMarkedForDeletion.set(true);
        this.tempSeparatorPreviewUrl.set(null);
        this.tempSeparatorFile.set(null);
        return { ...settings, separatorFilePath: '' };
      }
    });
  }

  // --- GŁÓWNA METODA ZAPISU (ASYNC + SYGNAŁY) ---

  async saveSettings(): Promise<void> {
    this.loading.set(true);

    try {
      // 1. Obsługa usuwania logo (aktualizacja Sygnałów po sukcesie)
      if (this.logoMarkedForDeletion()) {
        await firstValueFrom(this.userSettingsService.deleteLogo('mainlogo'));
        this.logoMarkedForDeletion.set(false);
      }
      // ... reszta logiki usuwania separatora
      if (this.separatorMarkedForDeletion()) {
        await firstValueFrom(this.userSettingsService.deleteLogo('separator'));
        this.separatorMarkedForDeletion.set(false);
      }

      // 2. Obsługa wysyłania plików
      const logoFile = this.tempLogoFile();
      if (logoFile) {
        if (this.userSettings().logoFilePath) {
          try {
            await firstValueFrom(this.userSettingsService.deleteLogo('mainlogo'));
          } catch (e) {}
        }

        const res = await firstValueFrom(this.userSettingsService.uploadLogo(logoFile, 'mainlogo'));
        if (res) {
          this.userSettings.set(res);
          this.tempLogoPreviewUrl.set(`${this.environmentPublicUrl}${res.logoFilePath}?t=${Date.now()}`);
        }
        this.tempLogoFile.set(null);
      }

      const sepFile = this.tempSeparatorFile();
      if (sepFile) {
        if (this.userSettings().separatorFilePath) {
          try {
            await firstValueFrom(this.userSettingsService.deleteLogo('separator'));
          } catch (e) {}
        }
        const res = await firstValueFrom(this.userSettingsService.uploadLogo(sepFile, 'separator'));
        if (res) {
          this.userSettings.set(res);
          this.tempSeparatorPreviewUrl.set(`${this.environmentPublicUrl}${res.separatorFilePath}?t=${Date.now()}`);
        }
        this.tempSeparatorFile.set(null);
      }

      // 3. Zapis głównych ustawień
      await firstValueFrom(this.userSettingsService.updateSettings(this.userSettings()));

      alert('Settings saved successfully');
      this.loadSettings();
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving settings.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- FACEBOOK LOGIN (W PEŁNI SYGNAŁOWY) ---

  facebooklogin(): void {
    this.error.set(null);
    this.loading.set(true);

    this.facebookService
      .login() // Promise
      .then((userToken) => {
        this.fbUserToken.set(userToken); // Zapis tokenu do Sygnału

        this.facebookService.getPages(userToken).subscribe({
          // Observable
          next: (pages) => {
            this.fbPages.set(pages); // Zapis stron do Sygnału
            this.loading.set(false);
            console.log('nowe strony:', pages);
          },
          error: (err) => {
            this.error.set('Błąd pobierania stron FB.');
            this.loading.set(false);
            console.error('❌ Błąd w subskrypcji stron:', err);
          },
        });
      })
      .catch((err) => {
        this.error.set('Logowanie FB anulowane lub nieudane.');
        this.loading.set(false);
        console.error('❌ Błąd w logowaniu (Promise):', err);
      });
  }

  onPageSelected(selectedPage: FacebookPage | null): void {
    this.selectedFacebookPage.set(selectedPage);
    this.userSettings.update((current) => {
      if (selectedPage) {
        return { ...current, selectedFacebookPage: selectedPage.name, facebookPageAccess: selectedPage.page_token, facebookPageId: selectedPage.id, facebookPageAdress:selectedPage.link };
      } else {
        return {
          ...current,
          selectedFacebookPage: null,
          facebookPageAccess: null,
          facebookPageId: null,
          facebookPageAdress: null,
        };
      }
    });

    console.log('✅ Ustawienia FB zaktualizowane lokalnie:', this.userSettings());
  }

getFacebookStories(pageToken: string, pageId: string): void {
   this.facebookService.getStories(pageToken, pageId).subscribe({
    next: (stories: FacebookStory[]) => {
      console.log('Liczba Stories:', stories.length);
      console.log(stories)
    },
    error: (err) => {
      console.error('❌ Błąd podczas pobierania Stories:', err);
    },
    complete: () => {
      console.log('Pobieranie Stories zakończone.');
    }
   })

}

  liveUpdate(): void {
    this.webSocketService.requestUserSettingsUpdate();
  }
}
