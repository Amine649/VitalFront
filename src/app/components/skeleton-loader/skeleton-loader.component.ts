import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      <!-- Product Card Skeleton -->
      <div *ngIf="type === 'product-card'" class="bg-white rounded-2xl shadow-md p-4 animate-pulse">
        <div class="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div class="flex justify-between items-center mb-3">
          <div class="h-3 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div class="space-y-2">
          <div class="h-8 bg-gray-200 rounded"></div>
          <div class="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      <!-- Cart Item Skeleton -->
      <div *ngIf="type === 'cart-item'" class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
        <div class="w-28 h-28 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div class="flex-grow space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div class="w-12 h-6 bg-gray-200 rounded"></div>
          <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div class="w-28 h-6 bg-gray-200 rounded"></div>
        <div class="w-5 h-5 bg-gray-200 rounded"></div>
      </div>

      <!-- Table Row Skeleton -->
      <div *ngIf="type === 'table-row'" class="animate-pulse">
        <div class="flex items-center gap-4 p-4 border-b border-gray-200">
          <div class="h-4 bg-gray-200 rounded w-1/6"></div>
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/6"></div>
          <div class="h-4 bg-gray-200 rounded w-1/6"></div>
          <div class="h-4 bg-gray-200 rounded w-1/6"></div>
          <div class="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      <!-- Form Skeleton -->
      <div *ngIf="type === 'form'" class="space-y-4 animate-pulse">
        <div>
          <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div class="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div>
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div class="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div>
          <div class="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
          <div class="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div class="h-10 bg-gray-200 rounded w-full mt-6"></div>
      </div>

      <!-- Text Lines Skeleton -->
      <div *ngIf="type === 'text'" class="space-y-2 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>

      <!-- Circle Skeleton -->
      <div *ngIf="type === 'circle'" class="animate-pulse">
        <div class="rounded-full bg-gray-200" [style.width.px]="size" [style.height.px]="size"></div>
      </div>

      <!-- Rectangle Skeleton -->
      <div *ngIf="type === 'rectangle'" class="animate-pulse">
        <div class="bg-gray-200 rounded" [style.width]="width" [style.height]="height"></div>
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
export class SkeletonLoaderComponent {
  @Input() type: 'product-card' | 'cart-item' | 'table-row' | 'form' | 'text' | 'circle' | 'rectangle' = 'rectangle';
  @Input() count: number = 1;
  @Input() size: number = 40; // For circle
  @Input() width: string = '100%'; // For rectangle
  @Input() height: string = '20px'; // For rectangle

  get items(): number[] {
    return Array(this.count).fill(0);
  }
}
