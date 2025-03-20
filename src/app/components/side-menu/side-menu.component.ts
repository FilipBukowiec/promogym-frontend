import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FullscreenService } from '../../services/fullscreen.service';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import {jwtDecode} from "jwt-decode";
import { RadioStreamService } from '../../services/radio-stream.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { UserSettings } from '../../models/user-settings.model';
// import { AnnouncementService } from '../../services/announcement.service'; 

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements AfterViewInit {
  isOnStartPage$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  shouldRefresh$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false); // <-- Zmienione na BehaviorSubject
  isFullscreen$: Observable<boolean>;
  isAdmin = false;
  isStreamPlaying$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  userSettings$: Observable<UserSettings | null>
  // isAnnouncementPlaying$: Observable<boolean>;  

  
  constructor(
    private fullscreenService: FullscreenService,
    private router: Router,
    private dataService: DataService,
    public radioStreamService: RadioStreamService,
    private userSettingsService: UserSettingsService,
    private auth:AuthService,
  ) {
    
    this.isFullscreen$ = this.fullscreenService.isFullscreen$;
this.userSettings$ = this.userSettingsService.settings$;

    // this.isStreamPlaying$ = this.radioStreamService.isStreamPlaying$;
    // this.isAnnouncementPlaying$ = this.announcementService.isPlaying$; 




    this.auth.getAccessTokenSilently().subscribe(
      (token) => {
        const decodedToken: any = jwtDecode(token);
        const roles = decodedToken['https://promogym.com/roles'] || [];
        this.isAdmin = roles.includes('admin');
  
        console.log('Decoded token:', decodedToken);
        console.log('Rola admin:', this.isAdmin);
      },
      (error) => {
        console.error('Błąd podczas pobierania tokenu:', error);
      }
    );
  }
  
 

  ngOnInit(): void {
    this.isOnStartPage$.next(this.router.url === '/dashboard/start');
    this.router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url === '/dashboard/start')
    )
    .subscribe((isOnStart) => {
      this.isOnStartPage$.next(isOnStart);
    });
}


  

  ngAfterViewInit(): void {}

  toggleFullscreen(): void {
    this.fullscreenService.toggleFullscreen();
  }


  refreshComponents(componentKeys: string[]): void {
    const newData: { [key: string]: boolean } = {};
    componentKeys.forEach((key) => {
      newData[key] = false;
    });
    this.dataService.updateData(newData);
    setTimeout(() => {
      const updatedData: { [key: string]: boolean } = {};
      componentKeys.forEach((key) => {
        updatedData[key] = true;
      });
      this.dataService.updateData(updatedData);
    }, 100);
  }

  navigateToStart(): void {
    if (!this.isOnStartPage$) {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate(['dashboard/start']).then(() => {
        this.shouldRefresh$.next(true);
      });
    } else {
      if (this.shouldRefresh$) {
        this.shouldRefresh$.next;
      }
    }
  }

  onStartClick(event: MouseEvent): void {
    if (this.isOnStartPage$.value) {
      this.refreshComponents(['swiper', 'footer']);
      event.preventDefault();
    } else {
      this.navigateToStart();
    }
  }

  // toggleStream(): void {
  //   this.userSettings$.subscribe(settings => {
  //     if (settings && settings.selectedRadioStream) {
  //       if (this.isStreamPlaying$.value) {
  //         this.radioStreamService.stopStream(); 
  //         this.isStreamPlaying$.next(false);
  //       } else {
  //         this.radioStreamService.playStream(settings.selectedRadioStream);
  //         this.isStreamPlaying$.next(true); 
  //       }
  //     } else {
  //       console.error('Brak ustawionego strumienia radiowego w ustawieniach użytkownika');
  //     }
  //   });
  // }




  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: document.location.origin} }); 
  }
}
