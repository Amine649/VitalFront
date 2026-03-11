import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class]="containerClass">
      <div class="relative">
        <div class="spinner" 
             [style.width.px]="size" 
             [style.height.px]="size"
             [style.border-width.px]="borderWidth"
             [ngClass]="colorClass"></div>
        <span *ngIf="text" class="mt-3 block text-sm text-gray-600 text-center">{{ text }}</span>
      </div>
    </div>
  `,
  styles: [`
    .spinner {
      border-style: solid;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .spinner-blue {
      border-color: #3b82f6;
      border-top-color: transparent;
    }

    .spinner-white {
      border-color: white;
      border-top-color: transparent;
    }

    .spinner-gray {
      border-color: #9ca3af;
      border-top-color: transparent;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 40;
  @Input() borderWidth: number = 4;
  @Input() color: 'blue' | 'white' | 'gray' = 'blue';
  @Input() text: string = '';
  @Input() containerClass: string = '';

  get colorClass(): string {
    return `spinner-${this.color}`;
  }
}
