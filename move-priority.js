const defaultOptions = {
  mutationWhiteList: [],
  nativeStartMove: () => {},
  onStartMove: () => {},
  nativeMove: () => {},
  onMove: () => {},
  onEndMove: () => {},
  onCancelMove: () => {},
  onStopMove: () => {},
};

export default class MovePriority {
  constructor(el, options = {}) {
    if (typeof el === 'string') el = document.querySelector(el);
    this.el = el;
    this.options = { ...defaultOptions, ...options };
    this.whiteListed = this._nodeList2Array(this.options.mutationWhiteList);

    this.nativeStartEvent = null;

    // vars to detect, if the element is allowed to move
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

    // methods called by event listeners
    this._startMove = this._startMove.bind(this);
    this._move = this._move.bind(this);
    this._stopMove = this._stopMove.bind(this);
    this._detectScroll = this._detectScroll.bind(this);
    this._cancelMove = this._cancelMove.bind(this);

    this._initObserver();
    this.connectObservation();
  }

  _nodeList2Array(list) {
    return Array.prototype.slice.call(list);
  }

  _initObserver() {
    // observe other interactions
    this.mObserver = new MutationObserver(mutations => {
      mutations.forEach(event => {
        if (this.detectedMove || !this.nativeStartEvent) return;
        // ignore style changes on the sections -> we change them ourselve during animations
        if (this.whiteListed.some(el => event.target === el)) return;

        const rect = event.target.getBoundingClientRect();
        const { x, y } = this.nativeStartEvent;
        const inY = y > rect.y && y < rect.y + rect.height;
        const inX = x > rect.x && x < rect.x + rect.width;
        if (inY && inX) this.detectedMove = true;
      });
    });
  }

  _attachEvents() {
    this.el.addEventListener(
      this.isTouch ? 'touchstart' : 'mousedown',
      this._startMove,
      false,
    );

    this.el.addEventListener('scroll', this._detectScroll, true);

    window.addEventListener(
      this.isTouch ? 'touchmove' : 'mousemove',
      this._move,
      { passive: false },
    );

    window.addEventListener(
      this.isTouch ? 'touchend' : 'mouseup',
      this._stopMove,
      false,
    );

    this.el.addEventListener('mouseleave', this._cancelMove, false);
  }

  _detectScroll() {
    this.detectedScroll = true;
  }

  diconnectObservation() {
    this.mObserver.disconnect();
    this._removeEvents();
  }

  connectObservation() {
    this._attachEvents();
    this.mObserver.observe(this.el, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  _removeEvents() {
    this.el.removeEventListener(this.isTouch ? 'touchstart' : 'mousedown', this._startMove, false);
    this.el.removeEventListener('scroll', this._detectScroll);
    window.removeEventListener(this.isTouch ? 'touchmove' : 'mousemove', this._move);
    window.removeEventListener(this.isTouch ? 'touchend' : 'mouseup', this._stopMove, false);
    this.el.removeEventListener('mouseleave', this._cancelMove, false);
  }

  destroy() {
    this.diconnectObservation();
  }

  _normalizeEvent(event) {
    // eslint-disable-next-line prefer-const
    let { clientX, clientY, target } = event;
    if (event.targetTouches) {
      clientX = event.targetTouches && event.targetTouches[0].clientX;
      clientY = event.targetTouches && event.targetTouches[0].clientY;
    }
    return { nativeEvent: event, x: clientX, y: clientY, timeStamp: Date.now(), target };
  }

  _cancelMove(event) {
    if (!this.canMove) return;
    this._resetValues();
    this.options.onCancelMove({ nativeEvent: event });
  }

  _startMove(event) {
    this.nativeStartEvent = this._normalizeEvent(event);
    this.options.nativeStartMove({ nativeEvent: event });
  }

  _move(event) {
    // TODO: make some cool calculations
    // speed, delta x/y, delta percentage based on screen,
    this.options.nativeMove({ nativeEvent: event });
    if (this.canMove) {
      if (this.canMoveTimeout) clearTimeout(this.canMoveTimeout);
      const normalizedEvent = this._normalizeEvent(event);
      // TODO: also pass the calulcations here
      this.options.onMove({ ...normalizedEvent, speed: 'test' });
      return;
    }
    this._isAllowedToMove();
  }

  _stopMove(event) {
    // TODO: make some cool calculations
    // speed, delta x/y, delta percentage based on screen, direction
    this._resetValues();
    this.options.onStopMove({ nativeEvent: event });
  }

  _resetValues() {
    this.nativeStartEvent = null;
    this.canMove = false;
    this.moveEventsCount = 0;
    this.detectedMove = false;
    this.detectedScroll = false;
  }

  _isAllowedToMove(event) {
    if (!this.nativeStartEvent || this.canMove || this.detectedScroll || this.detectedMove) return;
    this.moveEventsCount++;
    const inTime = (Date.now() - this.nativeStartEvent.timeStamp) > 100;
    let calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 18;
    if (!this.touch) calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 100;
    if (inTime && calledInRange) {
      this.canMove = true;
      // TODO: save some values here to make calculations
      this.options.onStartMove({ nativeEvent: event });
    } else {
      clearTimeout(this.canMoveTimeout);
      this.canMoveTimeout = setTimeout(() => this._resetValues(), 60);
    }
  }
}
