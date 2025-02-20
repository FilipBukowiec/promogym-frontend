// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AnnouncementService } from '../../services/announcement.service';
// import { RadioStreamService } from '../../services/radio-stream.service';
// import * as cronParser from 'cron-parser';
// import { Announcement } from '../../models/announcement.model';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-announcements',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './announcements.component.html',
//   styleUrls: ['./announcements.component.scss'],
// })
// export class AnnouncementsComponent implements OnInit, OnDestroy {
//   announcementsList: Announcement[] = [];
//   audioUrl: string | null = null;
//   private intervalId: any;
//   private announcementsSubscription: Subscription = new Subscription();
//   private userInteracted = false;
//   private currentlyPlaying: Set<string> = new Set();
//   private audio: HTMLAudioElement | null = null;
//   private isPlaying: boolean = true;
//   private isPlayingSubscription: Subscription = new Subscription();
//   private wasRadioPlayingBeforeAnnouncement: boolean = false;
//   private isPlayingNow: boolean = false;
//   private audioQueue: { fileName: string; _id: string }[] = [];
//   private isQueueOperationInProgress = false;  // Flaga blokady operacji na kolejce

//   constructor(
//     private announcementService: AnnouncementService,
//     // private radioStreamService: RadioStreamService
//   ) {}

//   ngOnInit(): void {
//     this.initializeUserInteractionListener();
//     this.subscribeToAnnouncements();  // Subskrypcja ogłoszeń
//     this.subscribeToIsPlayingFlag(); // Subskrypcja isPlayingFlag
//     this.startScheduleCheck(); // Uruchomienie sprawdzania harmonogramu
//   }

//   ngOnDestroy(): void {
//     console.log('Component jest niszczany, czyszczenie subskrypcji');
//     if (this.isPlayingSubscription) {
//       this.isPlayingSubscription.unsubscribe();
//     }
//     if (this.announcementsSubscription) {
//       this.announcementsSubscription.unsubscribe();
//     }
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//     }
//   }

//   subscribeToIsPlayingFlag(): void {
//     this.isPlayingSubscription = this.announcementService.isPlaying$.subscribe(
//       (isPlaying: boolean) => {
//         console.log('Subskrypcja isPlaying$: ', isPlaying);
//         this.isPlaying = isPlaying;

//         if (this.isPlaying) {
//           console.log('Odtwarzanie rozpoczęte');
//           this.resetPlayingState();
//           this.startScheduleCheck();
//         } else {
//           console.log('Odtwarzanie zatrzymane');
//           this.stopAudio();
//         }
//       },
//       (error) => {
//         console.error('Błąd w subskrypcji isPlaying$: ', error);
//       }
//     );
//   }

//   initializeUserInteractionListener(): void {
//     document.body.addEventListener('click', () => {
//       this.userInteracted = true;
//     });
//     document.body.addEventListener('keydown', () => {
//       this.userInteracted = true;
//     });
//   }

//   subscribeToAnnouncements(): void {
//     this.announcementsSubscription = this.announcementService.announcements$.subscribe(
//       (announcements: Announcement[]) => {
//         this.announcementsList = announcements;
//         console.log('Aktualizacja listy ogłoszeń:', announcements);
//       },
//       (error: any) => {
//         console.error('Błąd przy pobieraniu ogłoszeń:', error);
//       }
//     );
//   }

//   startScheduleCheck(): void {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//     }

//     this.intervalId = setInterval(() => {
//       const now = new Date();

//       for (const announcement of this.announcementsList) {
//         if (announcement.scheduleType === 'cyclic' && announcement.cronSchedule) {
//           if (this.isMatchingCronTime(announcement.cronSchedule, now)) {
//             this.queueAnnouncement(announcement);
//           }
//         } else if (announcement.scheduleType === 'oneTime') {
//           if (this.isMatchingOneTime(announcement, now)) {
//             this.queueAnnouncement(announcement);
//             this.removeOneTimeAnnouncement(announcement);
//           }
//         }
//       }

//       if (!this.isPlayingNow) {
//         this.playNextInQueue();
//       }
//     }, 1000);
//   }

//   isMatchingCronTime(cronSchedule: string, now: Date): boolean {
//     try {
//       const interval = cronParser.parseExpression(cronSchedule, { currentDate: now });
//       const nextExecution = interval.next().toDate();
//       const timeDiff = Math.abs(nextExecution.getTime() - now.getTime());
//       return timeDiff < 1000;
//     } catch (error) {
//       console.error('Błąd parsowania cronSchedule:', error);
//       return false;
//     }
//   }

