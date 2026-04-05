import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ErrorSanitizerService } from '../../services/error-sanitizer.service';

interface Veterinaire {
  id: number;
  nom: string;
  matricule: string;
  email: string;
}

@Component({
  selector: 'app-admin-veterinaires',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-veterinaires.component.html',
  styleUrl: './admin-veterinaires.component.scss'
})
export class AdminVeterinairesComponent implements OnInit {
  veterinaires: Veterinaire[] = [];
  filteredVeterinaires: Veterinaire[] = [];

  loading = false;
  uploadLoading = false;
  updateLoading = false;
  deleteLoading = false;
  error = '';
  editError = '';
  successMessage = '';
  searchQuery = '';

  selectedFile: File | null = null;
  isDragging = false;
  showSuccessModal = false;
  showEditModal = false;
  showDeleteModal = false;
  
  editingVet: Veterinaire = { id: 0, nom: '', matricule: '', email: '' };
  deletingVet: Veterinaire | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  paginatedVeterinaires: Veterinaire[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private errorSanitizer: ErrorSanitizerService
  ) { }

  ngOnInit(): void {
    this.loadVeterinaires();
  }

  /**
   * Load all veterinaires
   */
  loadVeterinaires(): void {
    this.loading = true;
    this.error = '';

    this.http.get<Veterinaire[]>(`${environment.apiUrl}/ourveterinaires/all`, this.authService.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.veterinaires = data;
          this.filteredVeterinaires = data;
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;
        },
        error: (error) => {
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'chargement des vétérinaires');
          this.loading = false;
        }
      });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  /**
   * Handle drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handle drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  /**
   * Validate and set file
   */
  private validateAndSetFile(file: File): void {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.error = 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)';
      this.selectedFile = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.error = 'Le fichier est trop volumineux (max 5MB)';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.error = '';
  }

  /**
   * Upload Excel file
   */
  uploadExcel(): void {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner un fichier';
      return;
    }

    this.uploadLoading = true;
    this.error = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const options = {
      withCredentials: true,
      responseType: 'text' as 'json'  // Handle text response from API
    };

    this.http.post<any>(`${environment.apiUrl}/ourveterinaires/upload-excel`, formData, options)
      .subscribe({
        next: (response) => {
          this.uploadLoading = false;
        

          // Check if response indicates success
          if (response && (response.success === false || response.error)) {
            this.error = response.message || response.error || 'Erreur lors de l\'importation du fichier';
            return;
          }

          this.successMessage = response?.message || 'Fichier importé avec succès!';
          this.selectedFile = null;
          this.showSuccessModal = true;

          // Reset file input
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

          // Reload data
          this.loadVeterinaires();
        },
        error: (error) => {
          this.uploadLoading = false;
          this.error = this.errorSanitizer.sanitizeOperationError(error, 'importation du fichier');
        }
      });
  }

  /**
   * Search veterinaires
   */
  searchVeterinaires(): void {
    if (!this.searchQuery) {
      this.filteredVeterinaires = this.veterinaires;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredVeterinaires = this.veterinaires.filter(vet =>
        vet.nom.toLowerCase().includes(query) ||
        vet.matricule.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Update pagination
   */
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVeterinaires = this.filteredVeterinaires.slice(startIndex, endIndex);
  }

  /**
   * Get total pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredVeterinaires.length / this.itemsPerPage);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Get page numbers array with ellipsis for better UX
   */
  getPageNumbers(): (number | string)[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages if total is small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 3) {
      // Near the beginning
      for (let i = 2; i <= Math.min(maxVisiblePages, totalPages - 1); i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near the end
      pages.push('...');
      for (let i = totalPages - maxVisiblePages + 1; i < totalPages; i++) {
        pages.push(i);
      }
      pages.push(totalPages);
    } else {
      // In the middle
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  /**
   * Get initials from name
   */
  getInitials(nom: string): string {
    const parts = nom.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  /**
   * Close success modal
   */
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  /**
   * Open edit modal
   */
  openEditModal(vet: Veterinaire): void {
    this.editingVet = { ...vet };
    this.showEditModal = true;
    this.editError = '';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close edit modal
   */
  closeEditModal(): void {
    if (!this.updateLoading) {
      this.showEditModal = false;
      this.editError = '';
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Update veterinaire
   */
  updateVeterinaire(): void {
    if (!this.editingVet.nom || !this.editingVet.matricule || !this.editingVet.email) {
      this.editError = 'Tous les champs sont requis';
      return;
    }

    this.updateLoading = true;
    this.editError = '';

    const updateData = {
      nom: this.editingVet.nom,
      matricule: this.editingVet.matricule,
      email: this.editingVet.email
    };

    this.http.put(`${environment.apiUrl}/ourveterinaires/update/${this.editingVet.id}`, updateData, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.updateLoading = false;
        this.successMessage = 'Vétérinaire mis à jour avec succès';
        this.closeEditModal();
        this.loadVeterinaires();
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.updateLoading = false;
        this.editError = this.errorSanitizer.sanitizeOperationError(error, 'mise à jour du vétérinaire');
      }
    });
  }

  /**
   * Confirm delete
   */
  confirmDelete(vet: Veterinaire): void {
    this.deletingVet = vet;
    this.showDeleteModal = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close delete modal
   */
  closeDeleteModal(): void {
    if (!this.deleteLoading) {
      this.showDeleteModal = false;
      this.deletingVet = null;
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Delete veterinaire
   */
  deleteVeterinaire(): void {
    if (!this.deletingVet) return;

    this.deleteLoading = true;

    this.http.delete(`${environment.apiUrl}/ourveterinaires/delete/${this.deletingVet.id}`, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.deleteLoading = false;
        this.successMessage = 'Vétérinaire supprimé avec succès';
        this.closeDeleteModal();
        this.loadVeterinaires();
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.deleteLoading = false;
        this.error = this.errorSanitizer.sanitizeOperationError(error, 'suppression du vétérinaire');
        this.closeDeleteModal();
        
        // Clear error after 5 seconds
        setTimeout(() => {
          this.error = '';
        }, 5000);
      }
    });
  }

  /**
   * Expose Math for template
   */
  Math = Math;
}
