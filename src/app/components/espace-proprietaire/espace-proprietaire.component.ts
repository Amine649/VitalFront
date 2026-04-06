import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ErrorSanitizerService } from '../../services/error-sanitizer.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { SafePipe } from '../../pipes/safe.pipe';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  type: string;
  pet?: 'CAT' | 'DOG';
  pdfFilename: string;
  pdfRelativePath: string;
  fileSize: number;
  createdAt: string;
}

@Component({
  selector: 'app-espace-proprietaire',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, SafePipe],
  templateUrl: './espace-proprietaire.component.html',
  styleUrls: ['./espace-proprietaire.component.scss']
})
export class EspaceProprietaireComponent implements OnInit {
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

  products: Product[] = [];

  selectedCategory: string | null = null;
  selectedSousCategory: 'Aliment' | 'Complément' | 'Test rapide' | null = null;
  selectedSubSubCategory: string | null = null;

  currentPage = 1;
  itemsPerPage = 15;
  Math = Math; // Make Math available in template
  highlightedProductId: number | null = null;
  highlightedSection: string | null = null;

  // Blog pagination for INFORMATIONS & CONSEILS VÉTOS (right column with filtre)
  conseilCurrentPage = 1;
  conseilItemsPerPage = 7;
  
  // Blog pagination for INFORMATIONS & CONSEILS VÉTOS (bottom section)
  infosCurrentPage = 1;
  infosItemsPerPage = 3;
  
  blogPosts: BlogPost[] = [];
  isLoadingBlogs = false;
  blogError = '';
  
