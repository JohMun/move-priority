const defaultOptions = {
  whiteListedElements: [],
  nativeStartMove: () => {},
  onStartMove: () => {},
  onMove: () => {},
  onEndMove: () => {},
};

export default class MovePriority {
  constructor(el, options = {}) {
    this.el = el; // TODO: allow to pass string
    this.options = { ...defaultOptions, ...options };

    // saved Events during interaction
    this.nativeStartEvent = null;

    // vars to detect if the element is allowed to move
    this.mObserver = null;
    this.detectedMove = false;
    this.detectedScroll = false;
    this.canMoveTimeout = null;
    this.moveEventsCount = 0;
    this.canMove = false;

    this.isTouch = Boolean('ontouchstart' in window
      || window.DocumentTouch
      && window.DocumentTouch
      && document instanceof window.DocumentTouch);

    this.attachEvents();
    this.initObserver();
  }

  initObserver() {
    // observe other drags
    this.mObserver = new MutationObserver(mutations => {
      mutations.forEach(event => {
        if (this.detectedMove || !this.nativeStartEvent) return;
        // ignore style changes on the sections -> we change them ourselve during animations
        if (this.options.whiteListedElements.some(el => event.target === el)) return;
        // TODO: this.whiteListElements -> allow nodeList
        const rect = event.target.getBoundingClientRect();
        const { x, y } = this.nativeStartEvent;
        const inY = y > rect.y && y < rect.y + rect.height;
        const inX = x > rect.x && x < rect.x + rect.width;
        if (inY && inX) this.detectedMove = true;
      });
    });
    this.mObserver.observe(this.el, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  attachEvents() {
    this.el.addEventListener(
      this.isTouch ? 'touchstart' : 'mousedown',
      this.startMove.bind(this),
      false,
    );

    this.el.addEventListener('scroll', () => this.detectedScroll = true, true);

    window.addEventListener(
      this.isTouch ? 'touchmove' : 'mousemove',
      this.move.bind(this),
      { passive: false },
    );

    window.addEventListener(
      this.isTouch ? 'touchend' : 'mouseup',
      this.stopMove.bind(this),
      false,
    );
  }

  disableObservation() {
    console.log('called');
    // TODO: turn everything off but keep the API
  }

  enableObservation() {
    // TODO: turn everything on
  }

  removeEvents() {
    // TODO: disconnect observer
    // TODO: remove events Listeners, maybe call this method 'destroy'
  }

  normalizeEvent(event) {
    // eslint-disable-next-line prefer-const
    let { clientX, clientY, timeStamp, target } = event;
    if (event.targetTouches) {
      clientX = event.targetTouches && event.targetTouches[0].clientX;
      clientY = event.targetTouches && event.targetTouches[0].clientY;
    }
    return { nativeEvent: event, x: clientX, y: clientY, timeStamp, target };
  }

  startMove(event) {
    this.nativeStartEvent = this.normalizeEvent(event);
    this.options.nativeStartMove(this.nativeStartEvent);
  }

  move(event) {
    if (this.canMove) {
      if (this.canMoveTimeout) clearTimeout(this.canMoveTimeout);
      // TODO: make some cool calculations
      // speed, delta x/y, delta percentage based on screen,
      const normalizedEvent = this.normalizeEvent(event);
      this.options.onMove({ ...normalizedEvent, speed: 'test' });
      return;
    }
    this.isAllowedToMove();
  }

  stopMove() {
    // TODO: make some cool calculations
    // speed, delta x/y, delta percentage based on screen, direction
    this.resetValues();
  }

  resetValues() {
    this.nativeStartEvent = null;
    this.canMove = false;
    this.moveEventsCount = 0;
    this.detectedMove = false;
    this.detectedScroll = false;
  }

  isAllowedToMove() {
    if (!this.nativeStartEvent || this.canMove || this.detectedScroll || this.detectedMove) return;
    this.moveEventsCount++;
    const inTime = (Date.now() - this.nativeStartEvent.timeStamp) > 100;
    let calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 18;
    if (!this.touch) calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 100;
    if (inTime && calledInRange) {
      this.canMove = true;
      // TODO: save some values here to make calculations
    } else {
      clearTimeout(this.canMoveTimeout);
      this.canMoveTimeout = setTimeout(() => this.resetValues(), 60);
    }
  }
}
