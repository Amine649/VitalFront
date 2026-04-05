import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorSanitizerService } from './error-sanitizer.service';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private errorSanitizer: ErrorSanitizerService
  ) {
    this.initNavigationWatcher();
  }

  /**
   * Get request options with credentials for API calls
   * Cookie is automatically sent by browser when withCredentials is true
   */
  getRequestOptions() {
    return {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Logout user - clears session and redirects
   * @param redirectTo - Optional redirect path (default: '/')
   */
  logout(redirectTo: string = '/'): void {
    // Call backend to clear HttpOnly cookie
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        // Clear user data from localStorage
        localStorage.clear();
        
        // Clear browser cache
        if ('caches' in window) {
          caches.keys().then(function(names) {
            for (let name of names) caches.delete(name);
          });
        }
        
        // Redirect
        this.router.navigate([redirectTo]);
      },
      error: (error) => {
        // Even if backend fails, clear local data and redirect
        localStorage.clear();
        this.router.navigate([redirectTo]);
      }
    });
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
        // Session clearing failed
      }
    });
  }

  /**
   * Change user password
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Observable with success/error callbacks
   */
  changePassword(currentPassword: string, newPassword: string) {
    const body = {
      currentPassword,
      newPassword
    };

    return this.http.post(`${environment.apiUrl}/reset-password`, body, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  /**
   * Parse password change error and return user-friendly message
   */
  getPasswordChangeErrorMessage(error: any): string {
    // Use sanitizer for most errors
    if (error.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 400) {
      // Check for specific password-related errors only
      let apiError = '';
      if (error.error && typeof error.error === 'string') {
        apiError = error.error.toLowerCase();
      } else if (error.error?.message) {
        apiError = error.error.message.toLowerCase();
      }

      // Only translate known safe error messages
      if (apiError.includes('current password is incorrect') ||
          apiError.includes('mot de passe actuel incorrect')) {
        return 'Le mot de passe actuel est incorrect.';
      } else if (apiError.includes('password') || apiError.includes('mot de passe')) {
        return 'Le mot de passe ne respecte pas les critères requis.';
      }
      
      // For any other 400 error, use generic message
      return 'Le mot de passe ne respecte pas les critères requis.';
    }
    
    // Use sanitizer for all other errors
    return this.errorSanitizer.sanitizeError(error);
  }

  /**
   * Load current user data from /veterinaires/me endpoint
   * Stores userId, userFullName, and optionally status in localStorage
   * @param includeStatus - Whether to store and return user status (default: false)
   * @returns Observable with user data
   */
  loadUserData(includeStatus: boolean = false) {
    return this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { 
      withCredentials: true 
    });
  }

  /**
   * Process and store user data in localStorage
   * @param data - User data from API
   * @param includeStatus - Whether to store user status
   */
  storeUserData(data: any, includeStatus: boolean = false): void {
    // Store userId
    if (data.id || data.userId) {
      const id = data.id || data.userId;
      localStorage.setItem('userId', id.toString());
    }

    // Store full name
    const fullName = `${data.prenom || ''} ${data.nom || ''}`.trim();
    if (fullName) {
      localStorage.setItem('userFullName', fullName);
    }

    // Store status if requested
    if (includeStatus && data.status) {
      localStorage.setItem('userStatus', data.status);
    }
  }
}
