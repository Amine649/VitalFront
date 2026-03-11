import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Product Skeleton Loader Component
 * Shows a loading placeholder while products are being fetched
 * 
 * Usage:
 * <app-product-skeleton [count]="6"></app-product-skeleton>
 */
@Component({
  selector: 'app-product-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let item of skeletonArray" 
         class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      <!-- Image Skeleton -->
      <div class="w-full h-40 bg-gray-200"></div>
      
      <!-- Content Skeleton -->
      <div class="p-4 space-y-3">
        <!-- Title -->
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        
        <!-- Description -->
        <div class="space-y-2">
          <div class="h-3 bg-gray-200 rounded w-full"></div>
          <div class="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        <!-- Category and Price -->
        <div class="flex items-center justify-between">
          <div class="h-6 bg-gray-200 rounded w-16"></div>
          <div class="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        
        <!-- Buttons -->
        <div class="space-y-2">
          <div class="h-10 bg-gray-200 rounded"></div>
          <div class="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class ProductSkeletonComponent {
  @Input() count: number = 6;
  
  get skeletonArray(): number[] {
    return Array(this.count).fill(0);
  }
}
