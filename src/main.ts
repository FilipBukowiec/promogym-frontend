import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// import { authInterceptor } from './app/interceptors/auth.interceptor';  // Zaimportuj klasę
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { appConfig } from './app/app.config';
import { provideRouter, Router, withHashLocation } from '@angular/router';
import { routes } from './app/app.routes';
import { AuthService, provideAuth0 } from '@auth0/auth0-angular';
import { GlobeComponent } from './app/components/globe/globe.component'

registerSwiperElements();

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes, withHashLocation()),
    provideAuth0({
      domain: 'dev-yaku6y1r82y6pb0p.us.auth0.com',
      clientId: 'JQinAZtrxoZN1KNNVsHKSpugFQj0EUHH', 
      authorizationParams: {
        redirect_uri: window.location.origin + "/#/dashboard",
        audience: 'https://promogym.com/api',
      },
    }),
  ],
}).catch((err) => {
  console.error('Błąd aplikacji:', err);
  alert('Wystąpił problem. Spróbuj ponownie później.');
});
