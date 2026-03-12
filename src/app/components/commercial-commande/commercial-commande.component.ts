import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { ProductSkeletonComponent } from '../product-skeleton/product-skeleton.component';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';

@Component({
    selector: 'app-commercial-commande',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,
        InfiniteScrollDirective,
        ProductSkeletonComponent,
        LazyLoadImageDirective
    ],
    templateUrl: './commercial-commande.component.html',
    styleUrls: ['./commercial-commande.component.scss']
})
// Commercial ordering component - allows commercial users to place orders on behalf of veterinarians
export class CommercialCommandeComponent implements OnInit {
    // Validated veterinarian info
    vetMatricule: string = '';
    vetName: string = '';
    vetPrenom: string = '';
    vetId: string = '';

    // Products
    allProducts: Product[] = [];
    displayedProducts: Product[] = [];
    isLoading: boolean = true;
    errorMessage: string = '';

    // Categories
    categories = [
        { name: 'Chien', icon: '🐶', color: '#3B82F6' },
        { name: 'Chat', icon: '🐱', color: '#EF4444' }
    ];

    sousCategories = [
        { name: 'Aliment', icon: '🍖', description: 'Nourriture et friandises' },
        { name: 'Complément', icon: '💊', description: 'Suppléments nutritionnels' },
        { name: 'Test rapide', icon: '🧪', description: 'Tests de diagnostic' }
    ];

    selectedCategory: string | null = null;
    selectedSousCategory: string | null = null;
    selectedSubSubCategory: string | null = null;

    // Cart
    cartOpen = false;
    showAllProducts = false;
    cartItems: CartItem[] = [];
    cartCount = 0;
    cartTotal = 0;

    // Pagination
    currentPage = 1;
    itemsPerPage = 15;
    totalPages = 1;
    pages: number[] = [];

