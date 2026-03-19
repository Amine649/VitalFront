import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Cabinet {
    id?: number;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    featured: boolean;
    type: string;
    matricule: string;
}

@Component({
    selector: 'app-admin-cabinets',
    standalone: true,
    imports: [CommonModule, HttpClientModule, FormsModule],
    templateUrl: './admin-cabinets.component.html',
    styleUrl: './admin-cabinets.component.scss'
})
export class AdminCabinetsComponent implements OnInit {
    cabinets: Cabinet[] = [];
    loading = false;
    error = '';
    successMessage = '';
    filterFeatured = false; // Filter to show only featured cabinets

    // Form state
    showForm = false;
    isEditing = false;
    currentCabinet: Cabinet = this.getEmptyCabinet();

    // Delete confirmation
    showDeleteModal = false;
    cabinetToDelete: Cabinet | null = null;

    // Map modal
    showMapModal = false;
    private modalMap: any = null;

    // Excel upload
    uploadingExcel = false;
    showUploadModal = false;
    selectedFile: File | null = null;
    uploadError = '';
    uploadSuccess = '';
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    paginatedCabinets: Cabinet[] = [];

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadCabinets();
    }

    /**
     * Get empty cabinet object
     */
    getEmptyCabinet(): Cabinet {
        return {
            name: '',
            address: '',
            phone: '',
            latitude: 0,
            longitude: 0,
            featured: false,
            type: 'Cabinet',
            matricule: ''
        };
    }

    /**
     * Load all cabinets
     */
    loadCabinets(): void {
        this.loading = true;
        this.error = '';

        this.http.get<Cabinet[]>(`${environment.apiUrl}/cabinets/all`, this.authService.getRequestOptions())
            .subscribe({
                next: (data) => {
                    this.cabinets = data.filter((c: Cabinet) => c.type === 'Cabinet');
                    this.currentPage = 1;
                    this.updatePagination();
                    this.loading = false;
                },
                error: (error) => {
                    this.error = 'Erreur lors du chargement des cabinets';
                    this.loading = false;
                }
            });
    }

    /**
     * Open form for adding new cabinet
     */
    openAddForm(): void {
        this.isEditing = false;
        this.currentCabinet = this.getEmptyCabinet();
        this.showForm = true;
        this.error = '';
        this.successMessage = '';
    }

    /**
     * Open form for editing cabinet
     */
    openEditForm(cabinet: Cabinet): void {
        this.isEditing = true;
        this.currentCabinet = { ...cabinet };
        this.showForm = true;
        this.error = '';
        this.successMessage = '';
    }

    /**
     * Close form
     */
    closeForm(): void {
        this.showForm = false;
        this.currentCabinet = this.getEmptyCabinet();
        this.error = '';
    }

    /**
     * Save cabinet (add or update)
     */
    saveCabinet(): void {
        // Validation
        if (!this.currentCabinet.name || !this.currentCabinet.address ||
            !this.currentCabinet.phone ||
            !this.currentCabinet.matricule) {
            this.error = 'Veuillez remplir tous les champs obligatoires';
            return;
        }

        // Validate GPS coordinates are numbers
        const lat = Number(this.currentCabinet.latitude);
        const lng = Number(this.currentCabinet.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            this.error = '❌ Les coordonnées GPS doivent être des nombres valides (ex: 48.8566 pour la latitude, 2.3522 pour la longitude)';
            return;
        }

        if (lat === 0 || lng === 0) {
            this.error = 'Veuillez entrer des coordonnées GPS valides';
            return;
        }

        // Ensure coordinates are numbers
        this.currentCabinet.latitude = lat;
        this.currentCabinet.longitude = lng;

        this.loading = true;
        this.error = '';

        if (this.isEditing && this.currentCabinet.id) {
            // Update existing cabinet
            this.updateCabinet();
        } else {
            // Add new cabinet
            this.addCabinet();
        }
    }

    /**
     * Add new cabinet
     */
    addCabinet(): void {
        const cabinetData = { ...this.currentCabinet };
        cabinetData.type = 'Cabinet'; // Force type to Cabinet

        this.http.post<any>(`${environment.apiUrl}/cabinets/add`, cabinetData, this.authService.getRequestOptions())
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.successMessage = 'Cabinet ajouté avec succès!';
                    this.closeForm();
                    this.loadCabinets();

                    // Clear success message after 3 seconds
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.loading = false;

                    // Handle specific error messages
                    let errorMessage = 'Erreur lors de l\'ajout du cabinet';

                    if (error.status === 400) {
                        const errorText = error.error?.message || error.error?.error || error.error || '';

                        // Check for matricule not found error
                        if (errorText.includes('matricule') && errorText.includes('n\'existe pas')) {
                            const matriculeMatch = errorText.match(/Le matricule ([^\s]+)/);
                            const matricule = matriculeMatch ? matriculeMatch[1] : this.currentCabinet.matricule;
                            errorMessage = `❌ Matricule invalide : Le matricule "${matricule}" n'existe pas dans la base de données des vétérinaires. Veuillez vérifier le matricule ou ajouter d'abord le vétérinaire.`;
                        }
                        // Check for JSON parse error (invalid number format)
                        else if (errorText.includes('JSON parse error') || errorText.includes('Cannot deserialize') || errorText.includes('not a valid')) {
                            if (errorText.includes('double') || errorText.includes('latitude') || errorText.includes('longitude')) {
                                errorMessage = '❌ Format de coordonnées invalide : Les coordonnées GPS (latitude et longitude) doivent être des nombres décimaux valides. Exemple: 48.8566 ou 2.3522';
                            } else {
                                errorMessage = '❌ Format de données invalide : Veuillez vérifier que tous les champs contiennent des valeurs valides.';
                            }
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
     * Update existing cabinet
     */
    updateCabinet(): void {
        const cabinetData = { ...this.currentCabinet };

        this.http.put<any>(`${environment.apiUrl}/cabinets/update/${this.currentCabinet.id}`, cabinetData, this.authService.getRequestOptions())
            .subscribe({
                next: (response) => {
                    // Immediately update in local array for instant UI update
                    const index = this.cabinets.findIndex((c: Cabinet) => c.id === this.currentCabinet.id);
                    if (index !== -1) {
                        this.cabinets[index] = { ...this.currentCabinet };
                    }

                    this.loading = false;
                    this.successMessage = 'Cabinet modifié avec succès!';
                    this.closeForm();

                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    this.loading = false;

                    // Handle specific error messages
                    let errorMessage = 'Erreur lors de la modification du cabinet';

                    if (error.status === 400) {
                        const errorText = error.error?.message || error.error?.error || error.error || '';

                        // Check for matricule not found error
                        if (errorText.includes('matricule') && errorText.includes('n\'existe pas')) {
                            const matriculeMatch = errorText.match(/Le matricule ([^\s]+)/);
                            const matricule = matriculeMatch ? matriculeMatch[1] : this.currentCabinet.matricule;
                            errorMessage = `❌ Matricule invalide : Le matricule "${matricule}" n'existe pas dans la base de données des vétérinaires. Veuillez vérifier le matricule ou ajouter d'abord le vétérinaire.`;
                        }
                        // Check for JSON parse error (invalid number format)
                        else if (errorText.includes('JSON parse error') || errorText.includes('Cannot deserialize') || errorText.includes('not a valid')) {
                            if (errorText.includes('double') || errorText.includes('latitude') || errorText.includes('longitude')) {
                                errorMessage = '❌ Format de coordonnées invalide : Les coordonnées GPS (latitude et longitude) doivent être des nombres décimaux valides. Exemple: 48.8566 ou 2.3522';
                            } else {
                                errorMessage = '❌ Format de données invalide : Veuillez vérifier que tous les champs contiennent des valeurs valides.';
                            }
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
     * Open delete confirmation modal
     */
    confirmDelete(cabinet: Cabinet): void {
        this.cabinetToDelete = cabinet;
        this.showDeleteModal = true;
    }

    /**
     * Close delete modal
     */
    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.cabinetToDelete = null;
    }

    /**
     * Delete cabinet
     */
    deleteCabinet(): void {
        if (!this.cabinetToDelete?.id) return;

        const deletedId = this.cabinetToDelete.id;
        this.loading = true;
        this.error = '';

        const options = {
            withCredentials: true,
            responseType: 'text' as 'json'
        };

        this.http.delete<any>(`${environment.apiUrl}/cabinets/delete/${deletedId}`, options)
            .subscribe({
                next: (response) => {
                    // Immediately remove from local array for instant UI update
                    this.cabinets = this.cabinets.filter((c: Cabinet) => c.id !== deletedId);

                    this.loading = false;
                    this.successMessage = 'Cabinet supprimé avec succès!';
                    this.closeDeleteModal();

                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (error) => {
                    // Check if it's actually a success (status 200) but treated as error due to response format
                    if (error.status === 200) {
                        // Treat as success
                        this.cabinets = this.cabinets.filter((c: Cabinet) => c.id !== deletedId);
                        this.loading = false;
                        this.successMessage = 'Cabinet supprimé avec succès!';
                        this.closeDeleteModal();
                        setTimeout(() => this.successMessage = '', 3000);
                    } else {
                        this.loading = false;
                        this.error = error.error?.message || 'Erreur lors de la suppression du cabinet';
                        this.closeDeleteModal();
                    }
                }
            });
    }

    /**
     * Get featured cabinets count
     */
    get featuredCount(): number {
        return this.cabinets.filter((c: Cabinet) => c.featured).length;
    }

    /**
     * Get filtered cabinets based on filter
     */
    get filteredCabinets(): Cabinet[] {
        if (this.filterFeatured) {
            return this.cabinets.filter((c: Cabinet) => c.featured);
        }
        return this.cabinets;
    }

    /**
     * Update pagination
     */
    updatePagination(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedCabinets = this.filteredCabinets.slice(startIndex, endIndex);
    }

    /**
     * Get total pages
     */
    get totalPages(): number {
        return Math.ceil(this.filteredCabinets.length / this.itemsPerPage);
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
     * Toggle featured filter
     */
    toggleFeaturedFilter(): void {
        this.filterFeatured = !this.filterFeatured;
        this.currentPage = 1;
        this.updatePagination();
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this.filterFeatured = false;
        this.currentPage = 1;
        this.updatePagination();
    }

    /**
     * Open map modal
     */
    openMapModal(): void {
        this.showMapModal = true;
        document.body.style.overflow = 'hidden';

        // Initialize modal map after a short delay
        setTimeout(() => {
            if (!this.modalMap && typeof window !== 'undefined' && (window as any).L) {
                const L = (window as any).L;

                this.modalMap = L.map('adminModalMap').setView([36.8, 10.2], 10);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(this.modalMap);

                // Add markers for all cabinets
                const bounds: any[] = [];
                this.cabinets.forEach((cabinet: Cabinet) => {
                    const marker = L.marker([cabinet.latitude, cabinet.longitude])
                        .addTo(this.modalMap)
                        .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${cabinet.name}</h3>
                <p style="margin: 4px 0; font-size: 12px;">📍 ${cabinet.address}</p>
                <p style="margin: 4px 0; font-size: 12px;">📞 ${cabinet.phone}</p>
                <p style="margin: 4px 0; font-size: 11px; color: #666;">🔖 ${cabinet.matricule}</p>
                ${cabinet.featured ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Cabinet Principal</span>' : ''}
              </div>
            `);
                    bounds.push([cabinet.latitude, cabinet.longitude]);
                });

                if (bounds.length > 0) {
                    this.modalMap.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        }, 100);
    }

    /**
     * Close map modal
     */
    closeMapModal(): void {
        this.showMapModal = false;
        document.body.style.overflow = 'auto';

        // Clean up modal map
        if (this.modalMap) {
            this.modalMap.remove();
            this.modalMap = null;
        }
    }

    /**
     * Open upload modal
     */
    openUploadModal(): void {
        this.showUploadModal = true;
        this.selectedFile = null;
        this.uploadError = '';
        this.uploadSuccess = '';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close upload modal
     */
    closeUploadModal(): void {
        if (!this.uploadingExcel) {
            this.showUploadModal = false;
            this.selectedFile = null;
            this.uploadError = '';
            this.uploadSuccess = '';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Trigger file input click
     */
    triggerFileInput(): void {
        this.fileInput.nativeElement.click();
    }

    /**
     * Handle file selection
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Validate file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                this.uploadError = 'Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)';
                this.clearUploadErrorAfterDelay();
                return;
            }

            this.selectedFile = file;
            this.uploadError = '';
        }
    }

    /**
     * Handle drag over event
     */
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Handle drag leave event
     */
    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Handle drop event
     */
    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            
            // Validate file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                this.uploadError = 'Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)';
                this.clearUploadErrorAfterDelay();
                return;
            }

            this.selectedFile = file;
            this.uploadError = '';
        }
    }

    /**
     * Clear selected file
     */
    clearSelectedFile(event: Event): void {
        event.stopPropagation();
        this.selectedFile = null;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Upload Excel file to API
     */
    uploadExcelFile(): void {
        if (!this.selectedFile) {
            this.uploadError = 'Veuillez sélectionner un fichier';
            return;
        }

        this.uploadingExcel = true;
        this.uploadError = '';
        this.uploadSuccess = '';

        const formData = new FormData();
        formData.append('file', this.selectedFile);

        this.http.post(`${environment.apiUrl}/cabinets/upload`, formData, {
            withCredentials: true
        }).subscribe({
            next: (response: any) => {
                this.uploadingExcel = false;
                this.uploadSuccess = response.message || 'Fichier Excel importé avec succès!';
                this.loadCabinets(); // Reload the cabinets list
                
                // Clear file and close modal after 2 seconds
                setTimeout(() => {
                    this.closeUploadModal();
                }, 2000);
            },
            error: (error) => {
                this.uploadingExcel = false;
                this.uploadError = error.error?.message || 'Erreur lors de l\'importation du fichier Excel';
                this.clearUploadErrorAfterDelay();
            }
        });
    }

    /**
     * Clear upload error message after delay
     */
    private clearUploadErrorAfterDelay(): void {
        setTimeout(() => {
            this.uploadError = '';
        }, 5000);
    }

    /**
     * Clear error message after delay
     */
    private clearErrorAfterDelay(): void {
        setTimeout(() => {
            this.error = '';
        }, 5000);
    }

    /**
     * Expose Math for template
     */
    Math = Math;
}
