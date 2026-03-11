import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem, ProductVariant } from '../../services/cart.service';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss']
})
export class PanierComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal = 0;
  showSuccessModal = false;
  showEmailConfirmModal = false;
  isCheckingOut = false;
  loadingVariants = false;
  private itemOrder: number[] = []; // Store the order of items by their IDs
  
  // Email confirmation
  userEmail: string = '';
  newEmail: string = '';
  emailError: string = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    // Load user email
    this.loadUserEmail();
    
    // Reload cart from backend when page loads
    this.cartService.loadCartFromBackend();

    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      console.log('Cart items updated from backend:', items);
      
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
      
      // Load variants for each cart item (this will restore saved selections)
      if (items.length > 0) {
        // Use setTimeout to ensure the cart items are fully loaded
        setTimeout(() => {
          this.loadVariantsForCartItems();
        }, 100);
      } else {
        this.cartTotal = 0;
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
      console.log('Already loading variants, skipping...');
      return;
    }
    
    this.loadingVariants = true;
    
    // Load saved variant selections from localStorage
    const savedVariants = this.getSavedVariantSelections();
    console.log('=== Loading Variants ===');
    console.log('Saved variants from localStorage:', savedVariants);
    console.log('Current cart items:', this.cartItems.map(i => ({ id: i.id, productId: i.productId, price: i.price })));
    
    // Create requests for all products
    const variantRequests = this.cartItems
      .filter(item => item.productId) // Only for items with productId
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
        console.log('Received variants from API:', variantsArray);
        
        // Attach variants to each cart item
        let variantIndex = 0;
        this.cartItems.forEach(item => {
          if (item.productId) {
            item.variants = variantsArray[variantIndex];
            
            // Try multiple keys to find saved variant
            const keys = [
              `cart_${item.productId}_${item.id}`,
              `product_${item.productId}`,
              `cart_${item.id}`
            ];
            
            let savedVariantId: number | undefined;
            let usedKey: string | undefined;
            
            for (const key of keys) {
              if (savedVariants[key]) {
                savedVariantId = savedVariants[key];
                usedKey = key;
                break;
              }
            }
            
            console.log(`\nProcessing cart item ${item.id} (product ${item.productId}):`);
            console.log('  Current price from backend:', item.price);
            console.log('  Saved variant ID:', savedVariantId, 'from key:', usedKey);
            console.log('  Available variants:', item.variants);
            
            if (savedVariantId) {
              // Use saved variant selection - THIS IS THE KEY PART
              const savedVariant = item.variants?.find(v => v.id === savedVariantId);
              if (savedVariant) {
                item.selectedVariantId = savedVariantId;
                item.price = savedVariant.price; // OVERRIDE the backend price
                console.log('  ✓ Applied saved variant:', savedVariant);
              } else {
                console.log('  ✗ Saved variant not found, matching by price');
                const currentVariant = item.variants?.find(v => v.price === item.price);
                if (currentVariant) {
                  item.selectedVariantId = currentVariant.id;
                  console.log('  ✓ Matched by price:', currentVariant);
                } else {
                  const sortedVariants = [...item.variants].sort((a, b) => a.id - b.id);
                  if (sortedVariants.length > 0) {
                    item.selectedVariantId = sortedVariants[0].id;
                    item.price = sortedVariants[0].price;
                    console.log('  ✓ Using first variant:', sortedVariants[0]);
                  }
                }
              }
            } else {
              console.log('  No saved variant, matching by backend price');
              const currentVariant = item.variants?.find(v => v.price === item.price);
              if (currentVariant) {
                item.selectedVariantId = currentVariant.id;
                console.log('  ✓ Matched by backend price:', currentVariant);
              } else {
                const sortedVariants = [...item.variants].sort((a, b) => a.id - b.id);
                if (sortedVariants.length > 0) {
                  item.selectedVariantId = sortedVariants[0].id;
                  item.price = sortedVariants[0].price;
                  console.log('  ✓ Using first variant (no match):', sortedVariants[0]);
                }
              }
            }
            
            variantIndex++;
          }
        });
        
        // Force update the cart items array to trigger change detection
        this.cartItems = [...this.cartItems];
        
        this.loadingVariants = false;
        this.recalculateTotal();
        console.log('=== Final Cart State ===');
        console.log('Cart items:', this.cartItems.map(i => ({ 
          id: i.id, 
          productId: i.productId, 
          selectedVariantId: i.selectedVariantId,
          price: i.price,
          quantity: i.quantity
        })));
        console.log('Total:', this.cartTotal);
      },
      error: (err) => {
        console.error('Error loading variants:', err);
        this.loadingVariants = false;
        this.recalculateTotal();
      }
    });
  }

  recalculateTotal(): void {
    this.cartTotal = this.cartItems.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
    console.log('Recalculated total:', this.cartTotal);
  }

  onVariantChange(item: CartItem, variantId: number | string): void {
    // Convert to number if it's a string
    const numericVariantId = typeof variantId === 'string' ? parseInt(variantId, 10) : variantId;
    
    const selectedVariant = item.variants?.find(v => v.id === numericVariantId);
    
    if (selectedVariant) {
      console.log('Variant changed for cart item', item.id, ':', selectedVariant);
      
      // Update the item's price and selected variant
      item.price = selectedVariant.price;
      item.selectedVariantId = numericVariantId;
      
      // Save the variant selection using both keys for redundancy
      this.saveVariantSelection(item.productId!, item.id, numericVariantId);
      
      // Update the cart item on the backend with new variant
      this.cartService.updateQuantity(item.id, item.quantity, numericVariantId);
      
      // Force change detection by creating a new array reference
      this.cartItems = [...this.cartItems];
      
      // Recalculate cart total
      this.recalculateTotal();
      
      console.log('Updated cart item:', item);
    }
  }

  saveVariantSelection(productId: number, cartItemId: number, variantId: number): void {
    const savedVariants = this.getSavedVariantSelections();
    
    // Save with both keys for redundancy
    const cartItemKey = `cart_${productId}_${cartItemId}`;
    const productKey = `product_${productId}`;
    
    savedVariants[cartItemKey] = variantId;
    savedVariants[productKey] = variantId;
    
    localStorage.setItem('cartVariantSelections', JSON.stringify(savedVariants));
    console.log('Saved variant selection:', { cartItemKey, productKey, variantId });
  }

  getSavedVariantSelections(): { [key: string]: number } {
    const saved = localStorage.getItem('cartVariantSelections');
    return saved ? JSON.parse(saved) : {};
  }

  clearSavedVariantSelections(): void {
    localStorage.removeItem('cartVariantSelections');
    console.log('Cleared saved variant selections');
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity > 0) {
      // Find the cart item to get its selected variant
      const item = this.cartItems.find(i => i.id === productId);
      const variantId = item?.selectedVariantId;
      
      // Pass the variant ID to maintain the selected packaging
      this.cartService.updateQuantity(productId, quantity, variantId);
    }
  }

  removeFromCart(productId: number): void {
    // Remove from order tracking
    this.itemOrder = this.itemOrder.filter(id => id !== productId);
    
    this.cartService.removeFromCart(productId);
    // Note: We keep variant selections in localStorage even after removal
    // They will be cleaned up on checkout or cart clear
  }

  continueShopping(): void {
    this.router.navigate(['/produits-veterinaire']);
  }

  loadUserEmail(): void {
    this.http.get<any>(`${environment.apiUrl}/veterinaires/me`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.userEmail = data.email || '';
        this.newEmail = this.userEmail; // Pre-fill with current email
      },
      error: (error) => {
        console.error('Error loading user email:', error);
      }
    });
  }

  proceedToCheckout(): void {
    // Show email confirmation modal instead of direct checkout
    this.showEmailConfirmModal = true;
    this.emailError = '';
    document.body.style.overflow = 'hidden';
  }

  closeEmailConfirmModal(): void {
    this.showEmailConfirmModal = false;
    document.body.style.overflow = 'auto';
    this.newEmail = this.userEmail; // Reset to original email
    this.emailError = '';
  }

  confirmCheckout(): void {
    // Validate email
    if (!this.newEmail || !this.isValidEmail(this.newEmail)) {
      this.emailError = 'Veuillez entrer une adresse email valide';
      return;
    }

    this.isCheckingOut = true;
    this.emailError = '';

    // Use the new email (or original if unchanged) for checkout
    this.cartService.checkout(this.newEmail).subscribe({
      next: (response) => {
        this.isCheckingOut = false;

        if (response.error) {
          this.emailError = 'Erreur lors de la commande: ' + response.error;
        } else {
          // Clear saved variant selections after successful checkout
          this.clearSavedVariantSelections();
          
          // Close email modal and show success modal
          this.closeEmailConfirmModal();
          this.showSuccessModal = true;
          document.body.style.overflow = 'hidden';
        }
      },
      error: (error) => {
        this.isCheckingOut = false;
        console.error('Checkout error:', error);
        this.emailError = 'Erreur lors de la commande. Veuillez réessayer.';
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    document.body.style.overflow = 'auto';
    this.router.navigate(['/espace-veterinaire']);
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.itemOrder = []; // Clear order tracking
      this.cartService.clearCart();
      this.clearSavedVariantSelections();
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
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if we already tried to set a fallback
    if (!img.src.includes('data:image')) {
      // Use a simple SVG placeholder instead of trying to load another image
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
    }
  }
}
