const defaultOptions = {
  preventDefault: false,
  mutationWhiteList: [],
  scrollWhiteList: [],
  nativeStartMove: () => {},
  nativeMove: () => {},
  nativeStopMove: () => {},
  onStartMove: () => {},
  onMove: () => {},
  onCancelMove: () => {},
  onStopMove: () => {},
};

export default class MovePriority {
  constructor(el, options = {}) {
    if (typeof el === 'string') el = document.querySelector(el);
    this.el = el;
    this.options = { ...defaultOptions, ...options };
    this.mutationWhiteList = this._nodeList2Array(this.options.mutationWhiteList);
    this.scrollWhiteList = this._nodeList2Array(this.options.scrollWhiteList);
    this.nativeStartEvent = null;
    this.nativeMoveEvent = null;
    this.startEvent = null;
    this.screenSize = {};
    this.lastTouch = null;

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
    this._measureScreen = this._measureScreen.bind(this);

    this._measureScreen();
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
        if (this.mutationWhiteList.some(el => event.target === el)) return;

        const rect = event.target.getBoundingClientRect();
        const { x, y } = this.nativeMoveEvent || this.nativeStartEvent;
        const inY = y > rect.y && y < rect.y + rect.height;
        const inX = x > rect.x && x < rect.x + rect.width;
        if (event.target.innerText === 'Moving') return;
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
    window.addEventListener('resize', this._measureScreen, false);
  }

  _detectScroll(event) {
    if (this.scrollWhiteList.some(el => event.target === el)) return;
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

  _measureScreen() {
    this.screenSize = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  }

  _removeEvents() {
    this.el.removeEventListener(this.isTouch ? 'touchstart' : 'mousedown', this._startMove, false);
    this.el.removeEventListener('scroll', this._detectScroll);
    window.removeEventListener(this.isTouch ? 'touchmove' : 'mousemove', this._move);
    window.removeEventListener(this.isTouch ? 'touchend' : 'mouseup', this._stopMove, false);
    this.el.removeEventListener('mouseleave', this._cancelMove, false);
    window.removeEventListener('resize', this._measureScreen, false);
  }

  destroy() {
    this.diconnectObservation();
  }

  _extendEvent(event, helper) {
    // eslint-disable-next-line prefer-const
    let { clientX, clientY, target } = event;
    if (event.targetTouches) {
      clientX = helper
        && helper.targetTouches[0].clientX
        || event.targetTouches && event.targetTouches[0].clientX;
      clientY = helper
        && helper.targetTouches[0].clientY
        || event.targetTouches && event.targetTouches[0].clientY;
    }
    return { nativeEvent: event, x: clientX, y: clientY, timeStamp: Date.now(), target };
  }

  _calculateValues(firstEvent, nextEvent) {
    const x = nextEvent.x - firstEvent.x;
    const y = nextEvent.y - firstEvent.y;
    const xPercentage = Math.abs(x * 100 / this.screenSize.innerWidth);
    const yPercentage = Math.abs(y * 100 / this.screenSize.innerHeight);
    const delta = { x, y, xPercentage, yPercentage };
    const speed = Math.abs((x + y) / (nextEvent.timeStamp - firstEvent.timeStamp));
    const direction = Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
    const start = { x: firstEvent.x, y: firstEvent.y };
    return { start, delta, ...nextEvent, speed, direction };
  }

  _cancelMove(event) {
    const firstEvent = this.startEvent || this.nativeStartEvent;
    if (!this.canMove || !firstEvent) return;
    this._resetValues();
    this.options.onCancelMove({ nativeEvent: event });
  }

  _startMove(event) {
    this.nativeStartEvent = this._extendEvent(event);
    this.lastTouch = event;
    this.options.nativeStartMove(this.nativeStartEvent);
  }

  _move(event) {
    if (this.options.preventDefault) event.preventDefault();
    this.nativeMoveEvent = this._extendEvent(event);
    const firstEvent = this.startEvent || this.nativeStartEvent;
    if (!firstEvent) return;
    this.lastTouch = event;
    const eventComparison = this._calculateValues(firstEvent, this._extendEvent(event));
    this.options.nativeMove(eventComparison);
    if (this.canMove) {
      if (this.canMoveTimeout) clearTimeout(this.canMoveTimeout);
      return this.options.onMove(eventComparison);
    }
    this._isAllowedToMove(event);
  }

  _stopMove(event) {
    const firstEvent = this.startEvent || this.nativeStartEvent;
    if (!firstEvent) return;
    const eventComparison = this._calculateValues(
      firstEvent, this._extendEvent(event, this.lastTouch)
    );
    this.options.nativeStopMove(eventComparison);
    if (this.canMove) this.options.onStopMove(eventComparison);
    this._resetValues();
  }

  _resetValues() {
    this.nativeMoveEvent = null;
    this.nativeStartEvent = null;
    this.startEvent = null;
    this.detectedMove = false;
    this.detectedScroll = false;
    this.canMove = false;
    this.moveEventsCount = 0;
  }

  _isAllowedToMove(event) {
    if (!this.nativeStartEvent || this.canMove || this.detectedScroll || this.detectedMove) return;
    this.moveEventsCount++;
    const inTime = (Date.now() - this.nativeStartEvent.timeStamp) > 60;
    let calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 18;
    if (!this.touch) calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 100;
    if (inTime && calledInRange) {
      this.canMove = true;
      this.startEvent = this._extendEvent(event);
      this.options.onStartMove(this.startEvent);
    } else {
      clearTimeout(this.canMoveTimeout);
      this.canMoveTimeout = setTimeout(() => {
        this.canMove = false;
        this.moveEventsCount = 0;
      }, 60);
    }
  }
}
