import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ErrorSanitizerService } from '../../services/error-sanitizer.service';

interface Boutique {
  id?: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  type: string;
  matricule: string;
}

@Component({
  selector: 'app-admin-boutiques',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-boutiques.component.html',
  styleUrl: './admin-boutiques.component.scss'
})
export class AdminBoutiquesComponent implements OnInit {
  boutiques: Boutique[] = [];
  loading = false;
  error = '';
  successMessage = '';
  searchTerm = '';

  // Form state
  showForm = false;
  isEditing = false;
  currentBoutique: Boutique = this.getEmptyBoutique();

  // Delete confirmation
  showDeleteModal = false;
  boutiqueToDelete: Boutique | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private errorSanitizer: ErrorSanitizerService
  ) { }

  ngOnInit(): void {
    this.loadBoutiques();
  }

  getEmptyBoutique(): Boutique {
    return {
      name: '',
      address: '',
      city: '',
      phone: '',
      latitude: 0,
      longitude: 0,
      isFeatured: false,
      type: 'Boutique',
      matricule: ''
    };
  }

  loadBoutiques(): void {
    this.loading = true;
    this.error = '';

    this.http.get<Boutique[]>(`${environment.apiUrl}/boutiques/all`, this.authService.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.boutiques = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'chargement des boutiques');
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    // Filtering is handled by the filteredBoutiques getter
    // This method exists for template binding compatibility
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentBoutique = this.getEmptyBoutique();
    this.showForm = true;
    this.error = '';
  }

  openEditForm(boutique: Boutique): void {
    this.isEditing = true;
    this.currentBoutique = { ...boutique };
    this.showForm = true;
    this.error = '';
  }

  closeForm(): void {
    this.showForm = false;
    this.currentBoutique = this.getEmptyBoutique();
    this.error = '';
  }

  saveBoutique(): void {
    if (!this.currentBoutique.name || !this.currentBoutique.address ||
      !this.currentBoutique.city || !this.currentBoutique.phone ||
      !this.currentBoutique.matricule) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Basic validation for phone and coordinates
    if (!/^\+?[\d\s]{8,15}$/.test(this.currentBoutique.phone)) {
      this.error = 'Format de téléphone invalide';
      return;
    }

    const lat = Number(this.currentBoutique.latitude);
    const lng = Number(this.currentBoutique.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      this.error = 'Coordonnées GPS invalides';
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.isEditing && this.currentBoutique.id) {
      this.updateBoutique();
    } else {
      this.addBoutique();
    }
  }

  addBoutique(): void {
    this.http.post<any>(`${environment.apiUrl}/boutiques/add`, this.currentBoutique, this.authService.getRequestOptions())
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Boutique ajoutée avec succès!';
          this.closeForm();
          this.loadBoutiques();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'ajout de la boutique');
        }
      });
  }

  updateBoutique(): void {
    this.http.put<any>(`${environment.apiUrl}/boutiques/update/${this.currentBoutique.id}`, this.currentBoutique, this.authService.getRequestOptions())
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Boutique modifiée avec succès!';
          this.closeForm();
          this.loadBoutiques();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'modification de la boutique');
        }
      });
  }

  confirmDelete(boutique: Boutique): void {
    this.boutiqueToDelete = boutique;
    this.showDeleteModal = true;
  }

  deleteBoutique(): void {
    if (!this.boutiqueToDelete?.id) return;

    this.loading = true;
    this.http.delete(`${environment.apiUrl}/boutiques/delete/${this.boutiqueToDelete.id}`, { ...this.authService.getRequestOptions(), responseType: 'text' })
      .subscribe({
        next: () => {
          this.boutiques = this.boutiques.filter(b => b.id !== this.boutiqueToDelete?.id);
          this.loading = false;
          this.successMessage = 'Boutique supprimée avec succès!';
          this.showDeleteModal = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'suppression de la boutique');
          this.showDeleteModal = false;
        }
      });
  }

  get filteredBoutiques(): Boutique[] {
    if (!this.searchTerm) return this.boutiques;
    const term = this.searchTerm.toLowerCase();
    return this.boutiques.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.city.toLowerCase().includes(term) ||
      b.matricule.toLowerCase().includes(term)
    );
  }

  get featuredCount(): number {
    return this.boutiques.filter(b => b.isFeatured).length;
  }
}
