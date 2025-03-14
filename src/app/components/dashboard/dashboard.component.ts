import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { AuthService } from '@auth0/auth0-angular';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { AdminSettings } from '../../models/admin-settings.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, SideMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


  export class DashboardComponent implements OnInit {
    constructor(private auth: AuthService, private adminSettings: AdminSettingsService) {}
  
    ngOnInit(): void {
      this.auth.getAccessTokenSilently().subscribe((token) => {
        console.log('Access Token:', token); 
      });

      this.adminSettings.getSettings().subscribe({
        next: (settings: AdminSettings) => {
          console.log ("Ustawienia admina", settings);

        },
        // error: (error)=>{
        //   console.error("Błąd podczas pobrania ustawię", error)
        // }
      })
      }


    }
  