import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CartService, CartItem, ProductVariant } from '../../services/cart.service';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

@Component({
    selector: 'app-panier-commercial',
    standalone: true,
    imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule, FormsModule],
    templateUrl: './panier-commercial.component.html',
    styleUrls: ['./panier-commercial.component.scss']
})
export class PanierCommercialComponent implements OnInit {
    cartItems: CartItem[] = [];
    cartTotal = 0;
    cartCount = 0;
    showSuccessModal = false;
    isCheckingOut = false;
    loadingVariants = false;
    private itemOrder: number[] = []; // Store the order of items by their IDs

    // Vet Info
    vetMatricule: string = '';
    vetName: string = '';
    vetEmail: string = '';
    vetId: string = '';

    // Order confirmation data
    orderNumber: string = '';
    confirmedVetEmail: string = '';
    orderTotalAmount: number = 0;

    // UI State for Navbar
    showProfileDropdown = false;
    showPasswordModal = false;
    mobileMenuOpen = false;

    // Password change
    passwordForm: FormGroup;
    passwordLoading = false;
    passwordError = '';
    passwordSuccess = '';

    constructor(
        private cartService: CartService,
        private router: Router,
        private http: HttpClient,
        private fb: FormBuilder,
        private authService: AuthService,
        private imageErrorHandler: ImageErrorHandlerService
    ) {
        this.passwordForm = this.fb.group({
            oldPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.loadVetInfo();

        // Reload commercial cart from backend when page loads
        if (this.vetMatricule) {
            this.cartService.loadCommercialCart(this.vetMatricule);
        } else {
            this.cartService.loadCartFromBackend();
        }

        // Subscribe to cart updates
        this.cartService.cartItems$.subscribe(items => {
            // Preserve the order of existing items
            if (this.itemOrder.length === 0 && items.length > 0) {
                // First load - store the initial order
                this.itemOrder = items.map(item => item.id);
            } else if (items.length > 0) {
                // Subsequent loads - add new items to the end, keep existing order
                const newItemIds = items.map(item => item.id);
                const addedItems = newItemIds.filter(id => !this.itemOrder.includes(id));
                this.itemOrder = [...this.itemOrder.filter(id => newItemIds.includes(id)), ...addedItems];
            } else {
                // Cart is empty
                this.itemOrder = [];
            }
            
            // Sort items according to stored order
            this.cartItems = this.sortItemsByOrder(items, this.itemOrder);
            this.cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
            this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            // Load variants for each cart item
            if (items.length > 0) {
                setTimeout(() => {
                    this.loadVariantsForCartItems();
                }, 100);
            }
        });
    }

    private sortItemsByOrder(items: CartItem[], order: number[]): CartItem[] {
        return items.sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            
            // If both items are in the order array, sort by their position
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            
            // If only one item is in the order array, it comes first
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            // If neither is in the order array, maintain their relative order
            return 0;
        });
    }

    loadVariantsForCartItems(): void {
        if (this.loadingVariants) {
            return;
        }
        
        this.loadingVariants = true;
        
        // Create requests for all products
        const variantRequests = this.cartItems
            .filter(item => item.productId)
            .map(item => 
                this.http.get<ProductVariant[]>(`${environment.apiUrl}/products/${item.productId}/variants`)
            );

        if (variantRequests.length === 0) {
            this.loadingVariants = false;
            this.recalculateTotal();
            return;
        }

        forkJoin(variantRequests).subscribe({
            next: (variantsArray) => {
                let variantIndex = 0;
                this.cartItems.forEach(item => {
                    if (item.productId) {
                        item.variants = variantsArray[variantIndex];
                        
                        // Trust the API response - it already has the correct price, packaging, and variantId
                        if (item.variantId) {
                            item.selectedVariantId = item.variantId;
                        } else {
                            // Fallback: find variant matching the price from API
                            const currentVariant = item.variants?.find(v => v.price === item.price);
                            if (currentVariant) {
                                item.selectedVariantId = currentVariant.id;
                            } else {
                                // Last resort: use first variant
                                const sortedVariants = [...item.variants].sort((a, b) => a.id - b.id);
                                if (sortedVariants.length > 0) {
                                    item.selectedVariantId = sortedVariants[0].id;
                                }
                            }
                        }
                        
                        variantIndex++;
                    }
                });
                
                this.cartItems = [...this.cartItems];
                this.loadingVariants = false;
                this.recalculateTotal();
            },
            error: (err) => {
                this.loadingVariants = false;
                this.recalculateTotal();
            }
        });
    }