//   isMatchingOneTime(announcement: Announcement, now: Date): boolean {
//     if (!announcement.scheduledTime) return false;
//     const scheduledTime = new Date(announcement.scheduledTime);
//     return (
//       now.getFullYear() === scheduledTime.getFullYear() &&
//       now.getMonth() === scheduledTime.getMonth() &&
//       now.getDate() === scheduledTime.getDate() &&
//       now.getHours() === scheduledTime.getHours() &&
//       now.getMinutes() === scheduledTime.getMinutes()
//     );
//   }

//   queueAnnouncement(announcement: Announcement): void {
//     // Jeśli operacja na kolejce jest w toku, nie rób nic
//     if (this.isQueueOperationInProgress) {
//       console.log(`Operacja dodawania do kolejki w toku. Czekam na zakończenie.`);
//       return;
//     }

//     // Ustawiamy flagę blokady
//     this.isQueueOperationInProgress = true;

//     // Jeśli ogłoszenie jest już w trakcie odtwarzania, nie dodajemy go do kolejki
//     if (this.currentlyPlaying.has(announcement._id)) {
//       console.log(`Ogłoszenie już odtwarzane: ${announcement.fileName} (${announcement._id})`);
//       // Zwolnienie flagi blokady
//       this.isQueueOperationInProgress = false;
//       return;
//     }

//     console.log(`Dodaję do kolejki ogłoszenie: ${announcement.fileName} (${announcement._id})`);
//     this.audioQueue.push({ fileName: announcement.fileName, _id: announcement._id });

//     // Zwolnienie flagi blokady po zakończeniu operacji
//     this.isQueueOperationInProgress = false;
//   }

//   playNextInQueue(): void {
//     if (!this.isPlaying) {
//       this.isPlayingNow = false;
//       return;
//     }

//     if (this.audioQueue.length === 0) {
//       this.isPlayingNow = false;

//       if (this.wasRadioPlayingBeforeAnnouncement) {
//         this.radioStreamService.toggleStream();
//         this.wasRadioPlayingBeforeAnnouncement = false;
//       }

//       return;
//     }

//     const nextAnnouncement = this.audioQueue.shift()!;

//     console.log(`Odtwarzanie ogłoszenia: ${nextAnnouncement.fileName}`);

//     this.isPlayingNow = true;
//     this.currentlyPlaying.add(nextAnnouncement._id);

//     this.audioUrl = `https://crossfitbytom.promogym.pl/uploads/announcements/${nextAnnouncement.fileName}`;
//     this.audio = new Audio(this.audioUrl);

//     if (this.radioStreamService.isStreamPlaying()) {
//       this.wasRadioPlayingBeforeAnnouncement = true;
//       this.radioStreamService.toggleStream();
//     }

//     this.audio.play();
//     this.audio.onended = () => {
//       console.log(`Zakończono odtwarzanie: ${nextAnnouncement.fileName} (${nextAnnouncement._id})`);
//       this.currentlyPlaying.delete(nextAnnouncement._id);

//       if (this.isPlaying) {
//         this.playNextInQueue();
//       }
//     };

//     this.audio.onerror = () => {
//       console.error(`Błąd odtwarzania: ${nextAnnouncement.fileName}`);
//       this.currentlyPlaying.delete(nextAnnouncement._id);

//       if (this.isPlaying) {
//         this.playNextInQueue();
//       }
//     };
//   }

//   stopAudio(): void {
//     if (this.audio) {
//       this.audio.pause();
//       this.audio.currentTime = 0;
//       this.audio.src = '';
//       this.audio.load();
//       this.audio = null;
//     }

//     this.currentlyPlaying.clear();

//     if (this.wasRadioPlayingBeforeAnnouncement) {
//       this.radioStreamService.toggleStream();
//       this.wasRadioPlayingBeforeAnnouncement = false;
//     }

//     this.audioUrl = null;
//   }

//   removeOneTimeAnnouncement(announcement: Announcement): void {
//     this.announcementsList = this.announcementsList.filter(a => a._id !== announcement._id);
//     console.log(`Usunięto jednorazowe ogłoszenie: ${announcement.fileName} (${announcement._id})`);
//   }

//   resetPlayingState(): void {
//     this.currentlyPlaying.clear();
//     this.audioQueue = [];
//     this.isPlayingNow = false;
//   }
// }
