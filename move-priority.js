const defaultOptions = {};

export default class MovePriority {
  constructor(el, options = {}) {
    this.moving = false;
    this.moveStartEvent = null;
    this.el = el;
    this.options = { ...defaultOptions, ...options };
    this.startEvent = null;
    this.moveEventsCount = 0;
    this.mObserver = null;
    this.detectedMove = false;
    this.detectMutationTimeout = null;
    this.canMoveTimeout = null;
    this.canMove = false;
    this.detectScrollTimeout = null;
    this.detectedScroll = false;

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
      mutations.forEach(() => {
        // ignore style changes on the sections -> we change them ourselve during animations
        // if (Array.from(this.el).some(el => event.target === el)) return;
        // TODO: the above line is important ... get this working
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

  removeEvents() {

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
    this.startEvent = this.normalizeEvent(event);
  }

  move() {
    if (this.canMove) {
      if (this.canMoveTimeout) clearTimeout(this.canMoveTimeout);
      console.log('moving');
      return;
    }
    this.detectMovementPossibility();
  }

  stopMove() {
    this.resetValues();
  }

  resetValues() {
    this.startEvent = null;
    this.canMove = false;
    this.moveEventsCount = 0;
    this.detectedMove = false;
    this.detectedScroll = false;
  }

  detectMovementPossibility() {
    if (!this.startEvent || this.canMove || this.detectedScroll || this.detectedMove) return;
    this.moveEventsCount++;
    const inTime = (Date.now() - this.startEvent.timeStamp) > 100;
    let calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 18;
    if (!this.touch) calledInRange = this.moveEventsCount > 2 && this.moveEventsCount < 100;
    if (inTime && calledInRange) this.canMove = true;
    else {
      clearTimeout(this.canMoveTimeout);
      this.canMoveTimeout = setTimeout(() => this.resetValues(), 60);
    }
  }
}
