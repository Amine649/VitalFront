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

    // Vet Info
    vetMatricule: string = '';
    vetName: string = '';
    vetPrenom: string = '';
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
            this.cartItems = items;
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
                        
                        // Match current price to find selected variant
                        const currentVariant = item.variants?.find(v => v.price === item.price);
                        if (currentVariant) {
                            item.selectedVariantId = currentVariant.id;
                        } else {
                            // Use first variant as default
                            const sortedVariants = [...item.variants].sort((a, b) => a.id - b.id);
                            if (sortedVariants.length > 0) {
                                item.selectedVariantId = sortedVariants[0].id;
                                item.price = sortedVariants[0].price;
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

    onVariantChange(item: CartItem, variantId: number | string): void {
        const numericVariantId = typeof variantId === 'string' ? parseInt(variantId, 10) : variantId;
        const selectedVariant = item.variants?.find(v => v.id === numericVariantId);
        
        if (selectedVariant && item.productId) {
            item.price = selectedVariant.price;
            item.selectedVariantId = numericVariantId;
            
            // Update on backend
            const matricule = sessionStorage.getItem('validatedMatricule');
            if (matricule) {
                this.cartService.updateCommercialItemQuantity(matricule, item.id, item.productId, item.quantity, numericVariantId);
            }
            
            this.cartItems = [...this.cartItems];
            this.recalculateTotal();
        }
    }

    loadVetInfo() {
        this.vetMatricule = sessionStorage.getItem('validatedMatricule') || '';
        this.vetId = sessionStorage.getItem('vetId') || '';
        this.vetName = sessionStorage.getItem('vetName') || '';
        this.vetPrenom = sessionStorage.getItem('vetPrenom') || '';
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
        sessionStorage.removeItem('vetPrenom');
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