  // PDF Modal
  showPdfModal = false;
  currentPdfUrl = '';
  currentPdfTitle = '';
  currentPdfPet: 'CAT' | 'DOG' | null = null;
  isPdfLoading = false;
  pdfBlobUrl: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private productService: ProductService,
    private http: HttpClient,
    private errorSanitizer: ErrorSanitizerService,
    private imageErrorHandler: ImageErrorHandlerService
  ) {
    // Set initial items per page based on screen size
    this.updateItemsPerPage();
  }

  ngOnInit() {
    // Load products from API
    this.loadProducts();

    // Listen to query parameters from the navigation menu
    this.route.queryParams.subscribe(params => {
      if (params['animal']) {
        this.selectedCategory = this.capitalizeFirst(params['animal']);
        
        // If animal is selected but no type is specified, default to 'Aliment'
        if (!params['type']) {
          this.selectedSousCategory = 'Aliment';
          // Update URL with default type (this will trigger subscription again)
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { animal: params['animal'], type: 'aliment' },
            queryParamsHandling: 'merge'
          });
          // Don't load blogs here - wait for the URL update to trigger subscription
        } else {
          this.selectedSousCategory = this.mapProductType(params['type']);
          // Only load blogs when type parameter exists (after URL is properly set)
          this.loadBlogPosts(params['animal']);
        }
      } else {
        this.selectedCategory = null;
        this.selectedSousCategory = null;
        
        // Load all proprietaire blogs when no animal is selected
        this.loadBlogPosts();
      }

      // Check for highlighted product
      if (params['highlight']) {
        this.highlightedProductId = +params['highlight'];
        // Scroll to top first
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Remove highlight after animation completes
        setTimeout(() => {
          this.highlightedProductId = null;
        }, 3000);
      }

      // Check for highlighted section
      if (params['highlightSection']) {
        this.highlightedSection = params['highlightSection'];
        // Scroll to top first
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Use requestAnimationFrame to ensure DOM is updated, then wait for render
        requestAnimationFrame(() => {
          setTimeout(() => {
            const element = document.getElementById(params['highlightSection']);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        });
        // Remove highlight after 5 seconds
        setTimeout(() => {
          this.highlightedSection = null;
        }, 3500);
      }

      // Reset to first page when filters change
      this.currentPage = 1;
    });

    // Setup navbar scroll behavior to stop at footer
    this.setupNavbarScrollBehavior();
  }

  /**
   * Setup navbar to stop scrolling when footer appears
   */
  private setupNavbarScrollBehavior(): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      this.handleNavbarScroll();
    }, 100);
  }

  /**
   * Handle scroll event to stop navbar at footer
   */
 @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.handleNavbarScroll();
  }

  /**
   * Handle window resize to update items per page
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    this.updateItemsPerPage();
  }

  /**
   * Update items per page based on screen size
   */
  private updateItemsPerPage(): void {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      const newItemsPerPage = isMobile ? 10 : 21;
      
      // Only reset to page 1 if itemsPerPage actually changed
      if (this.itemsPerPage !== newItemsPerPage) {
        this.itemsPerPage = newItemsPerPage;
        this.currentPage = 1; // Reset to first page when changing items per page
      }
    }
  }

  ngOnDestroy(): void {
    // Reset the header transform when leaving this page
    const header = document.querySelector('header');
    if (header) {
      header.style.transform = 'translateY(0)';
      header.style.transition = 'none';
    }
  }

  /**
   * Calculate and apply navbar position based on footer visibility
   */
  private handleNavbarScroll(): void {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (!header || !footer) return;

    const footerRect = footer.getBoundingClientRect();
    const headerHeight = header.offsetHeight;
    const windowHeight = window.innerHeight;

    // Check if footer is entering the viewport
    if (footerRect.top <= windowHeight) {
      // Footer is visible, calculate how much to push navbar up
      const overlap = windowHeight - footerRect.top;
      const maxPush = footerRect.height;
      const pushAmount = Math.min(overlap, maxPush);

      // Apply transform to push navbar up
      if (pushAmount > 0) {
        header.style.transform = `translateY(-${pushAmount}px)`;
        header.style.transition = 'transform 0.1s ease-out';
      }
    } else {
      // Footer not visible, reset navbar position
      header.style.transform = 'translateY(0)';
    }
  }

  /**
   * Load products from API
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.errorSanitizer.sanitizeError(error);
        this.isLoading = false;
      }
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapProductType(type: string): 'Aliment' | 'Complément' | 'Test rapide' | null {
    const typeMap: { [key: string]: 'Aliment' | 'Complément' | 'Test rapide' } = {
      'aliment': 'Aliment',
      'complement': 'Complément',
      'test-rapide': 'Test rapide'
    };
    return typeMap[type] || null;
  }



  navigateTo(route: string) {

    if (route === 'ou-trouver-nos-produits') {
      this.router.navigate(['/ou-trouver-nos-produits']);
    } else {
      this.router.navigate(['/espace-proprietaire', route]);
    }
  }

  selectCategory(cat: string) {
    // If clicking the same category, keep it selected (don't toggle off)
    // If clicking a different category, switch to it
    if (this.selectedCategory !== cat) {
      this.selectedCategory = cat;
      this.selectedSousCategory = null;
      this.selectedSubSubCategory = null;
      this.conseilCurrentPage = 1;
      this.infosCurrentPage = 1;
      this.loadBlogPosts(cat);
    }
  }

  selectSousCategory(sub: string) {
    const validSub = sub as 'Aliment' | 'Complément' | 'Test rapide';
    this.selectedSousCategory = this.selectedSousCategory === validSub ? null : validSub;
    this.selectedSubSubCategory = null;
  }

  selectSubSubCategory(subSub: string) {
    this.selectedSubSubCategory = this.selectedSubSubCategory === subSub ? null : subSub;
  }

  shouldShowSubSubCategoryFilter(): boolean {
    return this.selectedCategory !== null && this.selectedSousCategory === 'Aliment';
  }

  getFilteredProducts(): Product[] {
    return this.productService.filterProducts(
      this.products,
      this.selectedCategory,
      this.selectedSousCategory,
      this.selectedSubSubCategory
    );
  }

  getPaginatedProducts(): Product[] {
    const filtered = this.getFilteredProducts();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const filtered = this.getFilteredProducts();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      // Scroll to top of products
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    // Optional: Show a toast notification here
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByCategoryName(index: number, category: any): string {
    return category.name;
  }

  trackBySubCategoryName(index: number, subCategory: any): string {
    return subCategory.name;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateToVetSpace(): void {
    this.router.navigate(['/']);
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    this.imageErrorHandler.handleImageError(event);
  }

  /**
   * Scroll to a specific section on the page
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /**
   * Scroll to products section
   */
  scrollToProducts(): void {
    // If a category is selected, scroll to filtered products section
    // Otherwise scroll to all products section
    const sectionId = this.selectedCategory ? 'filtered-products-section' : 'products-section';
    this.scrollToSection(sectionId);
  }

  /**
   * Load blog posts from API
   */
  loadBlogPosts(animal?: string): void {
    this.isLoadingBlogs = true;
    this.blogError = '';
    this.conseilCurrentPage = 1;
    this.infosCurrentPage = 1;

    // Determine the API endpoint based on animal selection
    let endpoint: string;
    if (animal) {
      // Convert 'chat' to 'CAT' and 'chien' to 'DOG'
      const pet = animal.toLowerCase() === 'chat' ? 'CAT' : 'DOG';
      endpoint = `${environment.apiUrl}/blogs/pet/${pet}`;
    } else {
      // Load all proprietaire blogs when no animal is selected
      endpoint = `${environment.apiUrl}/blogs/type/PROPRIETAIRE`;
    }

    this.http.get<BlogPost[]>(endpoint, {
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

      // Extract year, month, and filename from pdfRelativePath
      const pathParts = post.pdfRelativePath.replace('/uploads/pdfs', '').split('/').filter(p => p);

      if (pathParts.length >= 3) {
        const year = pathParts[0];
        const month = pathParts[1];
        const filename = pathParts[2];

        const pdfUrl = `${environment.apiUrl}/blogs/pdf/${year}/${month}/${filename}`;

        // Navigate to conseil-articles with blog data
        this.router.navigate(['/conseil-articles', 'blog-pdf'], {
          state: {
            blogPost: {
              title: post.title,
              category: 'Informations & Conseils Vétos',
              animal: post.pet === 'CAT' ? 'chat' : 'chien',
              pdfUrl: pdfUrl,
              pet: post.pet
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
    this.currentPdfPet = null;
    
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
   * Get paginated blog posts for Conseil Technique (right column)
   */
  getPaginatedConseilPosts(): BlogPost[] {
    const startIndex = (this.conseilCurrentPage - 1) * this.conseilItemsPerPage;
    const endIndex = startIndex + this.conseilItemsPerPage;
    return this.blogPosts.slice(startIndex, endIndex);
  }

  /**
   * Get total pages for Conseil Technique
   */
  getConseilTotalPages(): number {
    return Math.ceil(this.blogPosts.length / this.conseilItemsPerPage);
  }

  /**
   * Navigate to next page in Conseil Technique
   */
  nextConseilPage(): void {
    if (this.conseilCurrentPage < this.getConseilTotalPages()) {
      this.conseilCurrentPage++;
    }
  }

  /**
   * Navigate to previous page in Conseil Technique
   */
  previousConseilPage(): void {
    if (this.conseilCurrentPage > 1) {
      this.conseilCurrentPage--;
    }
  }

  /**
   * Get paginated blog posts for INFORMATIONS & CONSEILS VÉTOS (bottom section)
   */
  getPaginatedInfosPosts(): BlogPost[] {
    const startIndex = (this.infosCurrentPage - 1) * this.infosItemsPerPage;
    const endIndex = startIndex + this.infosItemsPerPage;
    return this.blogPosts.slice(startIndex, endIndex);
  }

  /**
   * Get total pages for INFORMATIONS & CONSEILS VÉTOS
   */
  getInfosTotalPages(): number {
    return Math.ceil(this.blogPosts.length / this.infosItemsPerPage);
  }

  /**
   * Navigate to next page in INFORMATIONS & CONSEILS VÉTOS
   */
  nextInfosPage(): void {
    if (this.infosCurrentPage < this.getInfosTotalPages()) {
      this.infosCurrentPage++;
    }
  }

  /**
   * Navigate to previous page in INFORMATIONS & CONSEILS VÉTOS
   */
  previousInfosPage(): void {
    if (this.infosCurrentPage > 1) {
      this.infosCurrentPage--;
    }
  }
}
