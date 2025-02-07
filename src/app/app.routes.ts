import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from '@auth0/auth0-angular';




export const routes: Routes = [
  {
    path: '',
    redirectTo: '/homepage',
    pathMatch: 'full',
  },
  { path: 'homepage', component: HomepageComponent },

  {
    path: 'dashboard', component: DashboardComponent,
    canActivate: [AuthGuard],

  
  },
];
