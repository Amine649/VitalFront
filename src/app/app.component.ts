import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { AuthMonitorService } from './services/auth-monitor.service';
import { AuthService } from './services/auth.service';
import { PasswordValidationService } from './services/password-validation.service';
import { ToastComponent } from './components/toast/toast.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'vet-app';
  currentRoute: string = '';
  cartItemsCount: number = 0;
  selectedProductFilter: string = 'tous';
  selectedSubType: string = '';
  sidebarOpen: boolean = this.isMobileView() ? false : true;
  produitsSidebarOpen: boolean = this.isMobileView() ? false : true;
  showProfileDropdown: boolean = false;
  mobileMenuOpen: boolean = false;
  userFullName: string = '';
  
  // Explicit navbar visibility flag that updates on every route change
  showNavbar: boolean = true;
  
  // Layout flags that update on every route change
  isEspaceProprietaireLayout: boolean = false;
  isProduitsVeterinaireLayout: boolean = false;

  // Password modal
  showPasswordModal: boolean = false;
  passwordForm: FormGroup;
  passwordLoading: boolean = false;
  passwordError: string = '';
  passwordSuccess: string = '';
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: number = 0;
  passwordStrengthText: string = '';
  passwordStrengthColor: string = '';

  // Available product types based on actual products
  availableProductTypes = [
    { key: 'aliment', label: 'Aliment', animals: ['chien', 'chat'] },
    { key: 'complement', label: 'Complément', animals: ['chien', 'chat'] },
    { key: 'test-rapide', label: 'Test rapide', animals: ['chien', 'chat'] }
  ];

  constructor(
    private router: Router,
    private cartService: CartService,
    private authMonitor: AuthMonitorService,
    private authService: AuthService,
    private passwordValidation: PasswordValidationService,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize current route
    this.currentRoute = this.router.url;
    
    // Calculate initial navbar visibility
    this.updateNavbarVisibility();
    
    // Initialize password form
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidation.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordValidation.passwordMatchValidator });
    
    // Listen to password changes for strength indicator
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
    
    // Listen to route changes - this ensures currentRoute is always up to date
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const previousRoute = this.currentRoute;
      
     this.currentRoute = event.urlAfterRedirects;
      this.updateNavbarVisibility(event.urlAfterRedirects); // pass it directly
      this.cdr.detectChanges();
      
      // Parse query parameters from URL
      const urlParams = new URLSearchParams(this.currentRoute.split('?')[1] || '');
      const animalParam = urlParams.get('animal');
      const typeParam = urlParams.get('type');
      
      // Update filters based on URL parameters
      if (animalParam) {
        this.selectedProductFilter = animalParam;
      }
      if (typeParam) {
        this.selectedSubType = typeParam;
      }
      
      // Only reset filters when navigating away from espace-proprietaire or produits-veterinaire
      const isProductPage = this.currentRoute.includes('/espace-proprietaire') || 
                           this.currentRoute.includes('/produits-veterinaire');
      const wasProductPage = previousRoute.includes('/espace-proprietaire') || 
                            previousRoute.includes('/produits-veterinaire');
      
      // Reset filters only when leaving product pages
      if (!isProductPage && wasProductPage) {
        this.selectedProductFilter = 'tous';
        this.selectedSubType = '';
      }

      // Close mobile menu on navigation
      this.mobileMenuOpen = false;

      // Refresh user full name from localStorage on route change
      const storedName = localStorage.getItem('userFullName');
      if (storedName) {
        this.userFullName = storedName;
      }
    });

    // Subscribe to cart count changes
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemsCount = count;
    });
  }

  ngOnInit(): void {
    // Start monitoring authentication state on route changes
    this.authMonitor.startMonitoring();

    // Load user name from localStorage
    const storedName = localStorage.getItem('userFullName');
    if (storedName) {
      this.userFullName = storedName;
    }
    
    // Set initial sidebar state based on screen size
    this.updateSidebarStateForScreenSize();
  }

  // Check if current view is mobile
  isMobileView(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  }

  // Update sidebar state based on screen size
  updateSidebarStateForScreenSize(): void {
    const isMobile = this.isMobileView();
    this.sidebarOpen = !isMobile;
    this.produitsSidebarOpen = !isMobile;
  }

  // Listen to window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateSidebarStateForScreenSize();
  }

  get isAdmin(): boolean {
    // With HttpOnly cookies, we can't check the token
    // Only check if user is marked as admin and on admin route
    const isAdminFlag = localStorage.getItem('isAdmin');
    return isAdminFlag === 'true' && this.currentRoute.includes('/admin');
  }

  get isEspaceProprietaire(): boolean {
    return this.currentRoute.includes('/espace-proprietaire');
  }

  get isEspaceVeterinaire(): boolean {
    return this.currentRoute.includes('/espace-veterinaire');
  }

  get isProduitsVeterinaire(): boolean {
    return this.currentRoute.includes('/produits-veterinaire');
  }

  get isPanier(): boolean {
    return this.currentRoute.includes('/panier');
  }

  get isFormulaireVet(): boolean {
    return this.currentRoute.includes('/formulaireVet');
  }

  get isFormulaireUser(): boolean {
    return this.currentRoute.includes('/formulaireUser');
  }

  get isEspaceCommercial(): boolean {
    return this.currentRoute.includes('/espace-commercial') || 
           this.currentRoute.includes('espace-commercial/commande') || 
           this.currentRoute.includes('espace-commercial/panier');
  }

  get navbarTitle(): string {
    return 'VITALFEED';
  }

  get showCart(): boolean {
    return this.isProduitsVeterinaire;
  }

  get shouldShowNavbar(): boolean {
    return this.showNavbar;
  }

  /**
   * Update navbar visibility based on current route
   * This method is called on every route change to ensure navbar state is correct
   */
      // Update the method signature

      private updateNavbarVisibility(route?: string): void {
  const currentPath = (route || this.currentRoute).split('?')[0];

  const hideNavbarRoutes = [
    '/admin',
    '/espace-veterinaire',
    '/formulaireVet',
    '/produits-veterinaire',
    '/espace-commercial',
    '/panier'
  ];

  if (hideNavbarRoutes.some(r => currentPath.startsWith(r))) {
    this.showNavbar = false;
    return;
  }

  this.showNavbar = true;
}

  get isOuTrouverNosProduits(): boolean {
    return this.currentRoute.includes('/ou-trouver-nos-produits');
  }

  get isConseilArticles(): boolean {
    return this.currentRoute.includes('/conseil-articles');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProduitsSidebar() {
    this.produitsSidebarOpen = !this.produitsSidebarOpen;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  getAvailableSubTypes() {
    if (this.selectedProductFilter === 'tous') {
      return [];
    }
    // Always return all 3 types for both chien and chat
    return this.availableProductTypes;
  }

  selectProductFilter(filter: string) {
    this.selectedProductFilter = filter;
    this.selectedSubType = '';

    // Determine which page to navigate to based on current route
    const targetRoute = this.isEspaceProprietaire ? '/espace-proprietaire' : '/produits-veterinaire';

    if (filter === 'tous') {
      // Show all products from both animals and all types
      this.router.navigate([targetRoute], { queryParams: {} });
    } else {
      // Navigate with animal filter only
      this.router.navigate([targetRoute], {
        queryParams: { animal: filter }
      });
    }
    
    // Close sidebar on mobile after selection
    if (this.isMobileView()) {
      if (this.isEspaceProprietaire) {
        this.sidebarOpen = false;
      } else if (this.isProduitsVeterinaire) {
        this.produitsSidebarOpen = false;
      }
    }
  }

  selectSubType(type: string) {
    // Determine which page to navigate to based on current route
    const targetRoute = this.isEspaceProprietaire ? '/espace-proprietaire' : '/produits-veterinaire';

    // Toggle selection - if already selected, deselect it
    if (this.selectedSubType === type) {
      this.selectedSubType = '';
      // Navigate with only animal filter
      if (this.selectedProductFilter === 'tous') {
        this.router.navigate([targetRoute], { queryParams: {} });
      } else {
        this.router.navigate([targetRoute], {
          queryParams: { animal: this.selectedProductFilter }
        });
      }
    } else {
      this.selectedSubType = type;

      if (this.selectedProductFilter === 'tous') {
        // If "tous" is selected, filter by product type only (all animals)
        this.router.navigate([targetRoute], {
          queryParams: { type: type }
        });
      } else {
        // Filter by both animal and product type
        this.router.navigate([targetRoute], {
          queryParams: {
            animal: this.selectedProductFilter,
            type: type
          }
        });
      }
    }
    
    // Close sidebar on mobile after selection
    if (this.isMobileView()) {
      if (this.isEspaceProprietaire) {
        this.sidebarOpen = false;
      } else if (this.isProduitsVeterinaire) {
        this.produitsSidebarOpen = false;
      }
    }
  }

  navigateToProductLocations() {
    this.router.navigate(['/ou-trouver-nos-produits']);
    
    // Close sidebar on mobile after navigation
    if (this.isMobileView()) {
      if (this.isEspaceProprietaire) {
        this.sidebarOpen = false;
      } else if (this.isProduitsVeterinaire) {
        this.produitsSidebarOpen = false;
      }
    }
  }

  navigateToVetSpace() {
    this.router.navigate(['/espace-veterinaire']);
  }

  toggleProfileDropdown() {
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

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return password.length >= 8;
  }

  hasUpperCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  updatePasswordStrength(password: string): void {
    const info = this.passwordValidation.getPasswordStrengthInfo(password);
    this.passwordStrength = info.percentage;
    this.passwordStrengthText = info.label;
    this.passwordStrengthColor = info.color;
  }

  changePassword(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.passwordForm.controls).forEach(key => {
      this.passwordForm.get(key)?.markAsTouched();
    });

    if (this.passwordForm.invalid) {
      // Show which fields are invalid
      const errors: string[] = [];
      
      if (this.passwordForm.get('currentPassword')?.invalid) {
        errors.push('Mot de passe actuel requis');
      }
      if (this.passwordForm.get('newPassword')?.hasError('required')) {
        errors.push('Nouveau mot de passe requis');
      }
      if (this.passwordForm.get('newPassword')?.hasError('minlength')) {
        errors.push('Le nouveau mot de passe doit contenir au moins 8 caractères');
      }
      if (this.passwordForm.get('newPassword')?.hasError('passwordStrength')) {
        errors.push('Le nouveau mot de passe doit contenir au moins 1 majuscule et 1 caractère spécial');
      }
      if (this.passwordForm.get('confirmPassword')?.invalid) {
        errors.push('Confirmation du mot de passe requise');
      }
      if (this.passwordForm.hasError('passwordMismatch')) {
        errors.push('Les mots de passe ne correspondent pas');
      }
      
      this.passwordError = errors.join('. ');
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

  logout() {
    this.authService.logout('/login');
  }
}

