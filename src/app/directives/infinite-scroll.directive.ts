import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

/**
 * Infinite Scroll Directive
 * Triggers an event when user scrolls near the bottom of the page
 * 
 * Usage:
 * <div appInfiniteScroll 
 *      (scrolled)="loadMore()" 
 *      [scrollThreshold]="200">
 * </div>
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Output() scrolled = new EventEmitter<void>();
  @Input() scrollThreshold = 200; // Distance from bottom to trigger (in pixels)
  @Input() scrollEnabled = true; // Enable/disable scrolling

  private scrollListener: (() => void) | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.scrollListener = this.onScroll.bind(this);
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private onScroll(): void {
    if (!this.scrollEnabled) {
      return;
    }

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate distance from bottom
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    // Trigger event when near bottom
    if (distanceFromBottom < this.scrollThreshold) {
      this.scrolled.emit();
    }
  }
}
