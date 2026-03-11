import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private publicRoutes = [
    '/',
    '/espace-proprietaire',
    '/ou-trouver-nos-produits',
    '/formulaireUser',
    '/formulaireVet',
    '/confirmation',
    '/login'
  ];

  private protectedRoutes = [
    '/espace-veterinaire',
    '/produits-veterinaire',
    '/panier'
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initNavigationWatcher();
  }

  /**
   * Watch for navigation changes and clear auth when moving to public pages
   * BUT: Don't clear auth when going to formulaireVet (user can be logged in)
   */
  private initNavigationWatcher(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects || event.url;
      const cleanUrl = currentUrl.split('?')[0].split('#')[0];
      
      // Don't clear auth for formulaireVet - users can be logged in
      if (cleanUrl.startsWith('/formulaireVet')) {
        return;
      }
      
      // Check if navigating to a public route
      if (this.isPublicRoute(currentUrl)) {
        // Check if user was previously authenticated
        const wasAuthenticated = this.isAuthenticated();
        
        if (wasAuthenticated) {
          this.clearAuthentication();
        }
      }
    });
  }

  /**
   * Check if a route is public
   */
  private isPublicRoute(url: string): boolean {
    // Remove query parameters and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    return this.publicRoutes.some(route => {
      if (route === '/') {
        return cleanUrl === '/';
      }
      return cleanUrl.startsWith(route);
    });
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin');
    return !!(userId || isAdmin);
  }

  /**
   * Clear all authentication data
   */
  clearAuthentication(): void {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userName');
    
    // Call backend to clear HttpOnly cookies
    this.http.post(`${environment.apiUrl}/logout`, {}, { 
      withCredentials: true 
    }).subscribe({
      next: () => {
        // Session cleared successfully
      },
      error: (error) => {
        console.error('AuthService: Error clearing backend session', error);
      }
    });
  }

  /**
   * Logout user and redirect to login
   */
  logout(): void {
    this.clearAuthentication();
    this.router.navigate(['/login']);
  }
}
