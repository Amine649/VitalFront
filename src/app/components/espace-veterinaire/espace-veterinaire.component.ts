import { Component, ViewChild, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { SafePipe } from '../../pipes/safe.pipe';
import { AuthService } from '../../services/auth.service';
import { PasswordValidationService } from '../../services/password-validation.service';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  type: string;
  pdfFilename: string;
  pdfRelativePath: string;
  fileSize: number;
  createdAt: string;
}

@Component({
  selector: 'app-espace-veterinaire',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule, SafePipe],
  templateUrl: './espace-veterinaire.component.html',
  styleUrls: ['./espace-veterinaire.component.scss']
})
export class EspaceVeterinaireComponent implements OnInit, OnDestroy {
  @ViewChild('demoVideo') demoVideo!: ElementRef<HTMLVideoElement>;

  showDemoModal = false;
  demoVideoPath = 'assets/videos/vitalfeed-demo.mp4';

  // Profile dropdown
  showProfileDropdown = false;
  showPasswordModal = false;
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Password strength
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthColor = '';

  // All available products
  allProducts: Product[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  productsLoaded: boolean = false;

  // Dynamic selection of featured products
  products: Product[] = [];
  displayProducts: Product[] = []; // Products with duplicates for infinite scroll

  // Carousel properties
  currentSlide = 0;
  autoSlideInterval: any;
  itemsPerSlide = 3; // Number of items to show per slide on desktop

  // Cart properties
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartTotal = 0;

  // User status and info
  userStatus: string = '';
  userName: string = '';
  userFullName: string = '';

  // Blog properties
  blogCurrentPage = 1;
  blogItemsPerPage = 17;
  blogPosts: BlogPost[] = [];
  isLoadingBlogs = false;
  blogError = '';
  
  // PDF Modal
  showPdfModal = false;
  currentPdfUrl = '';
  currentPdfTitle = '';
  isPdfLoading = false;
  pdfBlobUrl: any = null;

  get showPricing(): boolean {
    // Show pricing if status is NOT 'ACTIVE' (so INACTIVE, PENDING, or empty)
    return this.userStatus !== 'ACTIVE';
  }

  features = [
    {
      icon: '📋',
      title: 'Antécédents médicaux',
      description: 'Les antécédents médicaux doivent inclure les antécédents de vaccination, les méthodes d\'alimentation, de prévention contre les parasites et les puces, ainsi que toutes les maladies, traitements ou médicaments quotidiens antérieurs.',
      details: [
        'Historique de vaccination complet',
        'Méthodes d\'alimentation utilisées',
        'Prévention antiparasitaire',
        'Traitements antérieurs',
        'Médications quotidiennes'
      ],
      color: 'blue',
      badge: 'Essentiel'
    },
    {
      icon: '🍽️',
      title: 'Histoire nutritionnelle',
      description: 'L\'anamnèse nutritionnelle comprend une évaluation détaillée du patient, incluant les éléments suivants : alimentation (les aliments destinés à l\'alimentation animale doivent être identifiés par marque, type et saveur), méthodes d\'alimentation, quantité nourrie, modifications récentes du régime alimentaire, mobilité et exercice.',
      details: [
        'Marque et type d\'aliment',
        'Méthodes d\'alimentation',
        'Quantité nourrie quotidiennement',
        'Modifications récentes',
        'Niveau d\'activité physique'
      ],
      color: 'green',
      badge: 'Important'
    },
    {
      icon: '🩺',
      title: 'Examen physique',
      description: 'L\'examen physique comprend l\'évaluation des éléments suivants : poids corporel, Score de condition corporelle (BCS) - Système de notation de 1 à 9 points, Estimation de la masse grasse corporelle, Score de condition musculaire (MCS), Palpation des temporaux, des omoplates, des vertèbres lombaires et des os du bassin, Examen buccal et rectal, Évaluation de la peau et du pelage.',
      details: [
        'Poids corporel',
        'BCS (1-9 points)',
        'Masse grasse corporelle',
        'Score musculaire (MCS)',
        'Palpation osseuse',
        'Examen buccal et rectal',
        'État de la peau et pelage'
      ],
      color: 'purple',
      badge: 'Critique'
    },
    {
      icon: '🔬',
      title: 'Bilan / Analyses',
      description: 'Ce bilan comprend notamment un examen de laboratoire incluant une numération formule sanguine (NFS), un bilan biochimique sanguin, un bilan thyroïdien et une analyse d\'urine. Les résultats des analyses de laboratoire pouvant indiquer des carences nutritionnelles susceptibles d\'être corrigées par une intervention nutritionnelle sont l\'anémie, l\'hypoalbuminémie, l\'hypokaliémie, l\'hyperuricémie et l\'hypertriglycéridémie, l\'hyperglycémie ou l\'hypercholestérolémie. Ces résultats peuvent également révéler des signes précoces d\'insuffisance rénale ou hépatique.',
      details: [
        'NFS (Numération Formule Sanguine)',
        'Bilan biochimique sanguin',
        'Bilan thyroïdien',
        'Analyse d\'urine',
        'Détection carences nutritionnelles',
        'Signes d\'insuffisance rénale/hépatique'
      ],
      color: 'red',
      badge: 'Diagnostic',
      fullWidth: true
    }
  ];

  plans = [
    {
      name: 'Essentiel',
      price: '29',
      period: 'mois',
      description: 'Parfait pour les petites cliniques',
      features: [
        'Jusqu\'à 100 patients',
        'Gestion de base des dossiers',
        'Planification des RDV',
        'Support email'
      ],
      recommended: false
    },
    {
      name: 'Professionnel',
      price: '59',
      period: 'mois',
      description: 'Idéal pour la plupart des vétérinaires',
      features: [
        'Patients illimités',
        'Toutes les fonctionnalités',
        'Statistiques avancées',
        'Support prioritaire',
        'Intégrations tierces'
      ],
      recommended: true
    },
    {
      name: 'Clinique',
      price: '99',
      period: 'mois',
      description: 'Pour les grandes structures',
      features: [
        'Multi-vétérinaires',
        'Gestion d\'équipe',
        'Rapports personnalisés',
        'Formation incluse',
        'Support téléphonique'
      ],
      recommended: false
    }
  ];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private passwordValidation: PasswordValidationService,
    private imageErrorHandler: ImageErrorHandlerService
  ) {
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidation.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordValidation.passwordMatchValidator });

    // Watch for password changes to update strength indicator
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  /**
   * Update password strength indicator
   */
  updatePasswordStrength(password: string): void {
    const info = this.passwordValidation.getPasswordStrengthInfo(password);
    this.passwordStrength = info.percentage;
    this.passwordStrengthText = info.label;
    this.passwordStrengthColor = info.color;
  }

  /**
   * Toggle password visibility
   */
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
    // Auth guard already verified authentication, no need to check again

    // Load user name from localStorage as immediate fallback
    const storedName = localStorage.getItem('userFullName');
    if (storedName) {
      this.userFullName = storedName;
    }

    // Load user data to get status and update name
    this.loadUserData();

    // Load products automatically on page load
    this.loadProducts();
    
    // Load blog posts
    this.loadBlogPosts();

    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
      this.cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
  }



  /**
   * Load user data to get status
   */
  loadUserData(): void {
    this.authService.loadUserData(true).subscribe({
      next: (data) => {
        this.userStatus = data.status || '';
        this.userName = data.nom || '';
        this.userFullName = `${data.prenom || ''} ${data.nom || ''}`.trim();
        this.authService.storeUserData(data, true);
      },
      error: (error) => {
        // If 401, session expired - redirect to login
        if (error.status === 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        } else {
          // For other errors, assume INACTIVE status to show pricing/CTA
          this.userStatus = 'INACTIVE';
        }
      }
    });
  }

  /**
   * Toggle profile dropdown
   */
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  /**
   * Close profile dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.showProfileDropdown = false;
    }
  }

  /**
   * Open password change modal
   */
  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showProfileDropdown = false;
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close password change modal
   */
  closePasswordModal(): void {
    this.showPasswordModal = false;
    document.body.style.overflow = 'auto';
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  /**
   * Change password
   */
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

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout('/login');
  }

  /**
   * Navigate to panier (cart) page
   */
  navigateToPanier(): void {
    this.router.navigate(['/panier']);
  }

  /**
   * Load products from API - only loads once when needed
   */
  loadProducts(): void {
    // Don't reload if already loaded
    if (this.productsLoaded) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Set price from first variant (minimum ID) for each product
        this.allProducts = products.map(product => {
          product.price = this.productService.getVariantPrice(product);
          return product;
        });
        this.products = this.getFeaturedProducts();
        this.createDisplayProducts();
        this.isLoading = false;
        this.productsLoaded = true;
        this.startAutoSlide();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Create display products by duplicating the array for infinite scroll effect
   */
  createDisplayProducts(): void {
    // Only duplicate if we have enough products to warrant infinite scrolling
    // If we have 3 or fewer products, just show them once
    if (this.products.length <= this.itemsPerSlide) {
      this.displayProducts = this.products;
    } else {
      // Duplicate products to create seamless loop
      this.displayProducts = [...this.products, ...this.products];
    }
  }

  /**
   * Load blog posts from API
   */
  loadBlogPosts(): void {
    this.isLoadingBlogs = true;
    this.blogError = '';

    this.http.get<BlogPost[]>(`${environment.apiUrl}/blogs/type/VETERINAIRE`, {
      withCredentials: true
    }).subscribe({
      next: (posts) => {
        this.blogPosts = posts;
        this.isLoadingBlogs = false;
      },
      error: (error) => {
        this.blogError = 'Erreur lors du chargement des articles';
        this.isLoadingBlogs = false;
      }
    });
  }

  /**
   * Format date for display
   */
  formatBlogDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  /**
   * Open PDF in modal
   */
  openPdfModal(post: BlogPost): void {
    if (!post.pdfRelativePath) {
      return;
    }

    const pathParts = post.pdfRelativePath.replace('/uploads/pdfs', '').split('/').filter(p => p);
    
    if (pathParts.length >= 3) {
      const year = pathParts[0];
      const month = pathParts[1];
      const filename = pathParts[2];
      
      const pdfUrl = `${environment.apiUrl}/blogs/pdf/${year}/${month}/${filename}`;
      
      this.currentPdfTitle = post.title;
      this.showPdfModal = true;
      this.isPdfLoading = true;
      document.body.style.overflow = 'hidden';
      
      this.http.get(pdfUrl, {
        responseType: 'blob',
        withCredentials: true
      }).subscribe({
        next: (blob: Blob) => {
          if (this.pdfBlobUrl) {
            URL.revokeObjectURL(this.pdfBlobUrl);
          }
          
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          this.pdfBlobUrl = URL.createObjectURL(pdfBlob);
          this.currentPdfUrl = this.pdfBlobUrl;
          
          setTimeout(() => {
            this.isPdfLoading = false;
          }, 300);
        },
        error: (error) => {
          this.isPdfLoading = false;
          
          // If status is 200 or 0 but still error (CORS issue), try direct URL fallback
          if (error.status === 200 || error.status === 0) {
            this.currentPdfUrl = pdfUrl;
            setTimeout(() => {
              this.isPdfLoading = false;
            }, 500);
          } else {
            // Real error, clear URL and show message
            this.currentPdfUrl = '';
            alert('Erreur lors du chargement du PDF (Status: ' + error.status + ')');
          }
        }
      });
    }
  }

  /**
   * Close PDF modal
   */
  closePdfModal(): void {
    this.showPdfModal = false;
    this.isPdfLoading = false;
    
    // Revoke blob URL to free memory
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
    
    this.currentPdfUrl = '';
    this.currentPdfTitle = '';
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  /**
   * Handle PDF iframe load event
   */
  onPdfLoad(): void {
  }

  /**
   * Handle PDF iframe error event
   */
  onPdfError(): void {
  }

  /**
   * Get paginated blog posts
   */
  getPaginatedBlogPosts(): BlogPost[] {
    const startIndex = (this.blogCurrentPage - 1) * this.blogItemsPerPage;
    const endIndex = startIndex + this.blogItemsPerPage;
    return this.blogPosts.slice(startIndex, endIndex);
  }

  /**
   * Get total blog pages
   */
  getBlogTotalPages(): number {
    return Math.ceil(this.blogPosts.length / this.blogItemsPerPage);
  }

  /**
   * Navigate to next blog page
   */
  nextBlogPage(): void {
    if (this.blogCurrentPage < this.getBlogTotalPages()) {
      this.blogCurrentPage++;
    }
  }

  /**
   * Navigate to previous blog page
   */
  previousBlogPage(): void {
    if (this.blogCurrentPage > 1) {
      this.blogCurrentPage--;
    }
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  // Method to dynamically select diverse products for display
  getFeaturedProducts(): Product[] {
    const featured: Product[] = [];
    const categories = ['CHIEN', 'CHAT'];
    const subCategories = ['ALIMENT', 'COMPLEMENT', 'TEST_RAPIDE'];

    // Try to get one product from each combination of category and subcategory
    for (const category of categories) {
      for (const subCategory of subCategories) {
        const productInCategory = this.allProducts.find(p =>
          p.category === category &&
          p.subCategory === subCategory &&
          !featured.includes(p)
        );

        if (productInCategory && featured.length < 6) {
          featured.push(productInCategory);
        }
      }
    }

    // If we don't have enough, add some random popular products
    if (featured.length < 6) {
      const remaining = this.allProducts.filter(p => !featured.includes(p) && p.inStock);
      while (featured.length < 6 && remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        featured.push(remaining.splice(randomIndex, 1)[0]);
      }
    }

    return featured;
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  /**
   * Get display label for sub-category
   */
  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  /**
   * Get emoji for category
   */
  getCategoryEmoji(category: string): string {
    return this.productService.getCategoryEmoji(category);
  }

  /**
   * Get emoji for sub-category
   */
  getSubCategoryEmoji(subCategory: string): string {
    return this.productService.getSubCategoryEmoji(subCategory);
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);

  }

  /**
   * Navigate to product in produits-veterinaire catalog
   */
  viewProductInCatalog(product: Product): void {
    // Navigate to produits-veterinaire page with product ID as query parameter
    this.router.navigate(['/produits-veterinaire'], {
      queryParams: { highlight: product.id }
    }).then(() => {
      // Scroll to top of page smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Refresh featured products (for potential future use)
  refreshFeaturedProducts(): void {
    this.products = this.getFeaturedProducts();
  }

  // Carousel methods
  startAutoSlide(): void {
    // Clear any existing interval
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }

    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 4000); // Auto slide every 4 seconds
  }

  getTotalSlides(): number {
    return Math.ceil(this.products.length / this.itemsPerSlide);
  }

  nextSlide(): void {
    // Only enable infinite scroll if we have more products than items per slide
    if (this.products.length <= this.itemsPerSlide) {
      // Simple carousel without infinite scroll
      const maxSlide = Math.max(0, this.products.length - this.itemsPerSlide);
      if (this.currentSlide < maxSlide) {
        this.currentSlide++;
      } else {
        this.currentSlide = 0; // Loop back to start
      }
    } else {
      // Infinite scroll carousel
      this.currentSlide++;

      // Reset to beginning when we've shown all original products
      if (this.currentSlide >= this.products.length) {
        // Use setTimeout to reset position after transition completes
        setTimeout(() => {
          this.currentSlide = 0;
        }, 500); // Match transition duration
      }
    }
  }

  prevSlide(): void {
    if (this.products.length <= this.itemsPerSlide) {
      // Simple carousel without infinite scroll
      const maxSlide = Math.max(0, this.products.length - this.itemsPerSlide);
      if (this.currentSlide > 0) {
        this.currentSlide--;
      } else {
        this.currentSlide = maxSlide; // Loop to end
      }
    } else {
      // Infinite scroll carousel
      if (this.currentSlide === 0) {
        // Jump to the end of the first set
        this.currentSlide = this.products.length - 1;
      } else {
        this.currentSlide--;
      }
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    // Restart auto slide when user manually changes slide
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.startAutoSlide();
    }
  }

  getSlideIndicators(): number[] {
    return Array.from({ length: this.getTotalSlides() }, (_, i) => i);
  }

  getTransformValue(): string {
    // Calculate transform based on item width percentage
    const itemWidth = 100 / this.itemsPerSlide; // Each item takes this % of container
    return `translateX(-${this.currentSlide * itemWidth}%)`;
  }

  getCurrentIndicator(): number {
    return this.currentSlide % this.getTotalSlides();
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  scrollToPricing(): void {
    const pricingSection = document.getElementById('ctaCard');
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  scrollToProducts(): void {
    // Load products when user wants to see them
    this.loadProducts();

    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  openDemoVideo(): void {
    this.showDemoModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeDemoVideo(): void {
    this.showDemoModal = false;
    // Re-enable body scroll
    document.body.style.overflow = 'auto';

    // Pause video if it's playing
    if (this.demoVideo?.nativeElement) {
      this.demoVideo.nativeElement.pause();
      this.demoVideo.nativeElement.currentTime = 0;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDemoModal) {
      this.closeDemoVideo();
    }
  }

  /**
   * Handle image load error - use a simple placeholder
   */
  onImageError(event: Event): void {
    this.imageErrorHandler.handleImageError(event, 'Produit');
  }
}