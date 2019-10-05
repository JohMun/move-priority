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
        // ignore style changes on the sections -> we change them ourselve during animations
        if (this.options.whiteListedElements.some(el => event.target === el)) return;
        // TODO: this.whiteListElements -> allow nodeList
        this.detectedMove = true;
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
    // TODO: remove events Listeners, maybe call thismethod destroy
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

  move() {
    if (this.canMove) {
      if (this.canMoveTimeout) clearTimeout(this.canMoveTimeout);
      console.log('moving');
      return;
    }
    this.isAllowedToMove();
  }

  stopMove() {
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
    if (inTime && calledInRange) this.canMove = true;
    else {
      clearTimeout(this.canMoveTimeout);
      this.canMoveTimeout = setTimeout(() => this.resetValues(), 60);
    }
  }
}
