import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Veterinaire {
  id: number;
  nom: string;
  prenom: string;
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
  error = '';
  successMessage = '';
  searchQuery = '';

  selectedFile: File | null = null;
  isDragging = false;
  showSuccessModal = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  paginatedVeterinaires: Veterinaire[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadVeterinaires();
  }

  /**
   * Get request options with credentials
   * Cookie is automatically sent by browser when withCredentials is true
   */
  private getRequestOptions() {
    return {
      withCredentials: true
    };
  }

  /**
   * Load all veterinaires
   */
  loadVeterinaires(): void {
    this.loading = true;
    this.error = '';

    this.http.get<Veterinaire[]>(`${environment.apiUrl}/veterinaires/all`, this.getRequestOptions())
      .subscribe({
        next: (data) => {
          this.veterinaires = data;
          this.filteredVeterinaires = data;
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading veterinaires:', error);
          this.error = 'Erreur lors du chargement des vétérinaires';
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

    this.http.post<any>(`${environment.apiUrl}/veterinaires/upload-excel`, formData, options)
      .subscribe({
        next: (response) => {
          this.uploadLoading = false;
          console.log('Upload response:', response);

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
          console.error('Error uploading file:', error);

          // Handle specific error messages
          let errorMessage = 'Erreur lors de l\'importation du fichier';

          if (error.status === 400) {
            const errorText = error.error?.message || error.error || '';

            // Check for header column error
            if (errorText.includes('en-tête') || errorText.includes('colonnes')) {
              errorMessage = '❌ Format de fichier incorrect : Le fichier Excel doit contenir exactement les colonnes "nom", "prenom" et "matricule" dans l\'en-tête.';
            }
            // Check for incomplete row error
            else if (errorText.includes('incomplète') || errorText.includes('Ligne')) {
              // Extract line number if present
              const lineMatch = errorText.match(/Ligne (\d+)/);
              const lineNumber = lineMatch ? lineMatch[1] : '';
              errorMessage = `❌ Données incomplètes ${lineNumber ? `à la ligne ${lineNumber}` : ''} : Tous les champs (nom, prénom, matricule) doivent être remplis pour chaque vétérinaire.`;
            }
            else {
              errorMessage = errorText || errorMessage;
            }
          }

          this.error = errorMessage;
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
        vet.prenom.toLowerCase().includes(query) ||
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
   * Get page numbers array
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
  getInitials(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  /**
   * Close success modal
   */
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  /**
   * Expose Math for template
   */
  Math = Math;
}
