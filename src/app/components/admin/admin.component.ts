import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Demande {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresseCabinet: string;
  numVeterinaire: string;
}

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  numVeterinaire: string;
  demandeAccesId: number;
  firstLogin: boolean;
  admin: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  loading = true;
  error = '';

  // Pagination for users
  page = 1;
  pageSize = 10;
  get totalPages(): number {
    return Math.ceil(this.utilisateurs.length / this.pageSize);
  }
  get paginatedUtilisateurs(): Utilisateur[] {
    const start = (this.page - 1) * this.pageSize;
    return this.utilisateurs.slice(start, start + this.pageSize);
  }

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    // Load users only
    this.http.get<Utilisateur[]>(`${environment.apiUrl}/users/all`, { headers, withCredentials: true }).subscribe({
      next: (users) => {
        this.utilisateurs = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des utilisateurs.';
        this.loading = false;
      }
    });
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
    }
  }

  logout() {
    // Call backend to clear HttpOnly cookie
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.clear();
        if ('caches' in window) {
          caches.keys().then(function (names) {
            for (let name of names) caches.delete(name);
          });
        }
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        localStorage.clear();
        this.router.navigate(['/']);
      }
    });
  }
} 