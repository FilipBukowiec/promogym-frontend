import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { AdminAnnouncementsComponent } from './components/admin-announcements/admin-announcements.component';
import { AdminLibraryComponent } from './components/admin-library/admin-library.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdvertisementsComponent } from './components/advertisements/advertisements.component';
import { ContactComponent } from './components/contact/contact.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomepageComponent } from './components/homepage/homepage.component';
import { MainAppComponent } from './components/main-app/main-app.component';
import { ManagementComponent } from './components/management/management.component';
import { NewsComponent } from './components/news/news.component';
import { UserMediaComponent } from './components/user-media/user-media.component';
import { UserNewsComponent } from './components/user-news/user-news.component';
import { UserSettingsComponent } from './components/user-settings/user-settings.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { UserLibraryComponent } from './components/user-library/user-library.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/homepage',
    pathMatch: 'full',
  },
  { path: 'homepage', component: HomepageComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full',
      },
      {
        path: 'welcome',
        component: WelcomeComponent,
      },
      { path: 'start', component: MainAppComponent },
      { path: 'contact', component: ContactComponent },

      { path: 'news', component: NewsComponent },

      {
        path: 'admin',
        component: AdminComponent,
        children: [
          {
            path: 'admin-settings',
            component: AdminSettingsComponent,
          },
          {
            path: 'admin-library',
            component: AdminLibraryComponent,
          },
          { path: 'advertisements', component: AdvertisementsComponent },
          {
            path: 'admin-announcements',
            component: AdminAnnouncementsComponent,
          },
          { path: '', redirectTo: 'admin-settings', pathMatch: 'full' },
        ],
      },
      {
        path: 'management',
        component: ManagementComponent,
        children: [
          { path: 'user-settings', component: UserSettingsComponent },
          { path: 'user-news', component: UserNewsComponent },
          { path: 'user-media', component: UserMediaComponent },
          { path: 'user-library', component: UserLibraryComponent },
          { path: '', redirectTo: 'user-settings', pathMatch: 'full' },
        ],
      },
    ],
  },
];
