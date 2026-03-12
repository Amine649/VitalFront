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
      
    if (type === 'resourceUrl') {
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      return safeUrl;
    }
    
    return url;
  }
}
