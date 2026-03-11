import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthMonitorService {
  // Pages that require authentication
  private authenticatedPages = [
    '/espace-veterinaire',
    '/produits-veterinaire',
    '/panier',
    '/formulaireVet',
    '/admin'
  ];

  // Pages that are public (no authentication needed)
  private publicPages = [
    '/',
    '/formulaireUser',
    '/confirmation',
    '/login',
    '/espace-proprietaire',
    '/ou-trouver-nos-produits'
  ];

  constructor(private router: Router) {}

  /**
   * Monitor route changes and clear credentials when navigating from authenticated to public pages
   */
  startMonitoring(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.checkRouteTransition(event.url);
    });
  }

  /**
   * Check if user is navigating from authenticated area to public area
   */
  private checkRouteTransition(currentUrl: string): void {
    const isPublicPage = this.isPublicRoute(currentUrl);
    const hasUserToken = localStorage.getItem('user_token');
    const hasAdminToken = localStorage.getItem('admin_token');

    // If user has credentials and navigates to a public page, clear credentials
    if (isPublicPage && (hasUserToken || hasAdminToken)) {
      this.clearCredentials();
    }
  }

  /**
   * Check if the route is a public route
   */
  private isPublicRoute(url: string): boolean {
    // Remove query parameters and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    return this.publicPages.some(page => {
      if (page === '/') {
        return cleanUrl === '/';
      }
      return cleanUrl.startsWith(page);
    });
  }

  /**
   * Clear all authentication credentials
   */
  private clearCredentials(): void {
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
  }
}
