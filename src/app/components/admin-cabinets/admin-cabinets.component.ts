import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Cabinet {
    id?: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    latitude: number;
    longitude: number;
    featured: boolean;  // Changed from isFeatured to match API
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

    constructor(private http: HttpClient) { }

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
            city: '',
            phone: '',
            latitude: 0,
            longitude: 0,
            featured: false,
            type: 'BOUTIQUE',
            matricule: ''
        };
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
     * Load all cabinets
     */
    loadCabinets(): void {
        this.loading = true;
        this.error = '';

        this.http.get<Cabinet[]>(`${environment.apiUrl}/cabinets/all`, this.getRequestOptions())
            .subscribe({
                next: (data) => {
                    this.cabinets = data.filter((c: Cabinet) => c.type === 'BOUTIQUE');
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading cabinets:', error);
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
            !this.currentCabinet.city || !this.currentCabinet.phone ||
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
        cabinetData.type = 'BOUTIQUE'; // Force type to BOUTIQUE

        this.http.post<any>(`${environment.apiUrl}/cabinets/add`, cabinetData, this.getRequestOptions())
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
                    console.error('Error adding cabinet:', error);

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

        this.http.put<any>(`${environment.apiUrl}/cabinets/update/${this.currentCabinet.id}`, cabinetData, this.getRequestOptions())
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
                    console.error('Error updating cabinet:', error);

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
                        console.error('Error deleting cabinet:', error);
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
     * Toggle featured filter
     */
    toggleFeaturedFilter(): void {
        this.filterFeatured = !this.filterFeatured;
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this.filterFeatured = false;
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
                <p style="margin: 4px 0; font-size: 12px;">📍 ${cabinet.address}, ${cabinet.city}</p>
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
}
