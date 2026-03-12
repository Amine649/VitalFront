import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

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
    private http: HttpClient,
    private authService: AuthService
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
    this.authService.logout('/login');
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
