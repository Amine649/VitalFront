import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    // Log error for debugging in development only
    if (!environment.production) {
      console.error('Application bootstrap error:', err);
    }
    // Show user-friendly error message
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h1>Erreur de chargement</h1><p>Une erreur est survenue lors du chargement de l\'application. Veuillez rafraîchir la page.</p></div>';
  });
