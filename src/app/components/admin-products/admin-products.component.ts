import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product, ProductVariant } from '../../models/product.model';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  selectedCategory = '';
  selectedSubCategory = '';
  selectedStockStatus = ''; // New filter for stock status
  viewMode: 'grid' | 'list' = 'grid'; // Toggle between grid and list view

  // Pagination
  currentPage = 1;
  itemsPerPage = 9;
  Math = Math;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showVariantModal = false;
  showDeleteVariantModal = false;
  selectedProduct: Product | null = null;
  variantToDelete: ProductVariant | null = null;

  // Variant management
  productVariants: ProductVariant[] = [];
  loadingVariants = false;
  variantForm = {
    packaging: '',
    price: 0
  };

  // Notification state
  notification: { message: string; type: 'success' | 'error' } | null = null;

  // Form data
  productForm = {
    name: '',
    description: '',
    price: 0,
    category: '',
    subCategory: '',
    subSubCategory: '',
    detailsUrl: '',
    imageUrl:'',
    inStock: true,
    packaging: ''
  };

  constructor(
    private router: Router,
    private productService: ProductService,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // With HttpOnly cookies, token is not in localStorage
    // Check if user is admin instead
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = '';

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        // Load variants for each product
        this.loadVariantsForProducts(products);
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  loadVariantsForProducts(products: Product[]) {
    if (products.length === 0) {
      this.filteredProducts = [];
      this.loading = false;
      return;
    }

    const options = {
      withCredentials: true,  // Automatically includes HttpOnly cookies
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Create an array of variant requests for all products
    const variantRequests = products.map(product => 
      this.http.get<ProductVariant[]>(`${environment.apiUrl}/products/${product.id}/variants`, options)
    );

    // Execute all requests in parallel
    forkJoin(variantRequests).subscribe({
      next: (variantsArray) => {
        // Attach variants to each product and set price from first variant (minimum ID)
        products.forEach((product, index) => {
          product.variants = variantsArray[index];
          // Set product price from first variant (minimum ID) using service method
          product.price = this.productService.getVariantPrice(product);
        });
        this.filteredProducts = products;
        this.loading = false;
      },
      error: (err) => {
        // Still show products even if variants fail to load
        this.filteredProducts = products;
        this.loading = false;
      }
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm ||
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.subCategory.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.selectedCategory ||
        product.category === this.selectedCategory;

      const matchesSubCategory = !this.selectedSubCategory ||
        product.subCategory === this.selectedSubCategory;

      const matchesStockStatus = !this.selectedStockStatus ||
        (this.selectedStockStatus === 'inStock' && product.inStock) ||
        (this.selectedStockStatus === 'outOfStock' && !product.inStock);

      return matchesSearch && matchesCategory && matchesSubCategory && matchesStockStatus;
    });
    
    // Reset to first page when filtering
    this.currentPage = 1;
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.filterProducts();
  }

  onCategoryChange(value: string) {
    this.selectedCategory = value;
    this.filterProducts();
  }

  onSubCategoryChange(value: string) {
    this.selectedSubCategory = value;
    this.filterProducts();
  }

  onStockStatusChange(value: string) {
    this.selectedStockStatus = value;
    this.filterProducts();
  }

  toggleViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedSubCategory = '';
    this.selectedStockStatus = '';
    this.filterProducts();
  }

  getCategoryLabel(category: string): string {
    return this.productService.getCategoryLabel(category);
  }

  getSubCategoryLabel(subCategory: string): string {
    return this.productService.getSubCategoryLabel(subCategory);
  }

  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(product: any) {
    this.selectedProduct = product;
    // Populate form with product data and first variant data
    this.productForm = {
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl || '',
      price: product.variants && product.variants.length > 0 ? product.variants[0].price : 0,
      category: product.category,
      subCategory: product.subCategory,
      subSubCategory: product.subSubCategory || '',
      detailsUrl: product.detailsUrl,
      inStock: product.inStock,
      packaging: product.variants && product.variants.length > 0 ? product.variants[0].packaging : ''
    };
    this.showEditModal = true;
  }

  openDeleteModal(product: any) {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedProduct = null;
    this.resetForm();
  }

  resetForm() {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      category: '',
      subCategory: '',
      subSubCategory: '',
      detailsUrl: '',
      imageUrl:'',
      inStock: true,
      packaging: ''
    };
  }

  addProduct() {
    const productData: Partial<Omit<Product, 'id'>> = {
      name: this.productForm.name,
      description: this.productForm.description,
      category: this.productForm.category as 'CHAT' | 'CHIEN',
      subCategory: this.productForm.subCategory as 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE',
      subSubCategory: (this.productForm.subCategory === 'ALIMENT') ? (this.productForm.subSubCategory as 'DIETETIQUE' | 'PHYSIO') : undefined,
      imageUrl: '', // Always empty as per requirement
      detailsUrl: this.productForm.detailsUrl,
      inStock: this.productForm.inStock
    };

    this.productService.addProduct(productData).subscribe({
      next: (newProduct) => {
        // Add variant with price and packaging
        this.addProductVariant(newProduct.id, this.productForm.price, this.productForm.packaging);
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors de l\'ajout du produit. Veuillez réessayer.');
      }
    });
  }

  addProductVariant(productId: number, price: number, packaging: string) {
    const variantData = { 
      price: price,
      packaging: packaging || '' 
    };
    const url = `${environment.apiUrl}/products/${productId}/variants/add`;
    const options = {
      withCredentials: true,  // Automatically includes HttpOnly cookies
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this.http.post(url, variantData, options).subscribe({
      next: () => {
        // Reload all products to get the updated list with variants
        this.loadProducts();
        this.closeModals();
        this.showSuccessMessage('Produit et variante ajoutés avec succès!');
      },
      error: (err) => {
        this.closeModals();
        this.showErrorMessage('Produit ajouté, mais erreur lors de l\'ajout de la variante.');
      }
    });
  }

  updateProduct() {
    if (!this.selectedProduct) return;

    // Prepare variants array with updated price and packaging
    const variants: any[] = [];
    if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0) {
      // Update existing variant
      variants.push({
        id: this.selectedProduct.variants[0].id,
        packaging: this.productForm.packaging || this.selectedProduct.variants[0].packaging,
        price: this.productForm.price
      });
    } else {
      // Create new variant if none exists (id will be assigned by backend)
      variants.push({
        packaging: this.productForm.packaging || '',
        price: this.productForm.price
      });
    }

    const productData: any = {
      name: this.productForm.name,
      description: this.productForm.description,
      imageUrl: this.productForm.imageUrl || '',
      category: this.productForm.category as 'CHAT' | 'CHIEN',
      subCategory: this.productForm.subCategory as 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE',
      subSubCategory: (this.productForm.subCategory === 'ALIMENT') ? (this.productForm.subSubCategory as 'DIETETIQUE' | 'PHYSIO') : undefined,
      inStock: this.productForm.inStock,
      detailsUrl: this.productForm.detailsUrl,
      variants: variants
    };

    this.productService.updateProduct(this.selectedProduct.id, productData).subscribe({
      next: (updatedProduct) => {
        // Reload all products to get the updated list with variants
        this.loadProducts();
        this.closeModals();
        this.showSuccessMessage('Produit modifié avec succès!');
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors de la modification du produit. Veuillez réessayer.');
      }
    });
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        // Remove the product from the local array
        this.products = this.products.filter(p => p.id !== this.selectedProduct!.id);
        this.filterProducts();
        this.closeModals();
        this.showSuccessMessage('Produit supprimé avec succès!');
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors de la suppression du produit. Veuillez réessayer.');
      }
    });
  }

  showSuccessMessage(message: string) {
    this.notification = { message, type: 'success' };
    setTimeout(() => {
      this.notification = null;
    }, 4000); // Auto-hide after 4 seconds
  }

  showErrorMessage(message: string) {
    this.notification = { message, type: 'error' };
    setTimeout(() => {
      this.notification = null;
    }, 5000); // Auto-hide after 5 seconds
  }

  closeNotification() {
    this.notification = null;
  }

  logout() {
    this.authService.logout('/');
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if we already tried to set a fallback
    if (!img.src.includes('data:image')) {
      // Use a simple SVG placeholder instead of trying to load another image
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
    }
  }

  // Pagination methods
  getPaginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
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

  // Variant Management Methods
  openVariantModal(product: Product) {
    this.selectedProduct = product;
    this.loadingVariants = true;
    this.showVariantModal = true;
    this.resetVariantForm();
    
    // Load variants for this product
    const options = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    this.http.get<ProductVariant[]>(`${environment.apiUrl}/products/${product.id}/variants`, options).subscribe({
      next: (variants) => {
        this.productVariants = variants;
        this.loadingVariants = false;
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors du chargement des variantes');
        this.loadingVariants = false;
      }
    });
  }

  closeVariantModal() {
    this.showVariantModal = false;
    this.selectedProduct = null;
    this.productVariants = [];
    this.resetVariantForm();
  }

  resetVariantForm() {
    this.variantForm = {
      packaging: '',
      price: 0
    };
  }

  isPackagingUsed(packaging: string): boolean {
    return this.productVariants.some(variant => variant.packaging === packaging);
  }

  addVariant() {
    if (!this.selectedProduct || !this.variantForm.packaging || this.variantForm.price <= 0) {
      this.showErrorMessage('Veuillez remplir tous les champs');
      return;
    }

    const variantData = {
      packaging: this.variantForm.packaging,
      price: this.variantForm.price
    };

    const options = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this.http.post(`${environment.apiUrl}/products/${this.selectedProduct.id}/variants/add`, variantData, options).subscribe({
      next: () => {
        this.showSuccessMessage('Variante ajoutée avec succès!');
        this.resetVariantForm();
        // Reload variants
        this.openVariantModal(this.selectedProduct!);
        // Reload products to update the list
        this.loadProducts();
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors de l\'ajout de la variante');
      }
    });
  }

  openDeleteVariantModal(variant: ProductVariant) {
    this.variantToDelete = variant;
    this.showDeleteVariantModal = true;
  }

  closeDeleteVariantModal() {
    this.showDeleteVariantModal = false;
    this.variantToDelete = null;
  }

  confirmDeleteVariant() {
    if (!this.variantToDelete || !this.selectedProduct) {
      return;
    }

    const options = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this.http.delete(`${environment.apiUrl}/products/variants/delete/${this.variantToDelete.id}`, options).subscribe({
      next: () => {
        this.showSuccessMessage('Variante supprimée avec succès!');
        this.closeDeleteVariantModal();
        // Reload variants
        this.openVariantModal(this.selectedProduct!);
        // Reload products to update the list
        this.loadProducts();
      },
      error: (err) => {
        this.showErrorMessage('Erreur lors de la suppression de la variante');
      }
    });
  }
}
