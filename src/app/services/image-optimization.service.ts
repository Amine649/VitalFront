import { Injectable } from '@angular/core';

/**
 * Image Optimization Service
 * Provides utilities for image optimization, lazy loading, and format selection
 */
@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  
  /**
   * Check if browser supports WebP format
   */
  supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Get optimized image URL based on browser support
   * @param imagePath - Original image path
   * @param useWebP - Whether to use WebP if supported
   * @returns Optimized image URL
   */
  async getOptimizedImageUrl(imagePath: string, useWebP: boolean = true): Promise<string> {
    if (!useWebP) {
      return imagePath;
    }

    const supportsWebP = await this.supportsWebP();
    
    if (supportsWebP) {
      // Replace extension with .webp
      return imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return imagePath;
  }

  /**
   * Get responsive image srcset for different screen sizes
   * @param basePath - Base image path without extension
   * @param sizes - Array of sizes (e.g., [320, 640, 1024])
   * @returns srcset string
   */
  getResponsiveSrcset(basePath: string, sizes: number[] = [320, 640, 1024, 1920]): string {
    const ext = basePath.split('.').pop();
    const baseWithoutExt = basePath.substring(0, basePath.lastIndexOf('.'));
    
    return sizes
      .map(size => `${baseWithoutExt}-${size}w.${ext} ${size}w`)
      .join(', ');
  }

  /**
   * Preload critical images
   * @param imageUrls - Array of image URLs to preload
   */
  preloadImages(imageUrls: string[]): void {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Get image dimensions without loading the full image
   * @param url - Image URL
   * @returns Promise with width and height
   */
  getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Generate a low-quality image placeholder (LQIP) data URL
   * This is a simple implementation - in production, generate these at build time
   * @param width - Placeholder width
   * @param height - Placeholder height
   * @param color - Background color
   * @returns Data URL for placeholder
   */
  generatePlaceholder(width: number = 10, height: number = 10, color: string = '#f3f4f6'): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
  }

  /**
   * Check if image should be lazy loaded based on viewport position
   * @param element - Image element
   * @param threshold - Distance from viewport (in pixels) to start loading
   * @returns boolean
   */
  shouldLazyLoad(element: HTMLElement, threshold: number = 300): boolean {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return rect.top <= viewportHeight + threshold;
  }

  /**
   * Compress image quality for thumbnails
   * Note: This is a client-side approach. Server-side compression is preferred.
   * @param file - Image file
   * @param maxWidth - Maximum width
   * @param quality - JPEG quality (0-1)
   * @returns Promise with compressed blob
   */
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Could not compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get optimal image format based on image type and browser support
   * @param imageType - Original image type (e.g., 'photo', 'illustration', 'icon')
   * @returns Recommended format
   */
  async getOptimalFormat(imageType: 'photo' | 'illustration' | 'icon'): Promise<string> {
    const supportsWebP = await this.supportsWebP();
    
    switch (imageType) {
      case 'photo':
        return supportsWebP ? 'webp' : 'jpeg';
      case 'illustration':
        return supportsWebP ? 'webp' : 'png';
      case 'icon':
        return 'svg'; // Always prefer SVG for icons
      default:
        return supportsWebP ? 'webp' : 'jpeg';
    }
  }

  /**
   * Calculate optimal image size based on device pixel ratio and viewport
   * @param containerWidth - Container width in pixels
   * @returns Optimal image width
   */
  getOptimalImageSize(containerWidth: number): number {
    const dpr = window.devicePixelRatio || 1;
    const optimalWidth = containerWidth * dpr;
    
    // Round up to nearest standard size
    const standardSizes = [320, 640, 768, 1024, 1366, 1920, 2560];
    return standardSizes.find(size => size >= optimalWidth) || standardSizes[standardSizes.length - 1];
  }
}
