export interface Product {
  id: number;
  name: string;
  description: string;
  price?: number;
  imageUrl: string;
  category: 'CHAT' | 'CHIEN';
  subCategory: 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE';
  subSubCategory?: 'DIETETIQUE' | 'PHYSIO';
  inStock: boolean;
  detailsUrl: string;
  variants?: ProductVariant[];
  selectedVariantId?: number; // Currently selected variant ID in the UI
}

export interface ProductVariant {
  id: number;
  packaging: string;
  price: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}
