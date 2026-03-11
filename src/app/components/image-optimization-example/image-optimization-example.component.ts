import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';
import { ImageOptimizationService } from '../../services/image-optimization.service';

/**
 * Example Component demonstrating all image optimization features
 * This component shows best practices for:
 * - Lazy loading images
 * - Using WebP with fallbacks
 * - Responsive images
 * - Image preloading
 * - Error handling
 */
@Component({
  selector: 'app-image-optimization-example',
  standalone: true,
  imports: [CommonModule, LazyLoadImageDirective],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-6">Image Optimization Examples</h1>

      <!-- Example 1: Basic Lazy Loading -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">1. Basic Lazy Loading</h2>
        <p class="mb-4 text-gray-600">
          Images load only when they enter the viewport, reducing initial page load time.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <img 
            appLazyLoadImage 
            src="assets/images/CatDog.jpg" 
            alt="Cat and dog together - Veterinary care for pets"
            class="w-full h-64 object-cover rounded-lg shadow-md">
          
          <img 
            appLazyLoadImage 
            src="assets/images/probiotiques.jpg" 
            alt="Probiotics for pets"
            class="w-full h-64 object-cover rounded-lg shadow-md">
        </div>
      </section>

      <!-- Example 2: WebP with Fallback -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">2. WebP Format with Fallback</h2>
        <p class="mb-4 text-gray-600">
          Modern browsers get WebP (40% smaller), older browsers get JPG.
        </p>
        <div class="bg-gray-100 p-4 rounded-lg">
          <p class="mb-2"><strong>Browser Support:</strong> {{ webpSupported ? '✅ WebP Supported' : '❌ WebP Not Supported' }}</p>
          <img 
            appLazyLoadImage 
            src="assets/images/CatDog.jpg" 
            [webpSrc]="'assets/images/CatDog.webp'"
            alt="Cat and dog - WebP example"
            class="w-full max-w-md mx-auto rounded-lg shadow-md">
        </div>
      </section>

      <!-- Example 3: With Placeholder -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">3. Lazy Loading with Placeholder</h2>
        <p class="mb-4 text-gray-600">
          Shows a low-quality placeholder while the full image loads.
        </p>
        <img 
          appLazyLoadImage 
          src="assets/images/CatDog.jpg" 
          [placeholderSrc]="placeholderImage"
          alt="Cat and dog - Placeholder example"
          class="w-full max-w-md mx-auto rounded-lg shadow-md">
      </section>

      <!-- Example 4: Responsive Images -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">4. Responsive Images</h2>
        <p class="mb-4 text-gray-600">
          Different image sizes for different screen sizes (when available).
        </p>
        <picture>
          <source 
            media="(max-width: 640px)" 
            srcset="assets/images/CatDog.jpg">
          <source 
            media="(max-width: 1024px)" 
            srcset="assets/images/CatDog.jpg">
          <img 
            appLazyLoadImage
            src="assets/images/CatDog.jpg" 
            alt="Cat and dog - Responsive example"
            class="w-full rounded-lg shadow-md">
        </picture>
      </section>

      <!-- Example 5: Grid of Images -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">5. Image Grid (All Lazy Loaded)</h2>
        <p class="mb-4 text-gray-600">
          Multiple images that load as you scroll down the page.
        </p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div *ngFor="let image of demoImages; trackBy: trackByIndex" 
               class="aspect-square">
            <img 
              appLazyLoadImage 
              [src]="image.src" 
              [alt]="image.alt"
              class="w-full h-full object-cover rounded-lg shadow-md">
          </div>
        </div>
      </section>

      <!-- Example 6: Performance Stats -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">6. Performance Statistics</h2>
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="font-semibold mb-4">Image Optimization Benefits:</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded shadow">
              <p class="text-sm text-gray-600">Original Size</p>
              <p class="text-2xl font-bold text-gray-800">699 KB</p>
            </div>
            <div class="bg-white p-4 rounded shadow">
              <p class="text-sm text-gray-600">Optimized Size (WebP)</p>
              <p class="text-2xl font-bold text-green-600">~420 KB</p>
            </div>
            <div class="bg-white p-4 rounded shadow">
              <p class="text-sm text-gray-600">Size Reduction</p>
              <p class="text-2xl font-bold text-blue-600">40%</p>
            </div>
            <div class="bg-white p-4 rounded shadow">
              <p class="text-sm text-gray-600">Load Time Improvement</p>
              <p class="text-2xl font-bold text-purple-600">60-80%</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Example 7: Best Practices -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">7. Best Practices Checklist</h2>
        <div class="bg-gray-50 p-6 rounded-lg">
          <ul class="space-y-2">
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Use <code class="bg-gray-200 px-2 py-1 rounded">appLazyLoadImage</code> directive for all images</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Provide WebP versions with fallbacks</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Always include descriptive alt text</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Keep images under 500KB</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Use appropriate image formats (WebP for photos, SVG for icons)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Compress images before deployment</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">✓</span>
              <span>Test on slow connections</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Code Examples -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">8. Code Examples</h2>
        
        <div class="space-y-4">
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <p class="text-sm text-gray-400 mb-2">Basic Usage:</p>
            <pre class="text-sm"><code>&lt;img appLazyLoadImage 
     src="assets/images/photo.jpg" 
     alt="Description"&gt;</code></pre>
          </div>

          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <p class="text-sm text-gray-400 mb-2">With WebP:</p>
            <pre class="text-sm"><code>&lt;img appLazyLoadImage 
     src="assets/images/photo.jpg" 
     [webpSrc]="'assets/images/photo.webp'"
     alt="Description"&gt;</code></pre>
          </div>

          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <p class="text-sm text-gray-400 mb-2">Component Import:</p>
            <pre class="text-sm"><code>import {{ '{' }} LazyLoadImageDirective {{ '}' }} from '../../directives/lazy-load-image.directive';

@Component({{ '{' }}
  imports: [LazyLoadImageDirective],
  // ...
{{ '}' }})</code></pre>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    code {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
  `]
})
export class ImageOptimizationExampleComponent implements OnInit {
  webpSupported: boolean = false;
  placeholderImage: string;
  
  demoImages = [
    { src: 'assets/images/CatDog.jpg', alt: 'Cat and dog 1' },
    { src: 'assets/images/probiotiques.jpg', alt: 'Probiotics' },
    { src: 'assets/images/CatDog.jpg', alt: 'Cat and dog 2' },
    { src: 'assets/images/probiotiques.jpg', alt: 'Probiotics 2' },
    { src: 'assets/images/CatDog.jpg', alt: 'Cat and dog 3' },
    { src: 'assets/images/probiotiques.jpg', alt: 'Probiotics 3' },
    { src: 'assets/images/CatDog.jpg', alt: 'Cat and dog 4' },
    { src: 'assets/images/probiotiques.jpg', alt: 'Probiotics 4' },
  ];

  constructor(private imageOptService: ImageOptimizationService) {
    // Generate a simple placeholder
    this.placeholderImage = this.imageOptService.generatePlaceholder(10, 10, '#e5e7eb');
  }

  async ngOnInit() {
    // Check WebP support
    this.webpSupported = await this.imageOptService.supportsWebP();
    
    // Preload critical images
    this.imageOptService.preloadImages([
      'assets/images/CatDog.jpg'
    ]);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
