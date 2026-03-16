import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { ProductSkeletonComponent } from '../product-skeleton/product-skeleton.component';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';
import { AuthService } from '../../services/auth.service';
import { PasswordValidationService } from '../../services/password-validation.service';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

@Component({
  selector: 'app-produits-veterinaire',
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
  templateUrl: './produits-veterinaire.component.html',
  styleUrls: ['./produits-veterinaire.component.scss']
})
export class ProduitsVeterinaireComponent implements OnInit {
  allProducts: Product[] = [];
  displayedProducts: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

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

  cartOpen = false;
  showAllProducts = false;
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartTotal = 0;

  // Infinite scroll properties
  currentPage = 1;
  itemsPerPage = 10;

  Math = Math;
  highlightedProductId: number | null = null;

  showProfileDropdown = false;
  showPasswordModal = false;
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthColor = '';
  userName: string = '';
  userFullName: string = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private passwordValidation: PasswordValidationService,
    private imageErrorHandler: ImageErrorHandlerService
  ) {
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidation.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordValidation.passwordMatchValidator });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  updatePasswordStrength(password: string): void {
    const info = this.passwordValidation.getPasswordStrengthInfo(password);
    this.passwordStrength = info.percentage;
    this.passwordStrengthText = info.label;
    this.passwordStrengthColor = info.color;
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  

  ngOnInit() {
    this.checkAuthentication();
    this.loadUserData();
    this.loadProducts();
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
    this.route.queryParams.subscribe(params => {
      if (params['animal']) {
        this.selectedCategory = this.capitalizeFirst(params['animal']);
        
        // If animal is selected but no type is specified, default to 'Aliment'
        if (!params['type']) {
          this.selectedSousCategory = 'Aliment';
          // Update URL with default type
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { animal: params['animal'], type: 'aliment' },
            queryParamsHandling: 'merge'
          });
        } else {
          this.selectedSousCategory = this.mapProductType(params['type']);
        }
      } else {
        this.selectedCategory = null;
        this.selectedSousCategory = null;
      }
      
      if (params['highlight']) {
        this.highlightedProductId = +params['highlight'];
        setTimeout(() => {
          this.highlightedProductId = null;
        }, 3000);
      }

      // Refresh filtered view when params change
      this.resetDisplayedProducts();
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapProductType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'aliment': 'Aliment',
      'complement': 'Complément',
      'test-rapide': 'Test rapide'
    };
    return typeMap[type] || type;
  }

  checkAuthentication(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
    }
  }

  loadUserData(): void {
    this.authService.loadUserData().subscribe({
      next: (data) => {
        this.userName = data.nom || '';
        this.userFullName = `${data.prenom || ''} ${data.nom || ''}`.trim();
        this.authService.storeUserData(data);
      }
    });
  }

  logout(): void {
    this.authService.logout('/login');
  }

  navigateToPanier(): void {
    this.router.navigate(['/panier']);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Flatten products: create a separate product entry for each variant
        this.allProducts = [];
        products.forEach(product => {
          const p = product as any;
          
          if (p.variants && p.variants.length > 0) {
            // Create a separate product for each variant
            p.variants.forEach((variant: any) => {
              const productCopy = {
                ...p,
                // Use a composite ID to make each variant unique
                id: `${p.id}_${variant.id}`,
                originalProductId: p.id,
                variantId: variant.id,
                price: variant.price,
                packaging: variant.packaging,
                selectedVariantId: variant.id,
                // Keep the variants array for reference if needed
                variants: p.variants
              };
              this.allProducts.push(productCopy);
            });
          } else {
            // If no variants, add the product as is
            this.allProducts.push(p);
          }
        });
        
        this.isLoading = false;
        this.updateDisplayedProducts();
      },
      error: (error) => {
        this.errorMessage = error.message;
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
        // Manually trigger change detection to ensure UI updates
        this.cdr.detectChanges();
      }
    }
  }


  /**
   * Load more products for infinite scroll
   */
  getTotalPages(): number {
    return Math.ceil(this.getFilteredProducts().length / this.itemsPerPage);
  }

    getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updateDisplayedProducts();
      this.scrollToProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.updateDisplayedProducts();
      this.scrollToProducts();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedProducts();
      this.scrollToProducts();
    }
  }

  updateDisplayedProducts(): void {
    const filtered = this.getFilteredProducts();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = filtered.slice(startIndex, endIndex);
  }


  /**
   * Reset displayed products when filters change
   */
 resetDisplayedProducts(): void {
    this.currentPage = 1;
    this.updateDisplayedProducts();
  }




  toggleCart() {
    this.cartOpen = !this.cartOpen;
  }

  toggleShowAllProducts() {
    this.showAllProducts = !this.showAllProducts;

  }

  selectCategory(cat: string) {
    // If clicking the same category, keep it selected (don't toggle off)
    // If clicking a different category, switch to it
    if (this.selectedCategory !== cat) {
      this.selectedCategory = cat;
      this.selectedSousCategory = null;
      this.selectedSubSubCategory = null;
      this.resetDisplayedProducts(); // Reset when category changes
    }
  }

  selectSousCategory(sub: string) {
    // Toggle behavior for subcategory
    this.selectedSousCategory = this.selectedSousCategory === sub ? null : sub;
    this.selectedSubSubCategory = null;
    this.showAllProducts = true;

    this.resetDisplayedProducts(); // Reset when subcategory changes
  }

  selectSubSubCategory(subSub: string) {
    this.selectedSubSubCategory = this.selectedSubSubCategory === subSub ? null : subSub;
    this.resetDisplayedProducts();
  }

  shouldShowSubSubCategoryFilter(): boolean {
    const normalizedSousCategory = this.selectedSousCategory?.toLowerCase();
    return this.selectedCategory !== null && normalizedSousCategory === 'aliment';
  }

  getFilteredProducts(): Product[] {
    return this.productService.filterProducts(
      this.allProducts,
      this.selectedCategory,
      this.selectedSousCategory,
      this.selectedSubSubCategory
    );
  }

  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  getCategoryEmoji(category: string): string {
    return this.productService.getCategoryEmoji(category);
  }

  getSubCategoryEmoji(subCategory: string): string {
    return this.productService.getSubCategoryEmoji(subCategory);
  }

  addToCart(product: Product) {
    // Create a copy of the product with the current selected variant's price
    const productToAdd = {
      ...product,
      price: product.price // This already has the updated price from onProductVariantChange
    };
    
    this.cartService.addToCart(productToAdd);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByCartItemId(index: number, item: CartItem): number {
    return item.id;
  }

  /**
   * Get total count of filtered products
   */
  getTotalProductsCount(): number {
    return this.getFilteredProducts().length;
  }

  /**
   * Get count of currently displayed products
   */
  getDisplayedProductsCount(): number {
    return this.displayedProducts.length;
  }

  /**
   * Handle infinite scroll event
   */


  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.showProfileDropdown = false;
    }
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showProfileDropdown = false;
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
    document.body.style.overflow = 'hidden';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    document.body.style.overflow = 'auto';
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    
    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.authService.changePassword(
      this.passwordForm.value.currentPassword,
      this.passwordForm.value.newPassword
    ).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès !';
        setTimeout(() => {
          this.closePasswordModal();
        }, 2000);
      },
      error: (error) => {
        this.passwordLoading = false;
        this.passwordError = this.authService.getPasswordChangeErrorMessage(error);
      }
    });
  }

  navigateToVetSpace(): void {
    this.router.navigate(['/espace-veterinaire']);
  }

  onImageError(event: Event): void {
    this.imageErrorHandler.handleImageError(event);
  }
  scrollToProducts(): void {
    const productsElement = document.querySelector('.products-header');
    if (productsElement) {
      productsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getProductPrice(product: Product): number {
    // Get price from first variant (minimum ID) using the service method
    return this.productService.getVariantPrice(product);
  }

  getProductPackaging(product: Product): string {
    // Get packaging from first variant (minimum ID) using the service method
    return this.productService.getVariantPackaging(product);
  }

  getSelectedVariantPackaging(product: any): string {
    // Get packaging from the currently selected variant
    if (product.variants && product.selectedVariantId) {
      const selectedVariant = product.variants.find((v: any) => v.id === product.selectedVariantId);
      if (selectedVariant) {
        return selectedVariant.packaging;
      }
    }
    return this.getProductPackaging(product);
  }
}
