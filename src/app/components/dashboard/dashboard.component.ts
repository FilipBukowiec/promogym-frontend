import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, SideMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


  export class DashboardComponent implements OnInit {
    constructor(private auth: AuthService) {}
  
    ngOnInit(): void {
      // Pobieranie Access Token
      this.auth.getAccessTokenSilently().subscribe((token) => {
        console.log('Access Token:', token); // Możesz używać tego tokena do autoryzacji w zapytaniach do API
      });
    }
  }

