import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string, type: string): SafeResourceUrl | SafeUrl | string {
    if (!url) {
      return '';
    }
    
    console.log('SafePipe - URL:', url);
    console.log('SafePipe - Type:', type);
    
    if (type === 'resourceUrl') {
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      console.log('SafePipe - Sanitized URL:', safeUrl);
      return safeUrl;
    }
    
    return url;
  }
}
