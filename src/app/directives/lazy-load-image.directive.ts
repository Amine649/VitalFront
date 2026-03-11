import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Lazy Load Image Directive
 * Automatically adds loading="lazy" and handles image optimization
 * 
 * Usage:
 * <img appLazyLoadImage [src]="imageUrl" alt="Description">
 * <img appLazyLoadImage [src]="imageUrl" [webpSrc]="webpUrl" alt="Description">
 */
@Directive({
  selector: 'img[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit {
  @Input() src!: string;
  @Input() webpSrc?: string;
  @Input() alt: string = '';
  @Input() placeholderSrc?: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    const img = this.el.nativeElement;

    // Add loading="lazy" for native lazy loading
    this.renderer.setAttribute(img, 'loading', 'lazy');

    // Add decoding="async" for better performance
    this.renderer.setAttribute(img, 'decoding', 'async');

    // If WebP source is provided, create picture element for better format support
    if (this.webpSrc) {
      this.createPictureElement();
    } else {
      // Just set the src
      this.renderer.setAttribute(img, 'src', this.src);
    }

    // Add alt text if not already present
    if (!img.alt && this.alt) {
      this.renderer.setAttribute(img, 'alt', this.alt);
    }

    // Add placeholder if provided
    if (this.placeholderSrc) {
      this.addPlaceholder();
    }

    // Add error handling (only once to prevent infinite loop)
    let errorHandled = false;
    this.renderer.listen(img, 'error', () => {
      if (errorHandled) return; // Prevent infinite loop
      errorHandled = true;
      
      console.warn(`Failed to load image: ${this.src}`);
      
      // Set a data URL placeholder to avoid further errors
      const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImage non disponible%3C/text%3E%3C/svg%3E';
      this.renderer.setAttribute(img, 'src', placeholderSvg);
    });
  }

  private createPictureElement(): void {
    const img = this.el.nativeElement;
    const parent = img.parentElement;

    if (!parent) return;

    // Create picture element
    const picture = this.renderer.createElement('picture');

    // Create WebP source
    const webpSource = this.renderer.createElement('source');
    this.renderer.setAttribute(webpSource, 'srcset', this.webpSrc!);
    this.renderer.setAttribute(webpSource, 'type', 'image/webp');

    // Create fallback source
    const fallbackSource = this.renderer.createElement('source');
    this.renderer.setAttribute(fallbackSource, 'srcset', this.src);
    this.renderer.setAttribute(fallbackSource, 'type', this.getImageType(this.src));

    // Append sources to picture
    this.renderer.appendChild(picture, webpSource);
    this.renderer.appendChild(picture, fallbackSource);

    // Move img into picture
    this.renderer.insertBefore(parent, picture, img);
    this.renderer.appendChild(picture, img);

    // Set img src as fallback
    this.renderer.setAttribute(img, 'src', this.src);
  }

  private addPlaceholder(): void {
    const img = this.el.nativeElement;

    // Set placeholder as initial src
    const originalSrc = this.src;
    this.renderer.setAttribute(img, 'src', this.placeholderSrc!);

    // Use Intersection Observer to load actual image when in viewport
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.setAttribute(img, 'src', originalSrc);
            observer.unobserve(img);
          }
        });
      });

      observer.observe(img);
    } else {
      // Fallback for browsers without Intersection Observer
      this.renderer.setAttribute(img, 'src', originalSrc);
    }
  }

  private getImageType(src: string): string {
    const ext = src.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  }
}