    Math = Math;
    highlightedProductId: number | null = null;

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
        private productService: ProductService,
        private http: HttpClient,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef
    ) {
        this.passwordForm = this.fb.group({
            oldPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });
    }

    ngOnInit() {
        // Load validated veterinarian info from sessionStorage (as backup/initial)
        this.loadVetInfo();

        // Fetch fresh details from backend (User table)
        if (this.vetMatricule) {
            this.fetchVetDetails(this.vetMatricule);
            this.cartService.loadCommercialCart(this.vetMatricule);
        }

        // Load products
        this.loadProducts();

        // Subscribe to cart changes
        this.cartService.cartItems$.subscribe((items: CartItem[]) => {
            this.cartItems = items;
            this.cartCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
            this.cartTotal = items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        });
    }

    loadVetInfo() {
        this.vetMatricule = sessionStorage.getItem('validatedMatricule') || '';
        this.vetId = sessionStorage.getItem('vetId') || '';
        this.vetName = sessionStorage.getItem('vetName') || '';
        this.vetPrenom = sessionStorage.getItem('vetPrenom') || '';

        // If no validated matricule, redirect back
        if (!this.vetMatricule) {
            this.router.navigate(['/espace-commercial']);
        }
    }

    fetchVetDetails(matricule: string) {
        // Fetch fresh details from User table
        this.http.get<any[]>(`${environment.apiUrl}/ourveterinaires/all`, { withCredentials: true })
            .subscribe({
                next: (users) => {
                    // Case-insensitive and trimmed comparison
                    const vet = users.find(u => {
                        if (!u.matricule) return false;
                        const dbMatricule = u.matricule.trim().toLowerCase();
                        const searchMatricule = matricule.trim().toLowerCase();
                        return dbMatricule === searchMatricule;
                    });

                    if (vet) {
                        // Update local state with fresh data
                        this.vetName = vet.nom;
                        this.vetPrenom = vet.prenom;
                        this.vetId = vet.id;

                        // Update sessionStorage to persist across refreshes
                        sessionStorage.setItem('vetName', this.vetName);
                        sessionStorage.setItem('vetPrenom', this.vetPrenom);
                        sessionStorage.setItem('vetId', this.vetId);
                    }
                },
                error: (error) => {
                    console.error('Error fetching users:', error);
                }
            });
    }

    loadProducts(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.productService.getAllProducts().subscribe({
            next: (products: Product[]) => {
                // Set price from first variant (minimum ID) for each product
                this.allProducts = products.map(product => {
                    const p = product as any;
                    p.price = this.productService.getVariantPrice(product);
                    // Set the selected variant ID to the first variant
                    const firstVariant = this.productService.getFirstVariant(product);
                    if (firstVariant) {
                        p.selectedVariantId = firstVariant.id;
                    }
                    return p;
                });
                this.updateDisplayedProducts(); // Initial load
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error loading products:', error);
                this.errorMessage = 'Erreur lors du chargement des produits';
                this.isLoading = false;
            }
        });
    }

    onProductVariantChange(product: any): void {
        // Find the selected variant and update the product price
        if (product.variants && product.selectedVariantId) {
            // Convert to number in case it's a string from the select element
            const selectedId = typeof product.selectedVariantId === 'string' 
                ? parseInt(product.selectedVariantId, 10) 
                : product.selectedVariantId;
            
            const selectedVariant = product.variants.find((v: any) => v.id === selectedId);
            if (selectedVariant) {
                product.price = selectedVariant.price;
                console.log('Variant changed for product', product.id, ':', selectedVariant, 'New price:', product.price);
                // Manually trigger change detection to ensure UI updates
                this.cdr.detectChanges();
            } else {
                console.warn('Selected variant not found:', selectedId, 'Available variants:', product.variants);
            }
        }
    }

    updateDisplayedProducts(): void {
        const filteredProducts = this.getFilteredProducts();
        this.totalPages = Math.ceil(filteredProducts.length / this.itemsPerPage);
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

        // Ensure current page is valid
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }

        // If no products, stay on page 1 (or 0 if logic prefers, but 1 is safe)
        if (this.totalPages === 0) {
            this.currentPage = 1;
            this.displayedProducts = [];
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.displayedProducts = filteredProducts.slice(startIndex, endIndex);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updateDisplayedProducts();
            this.scrollToProducts();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updateDisplayedProducts();
            this.scrollToProducts();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDisplayedProducts();
            this.scrollToProducts();
        }
    }

    toggleShowAllProducts() {
        this.showAllProducts = !this.showAllProducts;
        if (this.showAllProducts) {
            this.selectedCategory = null;
            this.selectedSousCategory = null;
        }
        this.currentPage = 1;
        this.updateDisplayedProducts();
    }

    selectCategory(cat: string) {
        this.showAllProducts = false;
        // If clicking the same category, keep it selected (don't toggle off)
        // If clicking a different category, switch to it
        if (this.selectedCategory !== cat) {
            this.selectedCategory = cat;
            this.selectedSubSubCategory = null;
            this.currentPage = 1;
            this.updateDisplayedProducts();
        }
    }

    selectSousCategory(sub: string) {
        this.showAllProducts = false;
        // Toggle behavior for subcategory
        this.selectedSousCategory = this.selectedSousCategory === sub ? null : sub;
        this.selectedSubSubCategory = null;
        this.currentPage = 1;
        this.updateDisplayedProducts();
    }

    selectSubSubCategory(subSub: string) {
        this.selectedSubSubCategory = this.selectedSubSubCategory === subSub ? null : subSub;
        this.currentPage = 1;
        this.updateDisplayedProducts();
    }

    shouldShowSubSubCategoryFilter(): boolean {
        return this.selectedCategory !== null && this.selectedSousCategory === 'Aliment';
    }

    getFilteredProducts(): Product[] {
        let filtered = this.allProducts;

        if (!this.showAllProducts) {
            if (this.selectedCategory) {
                filtered = filtered.filter(p =>
                    this.normalizeString(p.category || '') === this.normalizeString(this.selectedCategory || '')
                );
            }
            if (this.selectedSousCategory) {
                filtered = filtered.filter(p =>
                    this.normalizeString(p.subCategory || '') === this.normalizeString(this.selectedSousCategory || '')
                );
            }
            if (this.selectedSubSubCategory) {
                filtered = filtered.filter(p =>
                    p.subSubCategory && this.normalizeString(p.subSubCategory) === this.normalizeString(this.selectedSubSubCategory || '')
                );
            }
        }

        return filtered;
    }

    normalizeString(str: string): string {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").toLowerCase() : '';
    }

    getCategoryLabel(category: string): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    getSubCategoryLabel(subCategory: string): string {
        return subCategory.charAt(0).toUpperCase() + subCategory.slice(1);
    }

    addToCart(product: Product) {
        const matricule = sessionStorage.getItem('validatedMatricule');
        if (matricule) {
            this.cartService.addToCommercialCart(product, matricule);
        } else {
            console.error('No validated matricule found');
            this.cartService.addToCart(product);
        }

        this.highlightedProductId = product.id;
        setTimeout(() => this.highlightedProductId = null, 1000);
    }

    viewCart() {
        this.router.navigate(['/espace-commercial/panier']);
    }

    changeVeterinarian() {
        sessionStorage.removeItem('validatedMatricule');
        sessionStorage.removeItem('vetId');
        sessionStorage.removeItem('vetName');
        sessionStorage.removeItem('vetPrenom');
        this.router.navigate(['/espace-commercial']);
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E';
    }

    scrollToProducts(): void {
        const productsSection = document.querySelector('.grid.lg\\:grid-cols-12'); // Adjust selector if needed
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
                console.error('Password change error:', error);

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
        this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
            next: () => {
                localStorage.clear();
                sessionStorage.clear();
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error('Logout error', err);
                localStorage.clear();
                sessionStorage.clear();
                this.router.navigate(['/login']);
            }
        });
    }
}
