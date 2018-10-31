import {
  Component,
  Inject,
  Input,
  HostBinding,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
  PLATFORM_ID
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, BehaviorSubject, Subscription, SubscriptionLike, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { SmoothScroll, SmoothScrollEaseFunc } from '../smooth-scroll';

interface ViewStyle {
  right: string | number;
  bottom: string | number;
  paddingRight: string | number;
  paddingBottom: string | number;
}

const defaultState: ViewStyle = {
  right: 0,
  bottom: 0,
  paddingRight: 0,
  paddingBottom: 0
};

@Component({
  selector: 'ng-scrollbar',
  templateUrl: 'ng-scrollbar.html',
  styleUrls: ['ng-scrollbar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgScrollbar implements OnInit, AfterViewInit, OnDestroy {

  /** Horizontal custom scrollbar */
  @Input() trackX = false;
  /** Vertical custom Scrollbar */
  @Input() trackY = true;
  /** Auto hide scrollbars on mouse leave */
  @Input() autoHide = false;
  /** Auto update scrollbars on content changes (Mutation Observer) */
  @Input() autoUpdate = true;
  /** Viewport class */
  @Input() viewClass: string;
  /** Scrollbars class */
  @Input() barClass: string;
  /** Scrollbars thumbnails class */
  @Input() thumbClass: string;
  /** The smooth scroll duration when a scrollbar is clicked */
  @Input() scrollToDuration = 400;

  /** Disable custom scrollbars on specific breakpoints */
  @Input() disableOnBreakpoints = [
    Breakpoints.HandsetLandscape,
    Breakpoints.HandsetPortrait
  ];

  @ViewChild(CdkScrollable) scrollable: CdkScrollable;
  @ViewChild(SmoothScroll) smoothScroll: SmoothScroll;

  @HostBinding('class.ng-scrollbar-auto-hide') get autoHideClass() {
    return this.autoHide;
  }

  /** CDK breakpoint subscription */
  private _breakpointSub$: SubscriptionLike = Subscription.EMPTY;
  /** Viewport styles state */
  private _state = new BehaviorSubject<ViewStyle>(defaultState);
  viewStyle = this._state.asObservable();
  /** Check if view has been initialized */
  viewInitialized = false;
  /** Weather custom scrollbars are disabled */
  disabled = false;
  /** Viewport Element */
  view: HTMLElement;
  /** Observe content changes */
  private _observer: MutationObserver;
  private _contentObserver = new Subject();
  contentObserver = this._contentObserver.asObservable();

  constructor(private zone: NgZone,
              private breakpointObserver: BreakpointObserver,
              @Inject(DOCUMENT) private document: any,
              @Inject(PLATFORM_ID) private platform: Object) {
  }

  ngOnInit() {
    this.view = this.scrollable.getElementRef().nativeElement;

    if (this.disableOnBreakpoints) {
      this._breakpointSub$ = this.breakpointObserver.observe(this.disableOnBreakpoints).pipe(
        filter(() => this.viewInitialized),
        tap(result => result.matches ? this.disable() : this.enable())
      ).subscribe();
    } else {
      this.enable();
    }
  }

  ngAfterViewInit() {
    this.viewInitialized = true;

    if (this.autoUpdate) {
      // Observe content changes
      this._observer = new MutationObserver(() => this.update());
      this._observer.observe(this.view, {subtree: true, childList: true});
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  /**
   * Update scrollbar thumbnail position
   */
  update() {
    this._contentObserver.next();
  }

  /**
   * Enable custom scrollbar
   */
  enable() {
    this.disabled = false;
    // Hide native scrollbars
    const scrollWidth = this.getNativeScrollbarWidth();
    const size = `-${scrollWidth}px`;
    const padding = `${scrollWidth}px`;
    this._state.next({
      right: this.trackY ? size : 0,
      bottom: this.trackX ? size : 0,
      paddingRight: this.trackY ? padding : 0,
      paddingBottom: this.trackX ? padding : 0
    });
  }

  /**
   * Disable custom scrollbar
   */
  disable() {
    this.disabled = true;
    // Show Native Scrollbars
    this._state.next(defaultState);
    this.destroy();
  }

  scrollTo(options: ScrollToOptions): Observable<void> {
    return this.smoothScroll.scrollTo(options);
  }

  scrollToElement(selector: string, duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollToElement(selector, duration, easeFunc);
  }

  scrollXTo(to: number, duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollXTo(to, duration, easeFunc);
  }

  scrollYTo(to: number, duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollYTo(to, duration, easeFunc);
  }

  scrollToTop(duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollToTop(duration, easeFunc);
  }

  scrollToBottom(duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollToBottom(duration, easeFunc);
  }

  scrollToRight(duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollToRight(duration, easeFunc);
  }

  scrollToLeft(duration?: number, easeFunc?: SmoothScrollEaseFunc): Observable<void> {
    return this.smoothScroll.scrollToLeft(duration, easeFunc);
  }

  /**
   * Get the native scrollbar width
   */
  private getNativeScrollbarWidth(): number {
    if (isPlatformBrowser(this.platform)) {
      const element = this.document.createElement('div');
      element.style.position = 'absolute';
      element.style.top = '-9999px';
      element.style.width = '100px';
      element.style.height = '100px';
      element.style.overflow = 'scroll';
      element.style.msOverflowStyle = 'scrollbar';
      this.document.body.appendChild(element);
      const sw = element.offsetWidth - element.clientWidth;
      this.document.body.removeChild(element);
      return sw;
    }
    return 0;
  }

  /**
   * Destroy all streams
   */
  private destroy() {
    this._breakpointSub$.unsubscribe();
    if (this._observer) {
      this._observer.disconnect();
    }
  }
}
