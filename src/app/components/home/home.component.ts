import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, LazyLoadImageDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // All available products
  allProducts: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  // Dynamic selection of featured products
  products: Product[] = [];
  displayProducts: Product[] = []; // Products with duplicates for infinite scroll
  
  // Carousel properties
  currentSlide = 0;
  autoSlideInterval: any;
  itemsPerSlide = 5; // Number of items to show per slide on desktop

  // Interactive image properties
  imageTransform = 'translate(0, 0) scale(1)';
  private imageOffsetX = 0;
  private imageOffsetY = 0;
  private isChasing = false;
  private chaseInterval: any;
  private velocityX = 0;
  private velocityY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(
    private cartService: CartService, 
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    if (this.chaseInterval) {
      clearInterval(this.chaseInterval);
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
        this.allProducts = products;
        this.products = this.getFeaturedProducts();
        this.createDisplayProducts();
        this.isLoading = false;
        this.startAutoSlide();
      },
      error: (error) => {
        console.error('Error loading products:', error);
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

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  /**
   * Navigate to product in espace-proprietaire shop
   */
  viewProductInShop(product: Product): void {
    // Navigate to espace-proprietaire page with product ID as query parameter
    this.router.navigate(['/espace-proprietaire'], { 
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

  navigateToVetSpace(): void {
    this.router.navigate(['/formulaireUser']);
  }

  /**
   * Handle image load error - use a simple placeholder
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Remove error handler FIRST to prevent infinite loop
    img.onerror = null;
    // Use a simple SVG placeholder instead of trying to load a missing image
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E';
  }

  /**
   * Interactive image effect - image keeps running away from cursor
   */
  onImageMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Get cursor position relative to image center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Store mouse position for velocity calculation
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
    
    if (!this.isChasing) {
      this.isChasing = true;
      this.startChasingEffect();
    }
    
    // Calculate distance from center
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Dynamic escape based on proximity - closer = faster escape
    if (distance < 200) {
      const urgency = 1 - (distance / 200); // 0 to 1, higher when closer
      const escapeForce = 60 + urgency * 80; // Stronger escape when closer
      
      // Calculate escape direction (away from cursor)
      const angle = Math.atan2(deltaY, deltaX);
      
      // Add randomness that increases with urgency
      const randomness = (Math.random() - 0.5) * (1 + urgency);
      const escapeAngle = angle + randomness;
      
      // Apply velocity for smoother movement (reduced force)
     
      
    
    }
  }

  /**
   * Start continuous chasing effect - image keeps moving with physics
   */
  private startChasingEffect(): void {
    if (this.chaseInterval) {
      clearInterval(this.chaseInterval);
    }
    
    let lastTime = Date.now();
    
    this.chaseInterval = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
      lastTime = currentTime;
      
      // Apply velocity to position
      this.imageOffsetX += this.velocityX * deltaTime;
      this.imageOffsetY += this.velocityY * deltaTime;
      
      // Add subtle random jitter for liveliness (reduced frequency)
     
      
      // Bounce off boundaries with elastic effect
      const maxMove = 120;
      if (Math.abs(this.imageOffsetX) > maxMove) {
        this.imageOffsetX = Math.sign(this.imageOffsetX) * maxMove;
        this.velocityX *= -0.6; // Bounce back with damping
      }
      if (Math.abs(this.imageOffsetY) > maxMove) {
        this.imageOffsetY = Math.sign(this.imageOffsetY) * maxMove;
        this.velocityY *= -0.6; // Bounce back with damping
      }
      
      // Apply friction to slow down gradually (increased friction)
      this.velocityX *= 0.95;
      this.velocityY *= 0.95;
      
      // Calculate dynamic rotation based on velocity (reduced rotation)
      const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      const rotation = Math.sin(currentTime / 500) * (1.5 + speed * 0.2);
      
      // Calculate scale based on speed (reduced scale change)
      const scale = 1.02 + Math.min(speed * 0.005, 0.05);
      
      // Apply transform with dynamic effects
      this.imageTransform = `translate(${this.imageOffsetX}px, ${this.imageOffsetY}px) rotate(${rotation}deg) scale(${scale})`;
    }, 30); // Reduced frequency: 30ms instead of 16ms (~33fps instead of 60fps)
  }

  /**
   * Reset image position when mouse leaves
   */
  onImageMouseLeave(): void {
    this.isChasing = false;
    
    if (this.chaseInterval) {
      clearInterval(this.chaseInterval);
      this.chaseInterval = null;
    }
    
    // Smoothly return to center with easing
    let frame = 0;
    const maxFrames = 60; // 1 second at 60fps
    
    const resetInterval = setInterval(() => {
      frame++;
      const progress = frame / maxFrames;
      const easing = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      this.imageOffsetX *= (1 - easing * 0.15);
      this.imageOffsetY *= (1 - easing * 0.15);
      this.velocityX *= 0.8;
      this.velocityY *= 0.8;
      
      const rotation = Math.sin(Date.now() / 500) * (5 * (1 - progress));
      this.imageTransform = `translate(${this.imageOffsetX}px, ${this.imageOffsetY}px) rotate(${rotation}deg) scale(${1 + (1 - progress) * 0.05})`;
      
      // Stop when close enough to center or time is up
      if ((Math.abs(this.imageOffsetX) < 0.5 && Math.abs(this.imageOffsetY) < 0.5) || frame >= maxFrames) {
        clearInterval(resetInterval);
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.imageTransform = 'translate(0, 0) rotate(0deg) scale(1)';
      }
    }, 16);
  }

  /**
   * Scroll to footer section
   */
  scrollToFooter(): void {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }
}