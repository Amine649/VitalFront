import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  /**
   * Get request options with credentials
   * Cookie is automatically sent by browser when withCredentials is true
   */
  private getRequestOptions() {
    return {
      withCredentials: true,  // Automatically includes HttpOnly cookies
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Get all products from backend
   * No authentication required for viewing products
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/all`).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(products => this.normalizeProducts(products)),
      catchError(this.handleError)
    );
  }

  /**
   * Update a product
   */
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update/${id}/full`, product, this.getRequestOptions()).pipe(
      catchError(this.handleUpdateError)
    );
  }

  /**
   * Delete a product
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, this.getRequestOptions()).pipe(
      catchError(this.handleDeleteError)
    );
  }

  /**
   * Add a new product
   */
  addProduct(product: Partial<Omit<Product, 'id'>>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/add`, product, this.getRequestOptions()).pipe(
      catchError(this.handleAddError)
    );
  }

  /**
   * Handle update errors
   */
  private handleUpdateError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la mise à jour du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Update Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle delete errors
   */
  private handleDeleteError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la suppression du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Delete Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle add errors
   */
  private handleAddError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'ajout du produit.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }

    console.error('ProductService Add Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Normalize product data from backend
   * Converts category/subCategory to display format
   */
  private normalizeProducts(products: Product[]): Product[] {
    return products.map(product => ({
      ...product,
      // Keep original values for filtering
      category: product.category,
      subCategory: product.subCategory
    }));
  }

  /**
   * Get the first variant (by minimum ID) from a product
   */
  getFirstVariant(product: Product): any {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }
    // Sort variants by ID and return the first one (minimum ID)
    return [...product.variants].sort((a, b) => a.id - b.id)[0];
  }

  /**
   * Get price from the first variant (minimum ID)
   */
  getVariantPrice(product: Product): number {
    const firstVariant = this.getFirstVariant(product);
    return firstVariant ? firstVariant.price : (product.price || 0);
  }

  /**
   * Get packaging from the first variant (minimum ID)
   */
  getVariantPackaging(product: Product): string {
    const firstVariant = this.getFirstVariant(product);
    return firstVariant ? firstVariant.packaging : '';
  }

  /**
   * Get display label for category
   */
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'CHAT': 'Chat',
      'CHIEN': 'Chien'
    };
    return labels[category] || category;
  }

  /**
   * Get display label for sub-category
   */
  getSubCategoryLabel(subCategory: string): string {
    const labels: { [key: string]: string } = {
      'ALIMENT': 'Aliment',
      'COMPLEMENT': 'Complément',
      'TEST_RAPIDE': 'Test rapide'
    };
    return labels[subCategory] || subCategory;
  }

  /**
   * Get emoji for category
   */
  getCategoryEmoji(category: string): string {
    return category === 'CHIEN' ? '🐶' : '🐱';
  }

  /**
   * Get emoji for sub-category
   */
  getSubCategoryEmoji(subCategory: string): string {
    const emojis: { [key: string]: string } = {
      'ALIMENT': '🍖',
      'COMPLEMENT': '💊',
      'TEST_RAPIDE': '🧪'
    };
    return emojis[subCategory] || '📦';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    // User-friendly error message without exposing API details
    const errorMessage = 'Impossible de charger les produits pour le moment. Veuillez réessayer plus tard.';

    // Log detailed error for debugging (only visible in console)
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error('ProductService Error:', error.error.message);
    } else {
      // Server-side error
      console.error('ProductService Error:', `Status ${error.status}: ${error.message}`);
    }

    return throwError(() => new Error(errorMessage));
  }
}
