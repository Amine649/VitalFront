import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { ErrorSanitizerService } from './error-sanitizer.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(
    private http: HttpClient,
    private errorSanitizer: ErrorSanitizerService
  ) { }

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
    const errorMessage = this.errorSanitizer.sanitizeOperationError(error, 'update');
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle delete errors
   */
  private handleDeleteError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = this.errorSanitizer.sanitizeOperationError(error, 'delete');
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle add errors
   */
  private handleAddError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = this.errorSanitizer.sanitizeOperationError(error, 'create');
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
    const errorMessage = this.errorSanitizer.sanitizeOperationError(error, 'load');
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Normalize string for comparison (remove accents, spaces, lowercase)
   */
  normalizeString(str: string): string {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_-]/g, '');
  }

  /**
   * Filter products by category, subcategory, and sub-subcategory
   * @param products - Array of products to filter
   * @param selectedCategory - Selected category filter (null = no filter)
   * @param selectedSousCategory - Selected subcategory filter (null = no filter)
   * @param selectedSubSubCategory - Selected sub-subcategory filter (null = no filter)
   * @returns Filtered array of products
   */
  filterProducts(
    products: Product[],
    selectedCategory: string | null,
    selectedSousCategory: string | null,
    selectedSubSubCategory: string | null
  ): Product[] {
    // No filters selected - return all products
    if (!selectedCategory && !selectedSousCategory && !selectedSubSubCategory) {
      return products;
    }

    return products.filter(product => {
      const productCategory = this.normalizeString(product.category);
      const productSubCategory = this.normalizeString(product.subCategory);
      const productSubSubCategory = product.subSubCategory ? this.normalizeString(product.subSubCategory) : null;
      
      const filterCategory = selectedCategory ? this.normalizeString(selectedCategory) : null;
      const filterSubCategory = selectedSousCategory ? this.normalizeString(selectedSousCategory) : null;
      const filterSubSubCategory = selectedSubSubCategory ? this.normalizeString(selectedSubSubCategory) : null;
      
      // Only subcategory filter
      if (!filterCategory && filterSubCategory && !filterSubSubCategory) {
        return productSubCategory === filterSubCategory;
      }
      
      // Only category filter
      if (filterCategory && !filterSubCategory && !filterSubSubCategory) {
        return productCategory === filterCategory;
      }
      
      // Category + subcategory filters
      if (filterCategory && filterSubCategory && !filterSubSubCategory) {
        return productCategory === filterCategory && productSubCategory === filterSubCategory;
      }
      
      // All three filters
      if (filterCategory && filterSubCategory && filterSubSubCategory) {
        return productCategory === filterCategory && 
               productSubCategory === filterSubCategory && 
               productSubSubCategory === filterSubSubCategory;
      }
      
      // Only sub-subcategory filter
      if (!filterCategory && !filterSubCategory && filterSubSubCategory) {
        return productSubSubCategory === filterSubSubCategory;
      }
      
      return true;
    });
  }
}
