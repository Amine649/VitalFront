import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number; // Cart item ID (used for removal)
  itemId?: number; // Alternative field name for cart item ID
  productId?: number; // Product ID
  name: string;
  productName?: string; // Backend uses this field
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string;
  subCategory?: string;
  variants?: ProductVariant[]; // Available variants for this product
  selectedVariantId?: number; // Currently selected variant ID
}

export interface ProductVariant {
  id: number;
  packaging: string;
  price: number;
}

export interface CartResponse {
  cartId?: number;
  userId?: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {
    // Load cart from backend on service initialization
    this.loadCartFromBackend();
  }

  /**
   * Get current user ID from localStorage
   */
  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Load cart from backend
   */
  loadCartFromBackend(): void {
    const userId = this.getUserId();
    if (!userId) {
      // User not logged in, use empty cart
      this.updateLocalCart([]);
      return;
    }



    this.http.get<CartResponse>(
      `${environment.apiUrl}/cart?userId=${userId}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        // Fallback to localStorage if backend fails
        this.loadCartFromStorage();
        return of({ items: [], totalItems: 0, totalPrice: 0 });
      })
    ).subscribe(response => {


      // Normalize items - map backend fields to frontend fields
      const normalizedItems = (response.items || []).map(item => ({
        id: item.itemId || item.id || 0,
        itemId: item.itemId,
        productId: item.productId,
        name: item.productName || item.name || 'Produit',
        productName: item.productName,
        price: item.price || 0,
        quantity: item.quantity || 0,
        imageUrl: item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
        category: item.category || '',
        subCategory: item.subCategory || ''
      }));

      // Apply stored variant selections to override backend prices
      this.applyVariantSelections(normalizedItems);

      this.updateLocalCart(normalizedItems);
    });
  }

  /**
   * Add product to cart
   */
  addToCart(product: any): void {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    const requestBody: any = {
      productId: product.id,
      quantity: 1
    };

    // Include variant ID if a specific variant is selected
    if (product.selectedVariantId) {
      requestBody.variantId = product.selectedVariantId;
      // Store the selected variant info in localStorage for this product
      this.storeVariantSelection(product.id, product.selectedVariantId, product.price);
    }



    this.http.post<any>(
      `${environment.apiUrl}/cart/items?userId=${userId}`,
      requestBody,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
    
        // If it's a 200 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          this.loadCartFromBackend();
          this.toastService.success('Produit ajouté au panier');
        } else {
          this.toastService.error('Erreur lors de l\'ajout au panier');
          // Fallback to localStorage
          this.addToCartLocally(product);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        return;
      }

      const response = httpResponse.body;



      // Handle 204 No Content
      if (httpResponse.status === 204) {
        this.loadCartFromBackend();
        this.toastService.success('Produit ajouté au panier');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));

        // Apply stored variant selections to override backend prices
        this.applyVariantSelections(normalizedItems);


        this.updateLocalCart(normalizedItems);
        this.toastService.success('Produit ajouté au panier');
      } else {
        // Response doesn't have items, reload from backend
        this.loadCartFromBackend();
        this.toastService.success('Produit ajouté au panier');
      }
    });
  }

  /**
   * Add product to commercial cart
   */
  addToCommercialCart(product: any, vetMatricule: string): void {
    const requestBody: any = {
      productId: product.id,
      quantity: 1
    };

    // Include variant ID if a specific variant is selected
    if (product.selectedVariantId) {
      requestBody.variantId = product.selectedVariantId;
    }

    this.http.post<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}/items`,
      requestBody,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {

        // If it's a 200 or 204 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          this.loadCommercialCart(vetMatricule);
          this.toastService.success('Produit ajouté au panier');
        } else {
          this.toastService.error('Erreur lors de l\'ajout au panier');
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) return;

      if (httpResponse.status === 200 || httpResponse.status === 204) {
        this.loadCommercialCart(vetMatricule);
        this.toastService.success('Produit ajouté au panier');
      }
    });
  }

  /**
   * Load commercial cart from backend
   */
  loadCommercialCart(vetMatricule: string): void {
    this.http.get<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        // Fallback to localStorage if backend fails
        this.loadCartFromStorage();
        return of({ items: [], totalAmount: 0 });
      })
    ).subscribe(response => {

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));

        this.updateLocalCart(normalizedItems);
      } else {
        this.updateLocalCart([]);
      }
    });
  }

  /**
   * Update item quantity for commercial cart
   */
  updateCommercialItemQuantity(vetMatricule: string, itemId: number, productId: number, quantity: number, variantId?: number): void {
    if (quantity <= 0) {
      this.removeCommercialCartItem(vetMatricule, itemId);
      return;
    }

    const requestBody: any = {
      productId: productId,
      quantity: quantity
    };

    // Include variantId if provided (null is valid to keep current variant)
    if (variantId !== undefined) {
      requestBody.variantId = variantId;
    } else {
      requestBody.variantId = null;
    }


    this.http.patch<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}/items/${itemId}`,
      requestBody,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {

        if (error.status === 200 || error.status === 204) {
          this.loadCommercialCart(vetMatricule);
          this.toastService.success('Quantité mise à jour');
        } else {
          this.toastService.error('Erreur lors de la mise à jour');
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) return;

      if (httpResponse.status === 200 || httpResponse.status === 204) {
        this.loadCommercialCart(vetMatricule);
        this.toastService.success('Quantité mise à jour');
      }
    });
  }

  /**
   * Remove item from commercial cart
   */
  removeCommercialCartItem(vetMatricule: string, itemId: number): void {
    this.http.delete<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}/items/${itemId}`,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {

        if (error.status === 200 || error.status === 204) {
          this.loadCommercialCart(vetMatricule);
          this.toastService.success('Produit retiré du panier');
        } else {
          this.toastService.error('Erreur lors de la suppression');
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) return;

      if (httpResponse.status === 200 || httpResponse.status === 204) {
        this.loadCommercialCart(vetMatricule);
        this.toastService.success('Produit retiré du panier');
      }
    });
  }

  /**
   * Clear commercial cart
   */
  clearCommercialCart(vetMatricule: string): void {
    this.http.delete<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}`,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {

        if (error.status === 200 || error.status === 204) {
          this.loadCommercialCart(vetMatricule);
          this.toastService.success('Panier vidé');
        } else {
          this.toastService.error('Erreur lors du vidage du panier');
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) return;

      if (httpResponse.status === 200 || httpResponse.status === 204) {
        this.loadCommercialCart(vetMatricule);
        this.toastService.success('Panier vidé');
      }
    });
  }

  /**
   * Confirm commercial order
   */
  confirmCommercialOrder(vetMatricule: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/commercial/orders/cart/${vetMatricule}/confirm`,
      {},
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      map(response => {
        // Clear local cart on success
        if (response.status === 200 || response.status === 201) {
          this.loadCommercialCart(vetMatricule);
          // Return the full response body with order details
          return { 
            success: true, 
            data: response.body 
          };
        }
        return { success: false, error: 'Une erreur inconnue est survenue' };
      }),
      catchError(error => {
        return of({ success: false, error: error.message || 'Erreur lors de la confirmation' });
      })
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(itemId: number, quantity: number, variantId?: number): void {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const requestBody: any = {
      quantity: quantity
    };

    // Include variantId if provided (null is valid to keep current variant)
    if (variantId !== undefined) {
      requestBody.variantId = variantId;
    } else {
      requestBody.variantId = null;
    }

    this.http.put<any>(
      `${environment.apiUrl}/cart/items/${itemId}?userId=${userId}`,
      requestBody,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
     
        // If it's a 200/204 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          this.loadCartFromBackend();
          this.toastService.success('Quantité mise à jour');
        } else {
          this.toastService.error('Erreur lors de la mise à jour');
          // Fallback to localStorage
          this.updateQuantityLocally(itemId, quantity);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        return;
      }

      const response = httpResponse.body;


      // Handle 204 No Content
      if (httpResponse.status === 204) {
        this.loadCartFromBackend();
        this.toastService.success('Quantité mise à jour');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));


        this.updateLocalCart(normalizedItems);
        this.toastService.success('Quantité mise à jour');
      } else {
        // No items in response - reload cart
        this.loadCartFromBackend();
        this.toastService.success('Quantité mise à jour');
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId: number): void {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }



    this.http.delete<any>(
      `${environment.apiUrl}/cart/items/${itemId}?userId=${userId}`,
      {
        withCredentials: true,
        observe: 'response'
      }
    ).pipe(
      catchError(error => {
     
        // If it's a 200/204 but parsing failed, it's actually success
        if (error.status === 200 || error.status === 204) {
          this.loadCartFromBackend();
          this.toastService.success('Produit retiré du panier');
        } else {
          this.toastService.error('Erreur lors de la suppression');
          // Fallback to localStorage
          this.removeFromCartLocally(itemId);
        }
        return of(null);
      })
    ).subscribe(httpResponse => {
      if (!httpResponse) {
        return;
      }

      const response = httpResponse.body;


      // Handle 204 No Content
      if (httpResponse.status === 204) {
        this.loadCartFromBackend();
        this.toastService.success('Produit retiré du panier');
        return;
      }

      if (response && response.items && Array.isArray(response.items)) {
        // Normalize items - map backend fields to frontend fields
        const normalizedItems = response.items.map((item: any) => ({
          id: item.itemId || item.id || 0,
          itemId: item.itemId,
          productId: item.productId,
          name: item.productName || item.name || 'Produit',
          productName: item.productName,
          price: item.price || 0,
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
          category: item.category || '',
          subCategory: item.subCategory || ''
        }));


        this.updateLocalCart(normalizedItems);
        this.toastService.success('Produit retiré du panier');
      } else {
        // No items in response or empty response - reload cart
        this.loadCartFromBackend();
        this.toastService.success('Produit retiré du panier');
      }
    });
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    this.http.delete<CartResponse>(
      `${environment.apiUrl}/cart?userId=${userId}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        // Fallback to localStorage
        this.updateLocalCart([]);
        return of(null);
      })
    ).subscribe(response => {
      this.updateLocalCart([]);
    });
  }

  /**
   * Checkout - Convert cart to order
   */
  checkout(email: string): Observable<any> {
    const userId = this.getUserId();
    if (!userId) {
      return of({ error: 'User not logged in' });
    }

    const requestBody = {
      deliveryAddress: email || '' // Use email as delivery address or empty string
    };

    return this.http.post(
      `${environment.apiUrl}/cart/orders/checkout?userId=${userId}`,
      requestBody,
      {
        withCredentials: true,
        responseType: 'text' as 'json' // Backend returns text, not JSON
      }
    ).pipe(
      tap(() => {
        // Clear cart after successful checkout
        this.updateLocalCart([]);
      }),
      map((response: any) => {
        // If response is text, wrap it in an object
        if (typeof response === 'string') {
          return { success: true, message: response };
        }
        return response;
      }),
      catchError(error => {
        return of({ error: error.message || 'Checkout failed' });
      })
    );
  }

  /**
   * Get cart total
   */
  getCartTotal(): number {
    const currentItems = this.cartItems.getValue();
    return currentItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // ========== LOCAL FALLBACK METHODS (for offline support) ==========

  private updateLocalCart(items: CartItem[]): void {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    // Force new array reference to trigger change detection
    this.cartItems.next([...items]);
    this.cartCount.next(count);
    this.saveCartToStorage(items);
  }

  private addToCartLocally(product: any): void {
    const currentItems = this.cartItems.getValue();
    const existingItem = currentItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl || product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EProduit%3C/text%3E%3C/svg%3E',
        category: product.category,
        subCategory: product.subCategory
      };
      currentItems.push(newItem);
    }

    this.updateLocalCart(currentItems);
  }

  private updateQuantityLocally(productId: number, quantity: number): void {
    const currentItems = this.cartItems.getValue();
    const item = currentItems.find(item => item.id === productId);

    if (item) {
      if (quantity > 0) {
        item.quantity = quantity;
      } else {
        this.removeFromCartLocally(productId);
        return;
      }
    }

    this.updateLocalCart(currentItems);
  }

  private removeFromCartLocally(productId: number): void {
    const currentItems = this.cartItems.getValue();
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.updateLocalCart(updatedItems);
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        this.updateLocalCart(items);
      } catch (error) {
        this.updateLocalCart([]);
      }
    }
  }

  /**
   * Store variant selection for a product in localStorage
   */
  private storeVariantSelection(productId: number, variantId: number, price: number): void {
    const key = 'variantSelections';
    const stored = localStorage.getItem(key);
    const selections = stored ? JSON.parse(stored) : {};
    selections[productId] = { variantId, price };
    localStorage.setItem(key, JSON.stringify(selections));
  }

  /**
   * Apply stored variant selections to cart items
   */
  private applyVariantSelections(items: CartItem[]): void {
    const key = 'variantSelections';
    const stored = localStorage.getItem(key);
    if (!stored) return;

    try {
      const selections = JSON.parse(stored);
      items.forEach(item => {
        const productId = item.productId || item.id;
        if (selections[productId]) {
          const selection = selections[productId];
          item.price = selection.price;
          item.selectedVariantId = selection.variantId;
        }
      });
    } catch (error) {
    }
  }
}