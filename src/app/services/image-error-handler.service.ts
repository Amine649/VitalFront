import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageErrorHandlerService {

  /**
   * Handle image load error by setting a placeholder SVG
   * Prevents infinite loop by checking if placeholder is already set
   * @param event - The error event from the image element
   * @param placeholderText - Optional custom text for the placeholder (default: 'Image non disponible')
   */
  handleImageError(event: Event, placeholderText: string = 'Image non disponible'): void {
    const img = event.target as HTMLImageElement;
    
    // Prevent infinite loop by removing error handler first
    img.onerror = null;

    // Only set placeholder if not already a data URL
    if (!img.src.includes('data:image')) {
      // SVG placeholder with custom text
      img.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3E${encodeURIComponent(placeholderText)}%3C/text%3E%3C/svg%3E`;
    }
  }

  /**
   * Get a placeholder image URL for use in templates
   * @param text - Text to display in the placeholder
   * @returns Data URL for the placeholder SVG
   */
  getPlaceholderUrl(text: string = 'Image non disponible'): string {
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }
}
