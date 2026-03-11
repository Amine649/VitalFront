import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  sidebarOpen = true;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    // With HttpOnly cookies, we can't check the token in JavaScript
    // Only check if user is marked as admin
    const isAdmin = localStorage.getItem('isAdmin');
    
    if (isAdmin !== 'true') {
      // Redirect to login if not authenticated as admin
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    // Call backend to clear HttpOnly cookie
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        // Clear user data from localStorage
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userId');
        localStorage.clear();
        
        // Clear browser cache
        if ('caches' in window) {
          caches.keys().then(function(names) {
            for (let name of names) caches.delete(name);
          });
        }
        
        // Redirect to home
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if backend fails, clear local data and redirect
        localStorage.clear();
        this.router.navigate(['/']);
      }
    });
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
