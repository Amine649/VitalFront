import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { AuthMonitorService } from './services/auth-monitor.service';
import { AuthService } from './services/auth.service';
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
  sidebarOpen: boolean = true;
  produitsSidebarOpen: boolean = true;
  showProfileDropdown: boolean = false;
  mobileMenuOpen: boolean = false;
  userFullName: string = '';

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
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {
    // Initialize current route
    this.currentRoute = this.router.url;
    
    // Initialize password form
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    // Listen to route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const previousRoute = this.currentRoute;
      this.currentRoute = event.urlAfterRedirects;
      
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
    return this.isEspaceProprietaire || this.isProduitsVeterinaire;
  }

  get shouldShowNavbar(): boolean {
    return !this.isAdmin && !this.isEspaceVeterinaire && !this.isFormulaireVet && !this.isProduitsVeterinaire && !this.isEspaceCommercial && !this.isConseilArticles;
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
  }

  navigateToProductLocations() {
    this.router.navigate(['/ou-trouver-nos-produits']);
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

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
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

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthColor = '';
      return;
    }
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    if (checks.length) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;
    this.passwordStrength = strength;
    if (strength <= 40) {
      this.passwordStrengthText = 'Faible';
      this.passwordStrengthColor = '#ef4444';
    } else if (strength <= 60) {
      this.passwordStrengthText = 'Moyen';
      this.passwordStrengthColor = '#f59e0b';
    } else if (strength <= 80) {
      this.passwordStrengthText = 'Bon';
      this.passwordStrengthColor = '#3b82f6';
    } else {
      this.passwordStrengthText = 'Excellent';
      this.passwordStrengthColor = '#10b981';
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    const body = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };
    this.http.post(`${environment.apiUrl}/reset-password`, body, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès !';
        setTimeout(() => {
          this.closePasswordModal();
        }, 2000);
      },
      error: (error) => {
        this.passwordLoading = false;
        console.error('Password change error:', error);
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          errorMessage = 'Le mot de passe actuel est incorrect.';
        }
        this.passwordError = errorMessage;
      }
    });
  }

  logout() {
    // Call backend to clear HttpOnly cookie
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.clear();
        if ('caches' in window) {
          caches.keys().then(function (names) {
            for (let name of names) caches.delete(name);
          });
        }
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}