    recalculateTotal(): void {
        this.cartTotal = this.cartItems.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );
    }

    /**
     * Get the packaging text for the selected variant
     */
    getSelectedVariantPackaging(item: CartItem): string {
        // First, check if the API provided packaging directly
        if (item.packaging) {
            return item.packaging;
        }

        // Fallback: look up in variants array
        if (!item.variants || item.variants.length === 0) {
            return '';
        }

        const selectedVariant = item.variants.find(v => v.id === item.selectedVariantId);
        if (selectedVariant) {
            return selectedVariant.packaging;
        }

        // Last fallback to first variant if no selection
        return item.variants[0]?.packaging || '';
    }

    loadVetInfo() {
        this.vetMatricule = sessionStorage.getItem('validatedMatricule') || '';
        this.vetId = sessionStorage.getItem('vetId') || '';
        this.vetName = sessionStorage.getItem('vetName') || '';
        this.vetEmail = sessionStorage.getItem('vetEmail') || '';
    }

    updateQuantity(itemId: number, quantity: number): void {
        const matricule = sessionStorage.getItem('validatedMatricule');
        if (quantity > 0 && matricule) {
            // Find the cart item to get its productId and selected variant
            const item = this.cartItems.find(i => i.id === itemId);
            if (item && item.productId) {
                const variantId = item.selectedVariantId;
                this.cartService.updateCommercialItemQuantity(matricule, itemId, item.productId, quantity, variantId);
            }
        }
    }

    removeFromCart(itemId: number): void {
        // Remove from order tracking
        this.itemOrder = this.itemOrder.filter(id => id !== itemId);
        
        const matricule = sessionStorage.getItem('validatedMatricule');
        if (matricule) {
            this.cartService.removeCommercialCartItem(matricule, itemId);
        } else {
            this.cartService.removeFromCart(itemId);
        }
    }

    continueShopping(): void {
        this.router.navigate(['/espace-commercial/commande']);
    }

    proceedToCheckout(): void {
        if (confirm('Êtes-vous sûr de vouloir passer cette commande pour le vétérinaire ?')) {
            this.isCheckingOut = true;

            const matricule = sessionStorage.getItem('validatedMatricule');

            if (matricule) {
                // Commercial checkout flow
                this.cartService.confirmCommercialOrder(matricule).subscribe({
                    next: (response) => {
                        this.isCheckingOut = false;

                        if (response.success && response.data) {
                            // Store order confirmation data
                            this.orderNumber = response.data.orderNumber || '';
                            this.confirmedVetEmail = response.data.vetEmail || '';
                            this.orderTotalAmount = response.data.totalAmount || 0;
                            
                            // Show success modal
                            this.showSuccessModal = true;
                            document.body.style.overflow = 'hidden';
                        } else {
                            alert('Erreur lors de la commande: ' + (response.error || 'Erreur inconnue'));
                        }
                    },
                    error: (error) => {
                        this.isCheckingOut = false;
                        alert('Erreur lors de la commande. Veuillez réessayer.');
                    }
                });
            } else {
                // Fallback to standard checkout (though arguably shouldn't happen in commercial view)
                const commercialUserId = localStorage.getItem('userId') || '';
                this.cartService.checkout(commercialUserId).subscribe({
                    next: (response) => {
                        this.isCheckingOut = false;

                        if (response.error) {
                            alert('Erreur lors de la commande: ' + response.error);
                        } else {
                            // Show success modal
                            this.showSuccessModal = true;
                            document.body.style.overflow = 'hidden';
                        }
                    },
                    error: (error) => {
                        this.isCheckingOut = false;
                        alert('Erreur lors de la commande. Veuillez réessayer.');
                    }
                });
            }
        }
    }

    closeSuccessModal(): void {
        this.showSuccessModal = false;
        document.body.style.overflow = 'auto';
        this.router.navigate(['/espace-commercial']);
    }

    clearCart(): void {
        if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
            this.itemOrder = []; // Clear order tracking
            const matricule = sessionStorage.getItem('validatedMatricule');
            if (matricule) {
                this.cartService.clearCommercialCart(matricule);
            } else {
                this.cartService.clearCart();
            }
        }
    }

    trackByCartItemId(_index: number, item: CartItem): number {
        return item.id;
    }

    /**
     * Get display label for category
     */
    getCategoryLabel(category?: string): string {
        if (!category) return '';

        const labels: { [key: string]: string } = {
            'CHIEN': 'Chien',
            'CHAT': 'Chat',
            'Chien': 'Chien',
            'Chat': 'Chat'
        };
        return labels[category] || category;
    }

    /**
     * Get display label for sub-category
     */
    getSubCategoryLabel(subCategory?: string): string {
        if (!subCategory) return '';

        const labels: { [key: string]: string } = {
            'ALIMENT': 'Aliment',
            'COMPLEMENT': 'Complément',
            'TEST_RAPIDE': 'Test rapide',
            'Aliment': 'Aliment',
            'Complément': 'Complément',
            'Test rapide': 'Test rapide'
        };
        return labels[subCategory] || subCategory;
    }

    /**
     * Handle image load error
     */
    onImageError(event: Event): void {
        this.imageErrorHandler.handleImageError(event);
    }

    // Navbar UI Methods
    toggleProfileDropdown() {
        this.showProfileDropdown = !this.showProfileDropdown;
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false;
    }

    openPasswordModal() {
        this.showPasswordModal = true;
        this.showProfileDropdown = false;
        this.passwordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    closePasswordModal() {
        this.showPasswordModal = false;
        this.passwordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    changeVeterinarian() {
        sessionStorage.removeItem('validatedMatricule');
        sessionStorage.removeItem('vetId');
        sessionStorage.removeItem('vetName');
        sessionStorage.removeItem('vetEmaill');
        this.router.navigate(['/espace-commercial']);
    }

    changePassword() {
        this.passwordError = '';
        this.passwordSuccess = '';

        if (this.passwordForm.invalid) {
            this.passwordError = 'Veuillez remplir tous les champs.';
            return;
        }

        const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

        if (newPassword !== confirmPassword) {
            this.passwordError = 'Les mots de passe ne correspondent pas.';
            return;
        }

        if (newPassword.length < 6) {
            this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
            return;
        }

        this.passwordLoading = true;

        this.http.put<any>(
            `${environment.apiUrl}/user/change-password`,
            { oldPassword, newPassword },
            { withCredentials: true }
        ).subscribe({
            next: () => {
                this.passwordLoading = false;
                this.passwordSuccess = 'Mot de passe modifié avec succès !';
                setTimeout(() => this.closePasswordModal(), 1500);
            },
            error: (error) => {
                this.passwordLoading = false;

                if (error.status === 401) {
                    this.passwordError = 'Ancien mot de passe incorrect.';
                } else if (error.status === 400) {
                    this.passwordError = error.error?.message || 'Données invalides.';
                } else {
                    this.passwordError = 'Erreur lors du changement de mot de passe.';
                }
            }
        });
    }

    logout() {
        this.authService.logout('/login');
    }
}
