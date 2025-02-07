import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [LoaderComponent, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent implements OnInit, AfterViewInit {
  isLoading: boolean = true;
  isVideoEnded: boolean = false;

  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.videoElement) {
      const video = this.videoElement.nativeElement;

      video.addEventListener('loadeddata', () => {
        this.isLoading = false;
      });

      video.addEventListener('ended', () => {
        this.isVideoEnded = true;
      });

      video.muted = true;
      video.play().catch((error) => console.error('Video playback error:', error));
    } else {
      console.error('Video element not found.');
    }
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: document.location.origin } });
  }
}
