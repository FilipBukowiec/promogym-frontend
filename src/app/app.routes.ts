import { Routes } from "@angular/router";
import { HomepageComponent } from "./components/homepage/homepage.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { AuthGuard } from "@auth0/auth0-angular";
import { WelcomeComponent } from "./components/welcome/welcome.component";
import { NewsComponent } from "./components/news/news.component";
import { ManagementComponent } from "./components/management/management.component";
import { SettingsComponent } from "./components/settings/settings.component";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/homepage",
    pathMatch: "full",
  },
  { path: "homepage", component: HomepageComponent },

  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        redirectTo: "welcome",
        pathMatch: "full",
      },
      {
        path: "welcome",
        component: WelcomeComponent,
      },
      { path: "news", component: NewsComponent },
      {
        path: "management",
        component: ManagementComponent,
        children: [{ path: "settings", component: SettingsComponent },
          {path: "",
            redirectTo:"settings",
            pathMatch:"full"
          }
        ],
      },
    ],
  },
];
