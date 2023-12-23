/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/headroom.js/dist/headroom.js":
/*!***************************************************!*\
  !*** ./node_modules/headroom.js/dist/headroom.js ***!
  \***************************************************/
/***/ (function(module) {

/*!
 * headroom.js v0.12.0 - Give your page some headroom. Hide your header until you need it
 * Copyright (c) 2020 Nick Williams - http://wicky.nillia.ms/headroom.js
 * License: MIT
 */

(function (global, factory) {
   true ? module.exports = factory() :
  0;
}(this, function () { 'use strict';

  function isBrowser() {
    return typeof window !== "undefined";
  }

  /**
   * Used to detect browser support for adding an event listener with options
   * Credit: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  function passiveEventsSupported() {
    var supported = false;

    try {
      var options = {
        // eslint-disable-next-line getter-return
        get passive() {
          supported = true;
        }
      };
      window.addEventListener("test", options, options);
      window.removeEventListener("test", options, options);
    } catch (err) {
      supported = false;
    }

    return supported;
  }

  function isSupported() {
    return !!(
      isBrowser() &&
      function() {}.bind &&
      "classList" in document.documentElement &&
      Object.assign &&
      Object.keys &&
      requestAnimationFrame
    );
  }

  function isDocument(obj) {
    return obj.nodeType === 9; // Node.DOCUMENT_NODE === 9
  }

  function isWindow(obj) {
    // `obj === window` or `obj instanceof Window` is not sufficient,
    // as the obj may be the window of an iframe.
    return obj && obj.document && isDocument(obj.document);
  }

  function windowScroller(win) {
    var doc = win.document;
    var body = doc.body;
    var html = doc.documentElement;

    return {
      /**
       * @see http://james.padolsey.com/javascript/get-document-height-cross-browser/
       * @return {Number} the scroll height of the document in pixels
       */
      scrollHeight: function() {
        return Math.max(
          body.scrollHeight,
          html.scrollHeight,
          body.offsetHeight,
          html.offsetHeight,
          body.clientHeight,
          html.clientHeight
        );
      },

      /**
       * @see http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript
       * @return {Number} the height of the viewport in pixels
       */
      height: function() {
        return win.innerHeight || html.clientHeight || body.clientHeight;
      },

      /**
       * Gets the Y scroll position
       * @return {Number} pixels the page has scrolled along the Y-axis
       */
      scrollY: function() {
        if (win.pageYOffset !== undefined) {
          return win.pageYOffset;
        }

        return (html || body.parentNode || body).scrollTop;
      }
    };
  }

  function elementScroller(element) {
    return {
      /**
       * @return {Number} the scroll height of the element in pixels
       */
      scrollHeight: function() {
        return Math.max(
          element.scrollHeight,
          element.offsetHeight,
          element.clientHeight
        );
      },

      /**
       * @return {Number} the height of the element in pixels
       */
      height: function() {
        return Math.max(element.offsetHeight, element.clientHeight);
      },

      /**
       * Gets the Y scroll position
       * @return {Number} pixels the element has scrolled along the Y-axis
       */
      scrollY: function() {
        return element.scrollTop;
      }
    };
  }

  function createScroller(element) {
    return isWindow(element) ? windowScroller(element) : elementScroller(element);
  }

  /**
   * @param element EventTarget
   */
  function trackScroll(element, options, callback) {
    var isPassiveSupported = passiveEventsSupported();
    var rafId;
    var scrolled = false;
    var scroller = createScroller(element);
    var lastScrollY = scroller.scrollY();
    var details = {};

    function update() {
      var scrollY = Math.round(scroller.scrollY());
      var height = scroller.height();
      var scrollHeight = scroller.scrollHeight();

      // reuse object for less memory churn
      details.scrollY = scrollY;
      details.lastScrollY = lastScrollY;
      details.direction = scrollY > lastScrollY ? "down" : "up";
      details.distance = Math.abs(scrollY - lastScrollY);
      details.isOutOfBounds = scrollY < 0 || scrollY + height > scrollHeight;
      details.top = scrollY <= options.offset[details.direction];
      details.bottom = scrollY + height >= scrollHeight;
      details.toleranceExceeded =
        details.distance > options.tolerance[details.direction];

      callback(details);

      lastScrollY = scrollY;
      scrolled = false;
    }

    function handleScroll() {
      if (!scrolled) {
        scrolled = true;
        rafId = requestAnimationFrame(update);
      }
    }

    var eventOptions = isPassiveSupported
      ? { passive: true, capture: false }
      : false;

    element.addEventListener("scroll", handleScroll, eventOptions);
    update();

    return {
      destroy: function() {
        cancelAnimationFrame(rafId);
        element.removeEventListener("scroll", handleScroll, eventOptions);
      }
    };
  }

  function normalizeUpDown(t) {
    return t === Object(t) ? t : { down: t, up: t };
  }

  /**
   * UI enhancement for fixed headers.
   * Hides header when scrolling down
   * Shows header when scrolling up
   * @constructor
   * @param {DOMElement} elem the header element
   * @param {Object} options options for the widget
   */
  function Headroom(elem, options) {
    options = options || {};
    Object.assign(this, Headroom.options, options);
    this.classes = Object.assign({}, Headroom.options.classes, options.classes);

    this.elem = elem;
    this.tolerance = normalizeUpDown(this.tolerance);
    this.offset = normalizeUpDown(this.offset);
    this.initialised = false;
    this.frozen = false;
  }
  Headroom.prototype = {
    constructor: Headroom,

    /**
     * Start listening to scrolling
     * @public
     */
    init: function() {
      if (Headroom.cutsTheMustard && !this.initialised) {
        this.addClass("initial");
        this.initialised = true;

        // defer event registration to handle browser
        // potentially restoring previous scroll position
        setTimeout(
          function(self) {
            self.scrollTracker = trackScroll(
              self.scroller,
              { offset: self.offset, tolerance: self.tolerance },
              self.update.bind(self)
            );
          },
          100,
          this
        );
      }

      return this;
    },

    /**
     * Destroy the widget, clearing up after itself
     * @public
     */
    destroy: function() {
      this.initialised = false;
      Object.keys(this.classes).forEach(this.removeClass, this);
      this.scrollTracker.destroy();
    },

    /**
     * Unpin the element
     * @public
     */
    unpin: function() {
      if (this.hasClass("pinned") || !this.hasClass("unpinned")) {
        this.addClass("unpinned");
        this.removeClass("pinned");

        if (this.onUnpin) {
          this.onUnpin.call(this);
        }
      }
    },

    /**
     * Pin the element
     * @public
     */
    pin: function() {
      if (this.hasClass("unpinned")) {
        this.addClass("pinned");
        this.removeClass("unpinned");

        if (this.onPin) {
          this.onPin.call(this);
        }
      }
    },

    /**
     * Freezes the current state of the widget
     * @public
     */
    freeze: function() {
      this.frozen = true;
      this.addClass("frozen");
    },

    /**
     * Re-enables the default behaviour of the widget
     * @public
     */
    unfreeze: function() {
      this.frozen = false;
      this.removeClass("frozen");
    },

    top: function() {
      if (!this.hasClass("top")) {
        this.addClass("top");
        this.removeClass("notTop");

        if (this.onTop) {
          this.onTop.call(this);
        }
      }
    },

    notTop: function() {
      if (!this.hasClass("notTop")) {
        this.addClass("notTop");
        this.removeClass("top");

        if (this.onNotTop) {
          this.onNotTop.call(this);
        }
      }
    },

    bottom: function() {
      if (!this.hasClass("bottom")) {
        this.addClass("bottom");
        this.removeClass("notBottom");

        if (this.onBottom) {
          this.onBottom.call(this);
        }
      }
    },

    notBottom: function() {
      if (!this.hasClass("notBottom")) {
        this.addClass("notBottom");
        this.removeClass("bottom");

        if (this.onNotBottom) {
          this.onNotBottom.call(this);
        }
      }
    },

    shouldUnpin: function(details) {
      var scrollingDown = details.direction === "down";

      return scrollingDown && !details.top && details.toleranceExceeded;
    },

    shouldPin: function(details) {
      var scrollingUp = details.direction === "up";

      return (scrollingUp && details.toleranceExceeded) || details.top;
    },

    addClass: function(className) {
      this.elem.classList.add.apply(
        this.elem.classList,
        this.classes[className].split(" ")
      );
    },

    removeClass: function(className) {
      this.elem.classList.remove.apply(
        this.elem.classList,
        this.classes[className].split(" ")
      );
    },

    hasClass: function(className) {
      return this.classes[className].split(" ").every(function(cls) {
        return this.classList.contains(cls);
      }, this.elem);
    },

    update: function(details) {
      if (details.isOutOfBounds) {
        // Ignore bouncy scrolling in OSX
        return;
      }

      if (this.frozen === true) {
        return;
      }

      if (details.top) {
        this.top();
      } else {
        this.notTop();
      }

      if (details.bottom) {
        this.bottom();
      } else {
        this.notBottom();
      }

      if (this.shouldUnpin(details)) {
        this.unpin();
      } else if (this.shouldPin(details)) {
        this.pin();
      }
    }
  };

  /**
   * Default options
   * @type {Object}
   */
  Headroom.options = {
    tolerance: {
      up: 0,
      down: 0
    },
    offset: 0,
    scroller: isBrowser() ? window : null,
    classes: {
      frozen: "headroom--frozen",
      pinned: "headroom--pinned",
      unpinned: "headroom--unpinned",
      top: "headroom--top",
      notTop: "headroom--not-top",
      bottom: "headroom--bottom",
      notBottom: "headroom--not-bottom",
      initial: "headroom"
    }
  };

  Headroom.cutsTheMustard = isSupported();

  return Headroom;

}));


/***/ }),

/***/ "./node_modules/vanilla-tilt/lib/vanilla-tilt.js":
/*!*******************************************************!*\
  !*** ./node_modules/vanilla-tilt/lib/vanilla-tilt.js ***!
  \*******************************************************/
/***/ ((module) => {

"use strict";


var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

/**
 * Created by Sergiu Șandor (micku7zu) on 1/27/2017.
 * Original idea: https://github.com/gijsroge/tilt.js
 * MIT License.
 * Version 1.8.1
 */

var VanillaTilt = function () {
  function VanillaTilt(element) {
    var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, VanillaTilt);

    if (!(element instanceof Node)) {
      throw "Can't initialize VanillaTilt because " + element + " is not a Node.";
    }

    this.width = null;
    this.height = null;
    this.clientWidth = null;
    this.clientHeight = null;
    this.left = null;
    this.top = null;

    // for Gyroscope sampling
    this.gammazero = null;
    this.betazero = null;
    this.lastgammazero = null;
    this.lastbetazero = null;

    this.transitionTimeout = null;
    this.updateCall = null;
    this.event = null;

    this.updateBind = this.update.bind(this);
    this.resetBind = this.reset.bind(this);

    this.element = element;
    this.settings = this.extendSettings(settings);

    this.reverse = this.settings.reverse ? -1 : 1;
    this.resetToStart = VanillaTilt.isSettingTrue(this.settings["reset-to-start"]);
    this.glare = VanillaTilt.isSettingTrue(this.settings.glare);
    this.glarePrerender = VanillaTilt.isSettingTrue(this.settings["glare-prerender"]);
    this.fullPageListening = VanillaTilt.isSettingTrue(this.settings["full-page-listening"]);
    this.gyroscope = VanillaTilt.isSettingTrue(this.settings.gyroscope);
    this.gyroscopeSamples = this.settings.gyroscopeSamples;

    this.elementListener = this.getElementListener();

    if (this.glare) {
      this.prepareGlare();
    }

    if (this.fullPageListening) {
      this.updateClientSize();
    }

    this.addEventListeners();
    this.reset();

    if (this.resetToStart === false) {
      this.settings.startX = 0;
      this.settings.startY = 0;
    }
  }

  VanillaTilt.isSettingTrue = function isSettingTrue(setting) {
    return setting === "" || setting === true || setting === 1;
  };

  /**
   * Method returns element what will be listen mouse events
   * @return {Node}
   */


  VanillaTilt.prototype.getElementListener = function getElementListener() {
    if (this.fullPageListening) {
      return window.document;
    }

    if (typeof this.settings["mouse-event-element"] === "string") {
      var mouseEventElement = document.querySelector(this.settings["mouse-event-element"]);

      if (mouseEventElement) {
        return mouseEventElement;
      }
    }

    if (this.settings["mouse-event-element"] instanceof Node) {
      return this.settings["mouse-event-element"];
    }

    return this.element;
  };

  /**
   * Method set listen methods for this.elementListener
   * @return {Node}
   */


  VanillaTilt.prototype.addEventListeners = function addEventListeners() {
    this.onMouseEnterBind = this.onMouseEnter.bind(this);
    this.onMouseMoveBind = this.onMouseMove.bind(this);
    this.onMouseLeaveBind = this.onMouseLeave.bind(this);
    this.onWindowResizeBind = this.onWindowResize.bind(this);
    this.onDeviceOrientationBind = this.onDeviceOrientation.bind(this);

    this.elementListener.addEventListener("mouseenter", this.onMouseEnterBind);
    this.elementListener.addEventListener("mouseleave", this.onMouseLeaveBind);
    this.elementListener.addEventListener("mousemove", this.onMouseMoveBind);

    if (this.glare || this.fullPageListening) {
      window.addEventListener("resize", this.onWindowResizeBind);
    }

    if (this.gyroscope) {
      window.addEventListener("deviceorientation", this.onDeviceOrientationBind);
    }
  };

  /**
   * Method remove event listeners from current this.elementListener
   */


  VanillaTilt.prototype.removeEventListeners = function removeEventListeners() {
    this.elementListener.removeEventListener("mouseenter", this.onMouseEnterBind);
    this.elementListener.removeEventListener("mouseleave", this.onMouseLeaveBind);
    this.elementListener.removeEventListener("mousemove", this.onMouseMoveBind);

    if (this.gyroscope) {
      window.removeEventListener("deviceorientation", this.onDeviceOrientationBind);
    }

    if (this.glare || this.fullPageListening) {
      window.removeEventListener("resize", this.onWindowResizeBind);
    }
  };

  VanillaTilt.prototype.destroy = function destroy() {
    clearTimeout(this.transitionTimeout);
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.element.style.willChange = "";
    this.element.style.transition = "";
    this.element.style.transform = "";
    this.resetGlare();

    this.removeEventListeners();
    this.element.vanillaTilt = null;
    delete this.element.vanillaTilt;

    this.element = null;
  };

  VanillaTilt.prototype.onDeviceOrientation = function onDeviceOrientation(event) {
    if (event.gamma === null || event.beta === null) {
      return;
    }

    this.updateElementPosition();

    if (this.gyroscopeSamples > 0) {
      this.lastgammazero = this.gammazero;
      this.lastbetazero = this.betazero;

      if (this.gammazero === null) {
        this.gammazero = event.gamma;
        this.betazero = event.beta;
      } else {
        this.gammazero = (event.gamma + this.lastgammazero) / 2;
        this.betazero = (event.beta + this.lastbetazero) / 2;
      }

      this.gyroscopeSamples -= 1;
    }

    var totalAngleX = this.settings.gyroscopeMaxAngleX - this.settings.gyroscopeMinAngleX;
    var totalAngleY = this.settings.gyroscopeMaxAngleY - this.settings.gyroscopeMinAngleY;

    var degreesPerPixelX = totalAngleX / this.width;
    var degreesPerPixelY = totalAngleY / this.height;

    var angleX = event.gamma - (this.settings.gyroscopeMinAngleX + this.gammazero);
    var angleY = event.beta - (this.settings.gyroscopeMinAngleY + this.betazero);

    var posX = angleX / degreesPerPixelX;
    var posY = angleY / degreesPerPixelY;

    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.event = {
      clientX: posX + this.left,
      clientY: posY + this.top
    };

    this.updateCall = requestAnimationFrame(this.updateBind);
  };

  VanillaTilt.prototype.onMouseEnter = function onMouseEnter() {
    this.updateElementPosition();
    this.element.style.willChange = "transform";
    this.setTransition();
  };

  VanillaTilt.prototype.onMouseMove = function onMouseMove(event) {
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.event = event;
    this.updateCall = requestAnimationFrame(this.updateBind);
  };

  VanillaTilt.prototype.onMouseLeave = function onMouseLeave() {
    this.setTransition();

    if (this.settings.reset) {
      requestAnimationFrame(this.resetBind);
    }
  };

  VanillaTilt.prototype.reset = function reset() {
    this.onMouseEnter();

    if (this.fullPageListening) {
      this.event = {
        clientX: (this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.clientWidth,
        clientY: (this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.clientHeight
      };
    } else {
      this.event = {
        clientX: this.left + (this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.width,
        clientY: this.top + (this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.height
      };
    }

    var backupScale = this.settings.scale;
    this.settings.scale = 1;
    this.update();
    this.settings.scale = backupScale;
    this.resetGlare();
  };

  VanillaTilt.prototype.resetGlare = function resetGlare() {
    if (this.glare) {
      this.glareElement.style.transform = "rotate(180deg) translate(-50%, -50%)";
      this.glareElement.style.opacity = "0";
    }
  };

  VanillaTilt.prototype.getValues = function getValues() {
    var x = void 0,
        y = void 0;

    if (this.fullPageListening) {
      x = this.event.clientX / this.clientWidth;
      y = this.event.clientY / this.clientHeight;
    } else {
      x = (this.event.clientX - this.left) / this.width;
      y = (this.event.clientY - this.top) / this.height;
    }

    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);

    var tiltX = (this.reverse * (this.settings.max - x * this.settings.max * 2)).toFixed(2);
    var tiltY = (this.reverse * (y * this.settings.max * 2 - this.settings.max)).toFixed(2);
    var angle = Math.atan2(this.event.clientX - (this.left + this.width / 2), -(this.event.clientY - (this.top + this.height / 2))) * (180 / Math.PI);

    return {
      tiltX: tiltX,
      tiltY: tiltY,
      percentageX: x * 100,
      percentageY: y * 100,
      angle: angle
    };
  };

  VanillaTilt.prototype.updateElementPosition = function updateElementPosition() {
    var rect = this.element.getBoundingClientRect();

    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    this.left = rect.left;
    this.top = rect.top;
  };

  VanillaTilt.prototype.update = function update() {
    var values = this.getValues();

    this.element.style.transform = "perspective(" + this.settings.perspective + "px) " + "rotateX(" + (this.settings.axis === "x" ? 0 : values.tiltY) + "deg) " + "rotateY(" + (this.settings.axis === "y" ? 0 : values.tiltX) + "deg) " + "scale3d(" + this.settings.scale + ", " + this.settings.scale + ", " + this.settings.scale + ")";

    if (this.glare) {
      this.glareElement.style.transform = "rotate(" + values.angle + "deg) translate(-50%, -50%)";
      this.glareElement.style.opacity = "" + values.percentageY * this.settings["max-glare"] / 100;
    }

    this.element.dispatchEvent(new CustomEvent("tiltChange", {
      "detail": values
    }));

    this.updateCall = null;
  };

  /**
   * Appends the glare element (if glarePrerender equals false)
   * and sets the default style
   */


  VanillaTilt.prototype.prepareGlare = function prepareGlare() {
    // If option pre-render is enabled we assume all html/css is present for an optimal glare effect.
    if (!this.glarePrerender) {
      // Create glare element
      var jsTiltGlare = document.createElement("div");
      jsTiltGlare.classList.add("js-tilt-glare");

      var jsTiltGlareInner = document.createElement("div");
      jsTiltGlareInner.classList.add("js-tilt-glare-inner");

      jsTiltGlare.appendChild(jsTiltGlareInner);
      this.element.appendChild(jsTiltGlare);
    }

    this.glareElementWrapper = this.element.querySelector(".js-tilt-glare");
    this.glareElement = this.element.querySelector(".js-tilt-glare-inner");

    if (this.glarePrerender) {
      return;
    }

    Object.assign(this.glareElementWrapper.style, {
      "position": "absolute",
      "top": "0",
      "left": "0",
      "width": "100%",
      "height": "100%",
      "overflow": "hidden",
      "pointer-events": "none",
      "border-radius": "inherit"
    });

    Object.assign(this.glareElement.style, {
      "position": "absolute",
      "top": "50%",
      "left": "50%",
      "pointer-events": "none",
      "background-image": "linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
      "transform": "rotate(180deg) translate(-50%, -50%)",
      "transform-origin": "0% 0%",
      "opacity": "0"
    });

    this.updateGlareSize();
  };

  VanillaTilt.prototype.updateGlareSize = function updateGlareSize() {
    if (this.glare) {
      var glareSize = (this.element.offsetWidth > this.element.offsetHeight ? this.element.offsetWidth : this.element.offsetHeight) * 2;

      Object.assign(this.glareElement.style, {
        "width": glareSize + "px",
        "height": glareSize + "px"
      });
    }
  };

  VanillaTilt.prototype.updateClientSize = function updateClientSize() {
    this.clientWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    this.clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  };

  VanillaTilt.prototype.onWindowResize = function onWindowResize() {
    this.updateGlareSize();
    this.updateClientSize();
  };

  VanillaTilt.prototype.setTransition = function setTransition() {
    var _this = this;

    clearTimeout(this.transitionTimeout);
    this.element.style.transition = this.settings.speed + "ms " + this.settings.easing;
    if (this.glare) this.glareElement.style.transition = "opacity " + this.settings.speed + "ms " + this.settings.easing;

    this.transitionTimeout = setTimeout(function () {
      _this.element.style.transition = "";
      if (_this.glare) {
        _this.glareElement.style.transition = "";
      }
    }, this.settings.speed);
  };

  /**
   * Method return patched settings of instance
   * @param {boolean} settings.reverse - reverse the tilt direction
   * @param {number} settings.max - max tilt rotation (degrees)
   * @param {startX} settings.startX - the starting tilt on the X axis, in degrees. Default: 0
   * @param {startY} settings.startY - the starting tilt on the Y axis, in degrees. Default: 0
   * @param {number} settings.perspective - Transform perspective, the lower the more extreme the tilt gets
   * @param {string} settings.easing - Easing on enter/exit
   * @param {number} settings.scale - 2 = 200%, 1.5 = 150%, etc..
   * @param {number} settings.speed - Speed of the enter/exit transition
   * @param {boolean} settings.transition - Set a transition on enter/exit
   * @param {string|null} settings.axis - What axis should be enabled. Can be "x" or "y"
   * @param {boolean} settings.glare - if it should have a "glare" effect
   * @param {number} settings.max-glare - the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
   * @param {boolean} settings.glare-prerender - false = VanillaTilt creates the glare elements for you, otherwise
   * @param {boolean} settings.full-page-listening - If true, parallax effect will listen to mouse move events on the whole document, not only the selected element
   * @param {string|object} settings.mouse-event-element - String selector or link to HTML-element what will be listen mouse events
   * @param {boolean} settings.reset - false = If the tilt effect has to be reset on exit
   * @param {boolean} settings.reset-to-start - true = On reset event (mouse leave) will return to initial start angle (if startX or startY is set)
   * @param {gyroscope} settings.gyroscope - Enable tilting by deviceorientation events
   * @param {gyroscopeSensitivity} settings.gyroscopeSensitivity - Between 0 and 1 - The angle at which max tilt position is reached. 1 = 90deg, 0.5 = 45deg, etc..
   * @param {gyroscopeSamples} settings.gyroscopeSamples - How many gyroscope moves to decide the starting position.
   */


  VanillaTilt.prototype.extendSettings = function extendSettings(settings) {
    var defaultSettings = {
      reverse: false,
      max: 15,
      startX: 0,
      startY: 0,
      perspective: 1000,
      easing: "cubic-bezier(.03,.98,.52,.99)",
      scale: 1,
      speed: 300,
      transition: true,
      axis: null,
      glare: false,
      "max-glare": 1,
      "glare-prerender": false,
      "full-page-listening": false,
      "mouse-event-element": null,
      reset: true,
      "reset-to-start": true,
      gyroscope: true,
      gyroscopeMinAngleX: -45,
      gyroscopeMaxAngleX: 45,
      gyroscopeMinAngleY: -45,
      gyroscopeMaxAngleY: 45,
      gyroscopeSamples: 10
    };

    var newSettings = {};
    for (var property in defaultSettings) {
      if (property in settings) {
        newSettings[property] = settings[property];
      } else if (this.element.hasAttribute("data-tilt-" + property)) {
        var attribute = this.element.getAttribute("data-tilt-" + property);
        try {
          newSettings[property] = JSON.parse(attribute);
        } catch (e) {
          newSettings[property] = attribute;
        }
      } else {
        newSettings[property] = defaultSettings[property];
      }
    }

    return newSettings;
  };

  VanillaTilt.init = function init(elements, settings) {
    if (elements instanceof Node) {
      elements = [elements];
    }

    if (elements instanceof NodeList) {
      elements = [].slice.call(elements);
    }

    if (!(elements instanceof Array)) {
      return;
    }

    elements.forEach(function (element) {
      if (!("vanillaTilt" in element)) {
        element.vanillaTilt = new VanillaTilt(element, settings);
      }
    });
  };

  return VanillaTilt;
}();

if (typeof document !== "undefined") {
  /* expose the class to window */
  window.VanillaTilt = VanillaTilt;

  /**
   * Auto load
   */
  VanillaTilt.init(document.querySelectorAll("[data-tilt]"));
}

module.exports = VanillaTilt;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**************************!*\
  !*** ./src/js/module.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var headroom_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! headroom.js */ "./node_modules/headroom.js/dist/headroom.js");
/* harmony import */ var headroom_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(headroom_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var vanilla_tilt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! vanilla-tilt */ "./node_modules/vanilla-tilt/lib/vanilla-tilt.js");
/* harmony import */ var vanilla_tilt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(vanilla_tilt__WEBPACK_IMPORTED_MODULE_1__);

var myElement = document.querySelector("header");
var headroom = new (headroom_js__WEBPACK_IMPORTED_MODULE_0___default())(myElement);
headroom.init();

function vanillaTilt(item, max, speed) {
  var items = document.querySelectorAll(item);
  vanilla_tilt__WEBPACK_IMPORTED_MODULE_1___default().init(items, {
    max: max,
    speed: speed
  });
}
vanillaTilt('.installation__right', 1, 2000);
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBLENBQUM7Ozs7Ozs7Ozs7OztBQ3BiWTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYztBQUNkOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7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LEdBQUc7SUFBRUMsS0FBSyxFQUFFQTtFQUFLLENBQUMsQ0FBQztBQUNwRDtBQUVBSCxXQUFXLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2xhZ3JhY2gtdGVtcGxhdGUvLi9ub2RlX21vZHVsZXMvaGVhZHJvb20uanMvZGlzdC9oZWFkcm9vbS5qcyIsIndlYnBhY2s6Ly9zbGFncmFjaC10ZW1wbGF0ZS8uL25vZGVfbW9kdWxlcy92YW5pbGxhLXRpbHQvbGliL3ZhbmlsbGEtdGlsdC5qcyIsIndlYnBhY2s6Ly9zbGFncmFjaC10ZW1wbGF0ZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9zbGFncmFjaC10ZW1wbGF0ZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9zbGFncmFjaC10ZW1wbGF0ZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vc2xhZ3JhY2gtdGVtcGxhdGUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9zbGFncmFjaC10ZW1wbGF0ZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3NsYWdyYWNoLXRlbXBsYXRlLy4vc3JjL2pzL21vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIGhlYWRyb29tLmpzIHYwLjEyLjAgLSBHaXZlIHlvdXIgcGFnZSBzb21lIGhlYWRyb29tLiBIaWRlIHlvdXIgaGVhZGVyIHVudGlsIHlvdSBuZWVkIGl0XG4gKiBDb3B5cmlnaHQgKGMpIDIwMjAgTmljayBXaWxsaWFtcyAtIGh0dHA6Ly93aWNreS5uaWxsaWEubXMvaGVhZHJvb20uanNcbiAqIExpY2Vuc2U6IE1JVFxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IGdsb2JhbCB8fCBzZWxmLCBnbG9iYWwuSGVhZHJvb20gPSBmYWN0b3J5KCkpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBpc0Jyb3dzZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCI7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgYnJvd3NlciBzdXBwb3J0IGZvciBhZGRpbmcgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCBvcHRpb25zXG4gICAqIENyZWRpdDogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2FkZEV2ZW50TGlzdGVuZXJcbiAgICovXG4gIGZ1bmN0aW9uIHBhc3NpdmVFdmVudHNTdXBwb3J0ZWQoKSB7XG4gICAgdmFyIHN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZ2V0dGVyLXJldHVyblxuICAgICAgICBnZXQgcGFzc2l2ZSgpIHtcbiAgICAgICAgICBzdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ0ZXN0XCIsIG9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0ZXN0XCIsIG9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc3VwcG9ydGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzU3VwcG9ydGVkKCkge1xuICAgIHJldHVybiAhIShcbiAgICAgIGlzQnJvd3NlcigpICYmXG4gICAgICBmdW5jdGlvbigpIHt9LmJpbmQgJiZcbiAgICAgIFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmXG4gICAgICBPYmplY3QuYXNzaWduICYmXG4gICAgICBPYmplY3Qua2V5cyAmJlxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRG9jdW1lbnQob2JqKSB7XG4gICAgcmV0dXJuIG9iai5ub2RlVHlwZSA9PT0gOTsgLy8gTm9kZS5ET0NVTUVOVF9OT0RFID09PSA5XG4gIH1cblxuICBmdW5jdGlvbiBpc1dpbmRvdyhvYmopIHtcbiAgICAvLyBgb2JqID09PSB3aW5kb3dgIG9yIGBvYmogaW5zdGFuY2VvZiBXaW5kb3dgIGlzIG5vdCBzdWZmaWNpZW50LFxuICAgIC8vIGFzIHRoZSBvYmogbWF5IGJlIHRoZSB3aW5kb3cgb2YgYW4gaWZyYW1lLlxuICAgIHJldHVybiBvYmogJiYgb2JqLmRvY3VtZW50ICYmIGlzRG9jdW1lbnQob2JqLmRvY3VtZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdpbmRvd1Njcm9sbGVyKHdpbikge1xuICAgIHZhciBkb2MgPSB3aW4uZG9jdW1lbnQ7XG4gICAgdmFyIGJvZHkgPSBkb2MuYm9keTtcbiAgICB2YXIgaHRtbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLyoqXG4gICAgICAgKiBAc2VlIGh0dHA6Ly9qYW1lcy5wYWRvbHNleS5jb20vamF2YXNjcmlwdC9nZXQtZG9jdW1lbnQtaGVpZ2h0LWNyb3NzLWJyb3dzZXIvXG4gICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBzY3JvbGwgaGVpZ2h0IG9mIHRoZSBkb2N1bWVudCBpbiBwaXhlbHNcbiAgICAgICAqL1xuICAgICAgc2Nyb2xsSGVpZ2h0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KFxuICAgICAgICAgIGJvZHkuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgIGh0bWwuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgIGJvZHkub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgIGh0bWwub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgIGJvZHkuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgIGh0bWwuY2xpZW50SGVpZ2h0XG4gICAgICAgICk7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBzZWUgaHR0cDovL2FuZHlsYW5ndG9uLmNvLnVrL2Jsb2cvZGV2ZWxvcG1lbnQvZ2V0LXZpZXdwb3J0LXNpemUtd2lkdGgtYW5kLWhlaWdodC1qYXZhc2NyaXB0XG4gICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBoZWlnaHQgb2YgdGhlIHZpZXdwb3J0IGluIHBpeGVsc1xuICAgICAgICovXG4gICAgICBoZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd2luLmlubmVySGVpZ2h0IHx8IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0O1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBZIHNjcm9sbCBwb3NpdGlvblxuICAgICAgICogQHJldHVybiB7TnVtYmVyfSBwaXhlbHMgdGhlIHBhZ2UgaGFzIHNjcm9sbGVkIGFsb25nIHRoZSBZLWF4aXNcbiAgICAgICAqL1xuICAgICAgc2Nyb2xsWTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh3aW4ucGFnZVlPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKGh0bWwgfHwgYm9keS5wYXJlbnROb2RlIHx8IGJvZHkpLnNjcm9sbFRvcDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWxlbWVudFNjcm9sbGVyKGVsZW1lbnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLyoqXG4gICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBzY3JvbGwgaGVpZ2h0IG9mIHRoZSBlbGVtZW50IGluIHBpeGVsc1xuICAgICAgICovXG4gICAgICBzY3JvbGxIZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoXG4gICAgICAgICAgZWxlbWVudC5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgZWxlbWVudC5vZmZzZXRIZWlnaHQsXG4gICAgICAgICAgZWxlbWVudC5jbGllbnRIZWlnaHRcbiAgICAgICAgKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHJldHVybiB7TnVtYmVyfSB0aGUgaGVpZ2h0IG9mIHRoZSBlbGVtZW50IGluIHBpeGVsc1xuICAgICAgICovXG4gICAgICBoZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoZWxlbWVudC5vZmZzZXRIZWlnaHQsIGVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgWSBzY3JvbGwgcG9zaXRpb25cbiAgICAgICAqIEByZXR1cm4ge051bWJlcn0gcGl4ZWxzIHRoZSBlbGVtZW50IGhhcyBzY3JvbGxlZCBhbG9uZyB0aGUgWS1heGlzXG4gICAgICAgKi9cbiAgICAgIHNjcm9sbFk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNjcm9sbGVyKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gaXNXaW5kb3coZWxlbWVudCkgPyB3aW5kb3dTY3JvbGxlcihlbGVtZW50KSA6IGVsZW1lbnRTY3JvbGxlcihlbGVtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gZWxlbWVudCBFdmVudFRhcmdldFxuICAgKi9cbiAgZnVuY3Rpb24gdHJhY2tTY3JvbGwoZWxlbWVudCwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICB2YXIgaXNQYXNzaXZlU3VwcG9ydGVkID0gcGFzc2l2ZUV2ZW50c1N1cHBvcnRlZCgpO1xuICAgIHZhciByYWZJZDtcbiAgICB2YXIgc2Nyb2xsZWQgPSBmYWxzZTtcbiAgICB2YXIgc2Nyb2xsZXIgPSBjcmVhdGVTY3JvbGxlcihlbGVtZW50KTtcbiAgICB2YXIgbGFzdFNjcm9sbFkgPSBzY3JvbGxlci5zY3JvbGxZKCk7XG4gICAgdmFyIGRldGFpbHMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgIHZhciBzY3JvbGxZID0gTWF0aC5yb3VuZChzY3JvbGxlci5zY3JvbGxZKCkpO1xuICAgICAgdmFyIGhlaWdodCA9IHNjcm9sbGVyLmhlaWdodCgpO1xuICAgICAgdmFyIHNjcm9sbEhlaWdodCA9IHNjcm9sbGVyLnNjcm9sbEhlaWdodCgpO1xuXG4gICAgICAvLyByZXVzZSBvYmplY3QgZm9yIGxlc3MgbWVtb3J5IGNodXJuXG4gICAgICBkZXRhaWxzLnNjcm9sbFkgPSBzY3JvbGxZO1xuICAgICAgZGV0YWlscy5sYXN0U2Nyb2xsWSA9IGxhc3RTY3JvbGxZO1xuICAgICAgZGV0YWlscy5kaXJlY3Rpb24gPSBzY3JvbGxZID4gbGFzdFNjcm9sbFkgPyBcImRvd25cIiA6IFwidXBcIjtcbiAgICAgIGRldGFpbHMuZGlzdGFuY2UgPSBNYXRoLmFicyhzY3JvbGxZIC0gbGFzdFNjcm9sbFkpO1xuICAgICAgZGV0YWlscy5pc091dE9mQm91bmRzID0gc2Nyb2xsWSA8IDAgfHwgc2Nyb2xsWSArIGhlaWdodCA+IHNjcm9sbEhlaWdodDtcbiAgICAgIGRldGFpbHMudG9wID0gc2Nyb2xsWSA8PSBvcHRpb25zLm9mZnNldFtkZXRhaWxzLmRpcmVjdGlvbl07XG4gICAgICBkZXRhaWxzLmJvdHRvbSA9IHNjcm9sbFkgKyBoZWlnaHQgPj0gc2Nyb2xsSGVpZ2h0O1xuICAgICAgZGV0YWlscy50b2xlcmFuY2VFeGNlZWRlZCA9XG4gICAgICAgIGRldGFpbHMuZGlzdGFuY2UgPiBvcHRpb25zLnRvbGVyYW5jZVtkZXRhaWxzLmRpcmVjdGlvbl07XG5cbiAgICAgIGNhbGxiYWNrKGRldGFpbHMpO1xuXG4gICAgICBsYXN0U2Nyb2xsWSA9IHNjcm9sbFk7XG4gICAgICBzY3JvbGxlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVNjcm9sbCgpIHtcbiAgICAgIGlmICghc2Nyb2xsZWQpIHtcbiAgICAgICAgc2Nyb2xsZWQgPSB0cnVlO1xuICAgICAgICByYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBldmVudE9wdGlvbnMgPSBpc1Bhc3NpdmVTdXBwb3J0ZWRcbiAgICAgID8geyBwYXNzaXZlOiB0cnVlLCBjYXB0dXJlOiBmYWxzZSB9XG4gICAgICA6IGZhbHNlO1xuXG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIGhhbmRsZVNjcm9sbCwgZXZlbnRPcHRpb25zKTtcbiAgICB1cGRhdGUoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmSWQpO1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgaGFuZGxlU2Nyb2xsLCBldmVudE9wdGlvbnMpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVVcERvd24odCkge1xuICAgIHJldHVybiB0ID09PSBPYmplY3QodCkgPyB0IDogeyBkb3duOiB0LCB1cDogdCB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFVJIGVuaGFuY2VtZW50IGZvciBmaXhlZCBoZWFkZXJzLlxuICAgKiBIaWRlcyBoZWFkZXIgd2hlbiBzY3JvbGxpbmcgZG93blxuICAgKiBTaG93cyBoZWFkZXIgd2hlbiBzY3JvbGxpbmcgdXBcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7RE9NRWxlbWVudH0gZWxlbSB0aGUgaGVhZGVyIGVsZW1lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb3B0aW9ucyBmb3IgdGhlIHdpZGdldFxuICAgKi9cbiAgZnVuY3Rpb24gSGVhZHJvb20oZWxlbSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgSGVhZHJvb20ub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgdGhpcy5jbGFzc2VzID0gT2JqZWN0LmFzc2lnbih7fSwgSGVhZHJvb20ub3B0aW9ucy5jbGFzc2VzLCBvcHRpb25zLmNsYXNzZXMpO1xuXG4gICAgdGhpcy5lbGVtID0gZWxlbTtcbiAgICB0aGlzLnRvbGVyYW5jZSA9IG5vcm1hbGl6ZVVwRG93bih0aGlzLnRvbGVyYW5jZSk7XG4gICAgdGhpcy5vZmZzZXQgPSBub3JtYWxpemVVcERvd24odGhpcy5vZmZzZXQpO1xuICAgIHRoaXMuaW5pdGlhbGlzZWQgPSBmYWxzZTtcbiAgICB0aGlzLmZyb3plbiA9IGZhbHNlO1xuICB9XG4gIEhlYWRyb29tLnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogSGVhZHJvb20sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBsaXN0ZW5pbmcgdG8gc2Nyb2xsaW5nXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEhlYWRyb29tLmN1dHNUaGVNdXN0YXJkICYmICF0aGlzLmluaXRpYWxpc2VkKSB7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoXCJpbml0aWFsXCIpO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2VkID0gdHJ1ZTtcblxuICAgICAgICAvLyBkZWZlciBldmVudCByZWdpc3RyYXRpb24gdG8gaGFuZGxlIGJyb3dzZXJcbiAgICAgICAgLy8gcG90ZW50aWFsbHkgcmVzdG9yaW5nIHByZXZpb3VzIHNjcm9sbCBwb3NpdGlvblxuICAgICAgICBzZXRUaW1lb3V0KFxuICAgICAgICAgIGZ1bmN0aW9uKHNlbGYpIHtcbiAgICAgICAgICAgIHNlbGYuc2Nyb2xsVHJhY2tlciA9IHRyYWNrU2Nyb2xsKFxuICAgICAgICAgICAgICBzZWxmLnNjcm9sbGVyLFxuICAgICAgICAgICAgICB7IG9mZnNldDogc2VsZi5vZmZzZXQsIHRvbGVyYW5jZTogc2VsZi50b2xlcmFuY2UgfSxcbiAgICAgICAgICAgICAgc2VsZi51cGRhdGUuYmluZChzZWxmKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgICB0aGlzXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95IHRoZSB3aWRnZXQsIGNsZWFyaW5nIHVwIGFmdGVyIGl0c2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuaW5pdGlhbGlzZWQgPSBmYWxzZTtcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMuY2xhc3NlcykuZm9yRWFjaCh0aGlzLnJlbW92ZUNsYXNzLCB0aGlzKTtcbiAgICAgIHRoaXMuc2Nyb2xsVHJhY2tlci5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVucGluIHRoZSBlbGVtZW50XG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHVucGluOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmhhc0NsYXNzKFwicGlubmVkXCIpIHx8ICF0aGlzLmhhc0NsYXNzKFwidW5waW5uZWRcIikpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcyhcInVucGlubmVkXCIpO1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKFwicGlubmVkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLm9uVW5waW4pIHtcbiAgICAgICAgICB0aGlzLm9uVW5waW4uY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQaW4gdGhlIGVsZW1lbnRcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcGluOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmhhc0NsYXNzKFwidW5waW5uZWRcIikpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcyhcInBpbm5lZFwiKTtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcyhcInVucGlubmVkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLm9uUGluKSB7XG4gICAgICAgICAgdGhpcy5vblBpbi5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZyZWV6ZXMgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHdpZGdldFxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBmcmVlemU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5mcm96ZW4gPSB0cnVlO1xuICAgICAgdGhpcy5hZGRDbGFzcyhcImZyb3plblwiKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmUtZW5hYmxlcyB0aGUgZGVmYXVsdCBiZWhhdmlvdXIgb2YgdGhlIHdpZGdldFxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICB1bmZyZWV6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmZyb3plbiA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW1vdmVDbGFzcyhcImZyb3plblwiKTtcbiAgICB9LFxuXG4gICAgdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5oYXNDbGFzcyhcInRvcFwiKSkge1xuICAgICAgICB0aGlzLmFkZENsYXNzKFwidG9wXCIpO1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKFwibm90VG9wXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLm9uVG9wKSB7XG4gICAgICAgICAgdGhpcy5vblRvcC5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIG5vdFRvcDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuaGFzQ2xhc3MoXCJub3RUb3BcIikpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzcyhcIm5vdFRvcFwiKTtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzcyhcInRvcFwiKTtcblxuICAgICAgICBpZiAodGhpcy5vbk5vdFRvcCkge1xuICAgICAgICAgIHRoaXMub25Ob3RUb3AuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBib3R0b206IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmhhc0NsYXNzKFwiYm90dG9tXCIpKSB7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoXCJib3R0b21cIik7XG4gICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoXCJub3RCb3R0b21cIik7XG5cbiAgICAgICAgaWYgKHRoaXMub25Cb3R0b20pIHtcbiAgICAgICAgICB0aGlzLm9uQm90dG9tLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbm90Qm90dG9tOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5oYXNDbGFzcyhcIm5vdEJvdHRvbVwiKSkge1xuICAgICAgICB0aGlzLmFkZENsYXNzKFwibm90Qm90dG9tXCIpO1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKFwiYm90dG9tXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLm9uTm90Qm90dG9tKSB7XG4gICAgICAgICAgdGhpcy5vbk5vdEJvdHRvbS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHNob3VsZFVucGluOiBmdW5jdGlvbihkZXRhaWxzKSB7XG4gICAgICB2YXIgc2Nyb2xsaW5nRG93biA9IGRldGFpbHMuZGlyZWN0aW9uID09PSBcImRvd25cIjtcblxuICAgICAgcmV0dXJuIHNjcm9sbGluZ0Rvd24gJiYgIWRldGFpbHMudG9wICYmIGRldGFpbHMudG9sZXJhbmNlRXhjZWVkZWQ7XG4gICAgfSxcblxuICAgIHNob3VsZFBpbjogZnVuY3Rpb24oZGV0YWlscykge1xuICAgICAgdmFyIHNjcm9sbGluZ1VwID0gZGV0YWlscy5kaXJlY3Rpb24gPT09IFwidXBcIjtcblxuICAgICAgcmV0dXJuIChzY3JvbGxpbmdVcCAmJiBkZXRhaWxzLnRvbGVyYW5jZUV4Y2VlZGVkKSB8fCBkZXRhaWxzLnRvcDtcbiAgICB9LFxuXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgdGhpcy5lbGVtLmNsYXNzTGlzdC5hZGQuYXBwbHkoXG4gICAgICAgIHRoaXMuZWxlbS5jbGFzc0xpc3QsXG4gICAgICAgIHRoaXMuY2xhc3Nlc1tjbGFzc05hbWVdLnNwbGl0KFwiIFwiKVxuICAgICAgKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgdGhpcy5lbGVtLmNsYXNzTGlzdC5yZW1vdmUuYXBwbHkoXG4gICAgICAgIHRoaXMuZWxlbS5jbGFzc0xpc3QsXG4gICAgICAgIHRoaXMuY2xhc3Nlc1tjbGFzc05hbWVdLnNwbGl0KFwiIFwiKVxuICAgICAgKTtcbiAgICB9LFxuXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlc1tjbGFzc05hbWVdLnNwbGl0KFwiIFwiKS5ldmVyeShmdW5jdGlvbihjbHMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKGNscyk7XG4gICAgICB9LCB0aGlzLmVsZW0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGRldGFpbHMpIHtcbiAgICAgIGlmIChkZXRhaWxzLmlzT3V0T2ZCb3VuZHMpIHtcbiAgICAgICAgLy8gSWdub3JlIGJvdW5jeSBzY3JvbGxpbmcgaW4gT1NYXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZnJvemVuID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRldGFpbHMudG9wKSB7XG4gICAgICAgIHRoaXMudG9wKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5vdFRvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGV0YWlscy5ib3R0b20pIHtcbiAgICAgICAgdGhpcy5ib3R0b20oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubm90Qm90dG9tKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNob3VsZFVucGluKGRldGFpbHMpKSB7XG4gICAgICAgIHRoaXMudW5waW4oKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zaG91bGRQaW4oZGV0YWlscykpIHtcbiAgICAgICAgdGhpcy5waW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgb3B0aW9uc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgSGVhZHJvb20ub3B0aW9ucyA9IHtcbiAgICB0b2xlcmFuY2U6IHtcbiAgICAgIHVwOiAwLFxuICAgICAgZG93bjogMFxuICAgIH0sXG4gICAgb2Zmc2V0OiAwLFxuICAgIHNjcm9sbGVyOiBpc0Jyb3dzZXIoKSA/IHdpbmRvdyA6IG51bGwsXG4gICAgY2xhc3Nlczoge1xuICAgICAgZnJvemVuOiBcImhlYWRyb29tLS1mcm96ZW5cIixcbiAgICAgIHBpbm5lZDogXCJoZWFkcm9vbS0tcGlubmVkXCIsXG4gICAgICB1bnBpbm5lZDogXCJoZWFkcm9vbS0tdW5waW5uZWRcIixcbiAgICAgIHRvcDogXCJoZWFkcm9vbS0tdG9wXCIsXG4gICAgICBub3RUb3A6IFwiaGVhZHJvb20tLW5vdC10b3BcIixcbiAgICAgIGJvdHRvbTogXCJoZWFkcm9vbS0tYm90dG9tXCIsXG4gICAgICBub3RCb3R0b206IFwiaGVhZHJvb20tLW5vdC1ib3R0b21cIixcbiAgICAgIGluaXRpYWw6IFwiaGVhZHJvb21cIlxuICAgIH1cbiAgfTtcblxuICBIZWFkcm9vbS5jdXRzVGhlTXVzdGFyZCA9IGlzU3VwcG9ydGVkKCk7XG5cbiAgcmV0dXJuIEhlYWRyb29tO1xuXG59KSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59O1xuXG4vKipcclxuICogQ3JlYXRlZCBieSBTZXJnaXUgyJhhbmRvciAobWlja3U3enUpIG9uIDEvMjcvMjAxNy5cclxuICogT3JpZ2luYWwgaWRlYTogaHR0cHM6Ly9naXRodWIuY29tL2dpanNyb2dlL3RpbHQuanNcclxuICogTUlUIExpY2Vuc2UuXHJcbiAqIFZlcnNpb24gMS44LjFcclxuICovXG5cbnZhciBWYW5pbGxhVGlsdCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gVmFuaWxsYVRpbHQoZWxlbWVudCkge1xuICAgIHZhciBzZXR0aW5ncyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgVmFuaWxsYVRpbHQpO1xuXG4gICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpKSB7XG4gICAgICB0aHJvdyBcIkNhbid0IGluaXRpYWxpemUgVmFuaWxsYVRpbHQgYmVjYXVzZSBcIiArIGVsZW1lbnQgKyBcIiBpcyBub3QgYSBOb2RlLlwiO1xuICAgIH1cblxuICAgIHRoaXMud2lkdGggPSBudWxsO1xuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLmNsaWVudFdpZHRoID0gbnVsbDtcbiAgICB0aGlzLmNsaWVudEhlaWdodCA9IG51bGw7XG4gICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnRvcCA9IG51bGw7XG5cbiAgICAvLyBmb3IgR3lyb3Njb3BlIHNhbXBsaW5nXG4gICAgdGhpcy5nYW1tYXplcm8gPSBudWxsO1xuICAgIHRoaXMuYmV0YXplcm8gPSBudWxsO1xuICAgIHRoaXMubGFzdGdhbW1hemVybyA9IG51bGw7XG4gICAgdGhpcy5sYXN0YmV0YXplcm8gPSBudWxsO1xuXG4gICAgdGhpcy50cmFuc2l0aW9uVGltZW91dCA9IG51bGw7XG4gICAgdGhpcy51cGRhdGVDYWxsID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50ID0gbnVsbDtcblxuICAgIHRoaXMudXBkYXRlQmluZCA9IHRoaXMudXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXNldEJpbmQgPSB0aGlzLnJlc2V0LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLmV4dGVuZFNldHRpbmdzKHNldHRpbmdzKTtcblxuICAgIHRoaXMucmV2ZXJzZSA9IHRoaXMuc2V0dGluZ3MucmV2ZXJzZSA/IC0xIDogMTtcbiAgICB0aGlzLnJlc2V0VG9TdGFydCA9IFZhbmlsbGFUaWx0LmlzU2V0dGluZ1RydWUodGhpcy5zZXR0aW5nc1tcInJlc2V0LXRvLXN0YXJ0XCJdKTtcbiAgICB0aGlzLmdsYXJlID0gVmFuaWxsYVRpbHQuaXNTZXR0aW5nVHJ1ZSh0aGlzLnNldHRpbmdzLmdsYXJlKTtcbiAgICB0aGlzLmdsYXJlUHJlcmVuZGVyID0gVmFuaWxsYVRpbHQuaXNTZXR0aW5nVHJ1ZSh0aGlzLnNldHRpbmdzW1wiZ2xhcmUtcHJlcmVuZGVyXCJdKTtcbiAgICB0aGlzLmZ1bGxQYWdlTGlzdGVuaW5nID0gVmFuaWxsYVRpbHQuaXNTZXR0aW5nVHJ1ZSh0aGlzLnNldHRpbmdzW1wiZnVsbC1wYWdlLWxpc3RlbmluZ1wiXSk7XG4gICAgdGhpcy5neXJvc2NvcGUgPSBWYW5pbGxhVGlsdC5pc1NldHRpbmdUcnVlKHRoaXMuc2V0dGluZ3MuZ3lyb3Njb3BlKTtcbiAgICB0aGlzLmd5cm9zY29wZVNhbXBsZXMgPSB0aGlzLnNldHRpbmdzLmd5cm9zY29wZVNhbXBsZXM7XG5cbiAgICB0aGlzLmVsZW1lbnRMaXN0ZW5lciA9IHRoaXMuZ2V0RWxlbWVudExpc3RlbmVyKCk7XG5cbiAgICBpZiAodGhpcy5nbGFyZSkge1xuICAgICAgdGhpcy5wcmVwYXJlR2xhcmUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mdWxsUGFnZUxpc3RlbmluZykge1xuICAgICAgdGhpcy51cGRhdGVDbGllbnRTaXplKCk7XG4gICAgfVxuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMucmVzZXQoKTtcblxuICAgIGlmICh0aGlzLnJlc2V0VG9TdGFydCA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3RhcnRYID0gMDtcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3RhcnRZID0gMDtcbiAgICB9XG4gIH1cblxuICBWYW5pbGxhVGlsdC5pc1NldHRpbmdUcnVlID0gZnVuY3Rpb24gaXNTZXR0aW5nVHJ1ZShzZXR0aW5nKSB7XG4gICAgcmV0dXJuIHNldHRpbmcgPT09IFwiXCIgfHwgc2V0dGluZyA9PT0gdHJ1ZSB8fCBzZXR0aW5nID09PSAxO1xuICB9O1xuXG4gIC8qKlxyXG4gICAqIE1ldGhvZCByZXR1cm5zIGVsZW1lbnQgd2hhdCB3aWxsIGJlIGxpc3RlbiBtb3VzZSBldmVudHNcclxuICAgKiBAcmV0dXJuIHtOb2RlfVxyXG4gICAqL1xuXG5cbiAgVmFuaWxsYVRpbHQucHJvdG90eXBlLmdldEVsZW1lbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIGdldEVsZW1lbnRMaXN0ZW5lcigpIHtcbiAgICBpZiAodGhpcy5mdWxsUGFnZUxpc3RlbmluZykge1xuICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuc2V0dGluZ3NbXCJtb3VzZS1ldmVudC1lbGVtZW50XCJdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB2YXIgbW91c2VFdmVudEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2V0dGluZ3NbXCJtb3VzZS1ldmVudC1lbGVtZW50XCJdKTtcblxuICAgICAgaWYgKG1vdXNlRXZlbnRFbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBtb3VzZUV2ZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5nc1tcIm1vdXNlLWV2ZW50LWVsZW1lbnRcIl0gaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1tcIm1vdXNlLWV2ZW50LWVsZW1lbnRcIl07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgfTtcblxuICAvKipcclxuICAgKiBNZXRob2Qgc2V0IGxpc3RlbiBtZXRob2RzIGZvciB0aGlzLmVsZW1lbnRMaXN0ZW5lclxyXG4gICAqIEByZXR1cm4ge05vZGV9XHJcbiAgICovXG5cblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICB0aGlzLm9uTW91c2VFbnRlckJpbmQgPSB0aGlzLm9uTW91c2VFbnRlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25Nb3VzZU1vdmVCaW5kID0gdGhpcy5vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25Nb3VzZUxlYXZlQmluZCA9IHRoaXMub25Nb3VzZUxlYXZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldpbmRvd1Jlc2l6ZUJpbmQgPSB0aGlzLm9uV2luZG93UmVzaXplLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uQmluZCA9IHRoaXMub25EZXZpY2VPcmllbnRhdGlvbi5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5lbGVtZW50TGlzdGVuZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgdGhpcy5vbk1vdXNlRW50ZXJCaW5kKTtcbiAgICB0aGlzLmVsZW1lbnRMaXN0ZW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCB0aGlzLm9uTW91c2VMZWF2ZUJpbmQpO1xuICAgIHRoaXMuZWxlbWVudExpc3RlbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZUJpbmQpO1xuXG4gICAgaWYgKHRoaXMuZ2xhcmUgfHwgdGhpcy5mdWxsUGFnZUxpc3RlbmluZykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5vbldpbmRvd1Jlc2l6ZUJpbmQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmd5cm9zY29wZSkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJkZXZpY2VvcmllbnRhdGlvblwiLCB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb25CaW5kKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXHJcbiAgICogTWV0aG9kIHJlbW92ZSBldmVudCBsaXN0ZW5lcnMgZnJvbSBjdXJyZW50IHRoaXMuZWxlbWVudExpc3RlbmVyXHJcbiAgICovXG5cblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycygpIHtcbiAgICB0aGlzLmVsZW1lbnRMaXN0ZW5lci5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCB0aGlzLm9uTW91c2VFbnRlckJpbmQpO1xuICAgIHRoaXMuZWxlbWVudExpc3RlbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIHRoaXMub25Nb3VzZUxlYXZlQmluZCk7XG4gICAgdGhpcy5lbGVtZW50TGlzdGVuZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlQmluZCk7XG5cbiAgICBpZiAodGhpcy5neXJvc2NvcGUpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZGV2aWNlb3JpZW50YXRpb25cIiwgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uQmluZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2xhcmUgfHwgdGhpcy5mdWxsUGFnZUxpc3RlbmluZykge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5vbldpbmRvd1Jlc2l6ZUJpbmQpO1xuICAgIH1cbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudHJhbnNpdGlvblRpbWVvdXQpO1xuICAgIGlmICh0aGlzLnVwZGF0ZUNhbGwgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlQ2FsbCk7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLndpbGxDaGFuZ2UgPSBcIlwiO1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gXCJcIjtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gXCJcIjtcbiAgICB0aGlzLnJlc2V0R2xhcmUoKTtcblxuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmVsZW1lbnQudmFuaWxsYVRpbHQgPSBudWxsO1xuICAgIGRlbGV0ZSB0aGlzLmVsZW1lbnQudmFuaWxsYVRpbHQ7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICB9O1xuXG4gIFZhbmlsbGFUaWx0LnByb3RvdHlwZS5vbkRldmljZU9yaWVudGF0aW9uID0gZnVuY3Rpb24gb25EZXZpY2VPcmllbnRhdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC5nYW1tYSA9PT0gbnVsbCB8fCBldmVudC5iZXRhID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVFbGVtZW50UG9zaXRpb24oKTtcblxuICAgIGlmICh0aGlzLmd5cm9zY29wZVNhbXBsZXMgPiAwKSB7XG4gICAgICB0aGlzLmxhc3RnYW1tYXplcm8gPSB0aGlzLmdhbW1hemVybztcbiAgICAgIHRoaXMubGFzdGJldGF6ZXJvID0gdGhpcy5iZXRhemVybztcblxuICAgICAgaWYgKHRoaXMuZ2FtbWF6ZXJvID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuZ2FtbWF6ZXJvID0gZXZlbnQuZ2FtbWE7XG4gICAgICAgIHRoaXMuYmV0YXplcm8gPSBldmVudC5iZXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nYW1tYXplcm8gPSAoZXZlbnQuZ2FtbWEgKyB0aGlzLmxhc3RnYW1tYXplcm8pIC8gMjtcbiAgICAgICAgdGhpcy5iZXRhemVybyA9IChldmVudC5iZXRhICsgdGhpcy5sYXN0YmV0YXplcm8pIC8gMjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5neXJvc2NvcGVTYW1wbGVzIC09IDE7XG4gICAgfVxuXG4gICAgdmFyIHRvdGFsQW5nbGVYID0gdGhpcy5zZXR0aW5ncy5neXJvc2NvcGVNYXhBbmdsZVggLSB0aGlzLnNldHRpbmdzLmd5cm9zY29wZU1pbkFuZ2xlWDtcbiAgICB2YXIgdG90YWxBbmdsZVkgPSB0aGlzLnNldHRpbmdzLmd5cm9zY29wZU1heEFuZ2xlWSAtIHRoaXMuc2V0dGluZ3MuZ3lyb3Njb3BlTWluQW5nbGVZO1xuXG4gICAgdmFyIGRlZ3JlZXNQZXJQaXhlbFggPSB0b3RhbEFuZ2xlWCAvIHRoaXMud2lkdGg7XG4gICAgdmFyIGRlZ3JlZXNQZXJQaXhlbFkgPSB0b3RhbEFuZ2xlWSAvIHRoaXMuaGVpZ2h0O1xuXG4gICAgdmFyIGFuZ2xlWCA9IGV2ZW50LmdhbW1hIC0gKHRoaXMuc2V0dGluZ3MuZ3lyb3Njb3BlTWluQW5nbGVYICsgdGhpcy5nYW1tYXplcm8pO1xuICAgIHZhciBhbmdsZVkgPSBldmVudC5iZXRhIC0gKHRoaXMuc2V0dGluZ3MuZ3lyb3Njb3BlTWluQW5nbGVZICsgdGhpcy5iZXRhemVybyk7XG5cbiAgICB2YXIgcG9zWCA9IGFuZ2xlWCAvIGRlZ3JlZXNQZXJQaXhlbFg7XG4gICAgdmFyIHBvc1kgPSBhbmdsZVkgLyBkZWdyZWVzUGVyUGl4ZWxZO1xuXG4gICAgaWYgKHRoaXMudXBkYXRlQ2FsbCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy51cGRhdGVDYWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLmV2ZW50ID0ge1xuICAgICAgY2xpZW50WDogcG9zWCArIHRoaXMubGVmdCxcbiAgICAgIGNsaWVudFk6IHBvc1kgKyB0aGlzLnRvcFxuICAgIH07XG5cbiAgICB0aGlzLnVwZGF0ZUNhbGwgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy51cGRhdGVCaW5kKTtcbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUub25Nb3VzZUVudGVyID0gZnVuY3Rpb24gb25Nb3VzZUVudGVyKCkge1xuICAgIHRoaXMudXBkYXRlRWxlbWVudFBvc2l0aW9uKCk7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLndpbGxDaGFuZ2UgPSBcInRyYW5zZm9ybVwiO1xuICAgIHRoaXMuc2V0VHJhbnNpdGlvbigpO1xuICB9O1xuXG4gIFZhbmlsbGFUaWx0LnByb3RvdHlwZS5vbk1vdXNlTW92ZSA9IGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMudXBkYXRlQ2FsbCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy51cGRhdGVDYWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG4gICAgdGhpcy51cGRhdGVDYWxsID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlQmluZCk7XG4gIH07XG5cbiAgVmFuaWxsYVRpbHQucHJvdG90eXBlLm9uTW91c2VMZWF2ZSA9IGZ1bmN0aW9uIG9uTW91c2VMZWF2ZSgpIHtcbiAgICB0aGlzLnNldFRyYW5zaXRpb24oKTtcblxuICAgIGlmICh0aGlzLnNldHRpbmdzLnJlc2V0KSB7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5yZXNldEJpbmQpO1xuICAgIH1cbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcbiAgICB0aGlzLm9uTW91c2VFbnRlcigpO1xuXG4gICAgaWYgKHRoaXMuZnVsbFBhZ2VMaXN0ZW5pbmcpIHtcbiAgICAgIHRoaXMuZXZlbnQgPSB7XG4gICAgICAgIGNsaWVudFg6ICh0aGlzLnNldHRpbmdzLnN0YXJ0WCArIHRoaXMuc2V0dGluZ3MubWF4KSAvICgyICogdGhpcy5zZXR0aW5ncy5tYXgpICogdGhpcy5jbGllbnRXaWR0aCxcbiAgICAgICAgY2xpZW50WTogKHRoaXMuc2V0dGluZ3Muc3RhcnRZICsgdGhpcy5zZXR0aW5ncy5tYXgpIC8gKDIgKiB0aGlzLnNldHRpbmdzLm1heCkgKiB0aGlzLmNsaWVudEhlaWdodFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ldmVudCA9IHtcbiAgICAgICAgY2xpZW50WDogdGhpcy5sZWZ0ICsgKHRoaXMuc2V0dGluZ3Muc3RhcnRYICsgdGhpcy5zZXR0aW5ncy5tYXgpIC8gKDIgKiB0aGlzLnNldHRpbmdzLm1heCkgKiB0aGlzLndpZHRoLFxuICAgICAgICBjbGllbnRZOiB0aGlzLnRvcCArICh0aGlzLnNldHRpbmdzLnN0YXJ0WSArIHRoaXMuc2V0dGluZ3MubWF4KSAvICgyICogdGhpcy5zZXR0aW5ncy5tYXgpICogdGhpcy5oZWlnaHRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGJhY2t1cFNjYWxlID0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICB0aGlzLnNldHRpbmdzLnNjYWxlID0gMTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIHRoaXMuc2V0dGluZ3Muc2NhbGUgPSBiYWNrdXBTY2FsZTtcbiAgICB0aGlzLnJlc2V0R2xhcmUoKTtcbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUucmVzZXRHbGFyZSA9IGZ1bmN0aW9uIHJlc2V0R2xhcmUoKSB7XG4gICAgaWYgKHRoaXMuZ2xhcmUpIHtcbiAgICAgIHRoaXMuZ2xhcmVFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IFwicm90YXRlKDE4MGRlZykgdHJhbnNsYXRlKC01MCUsIC01MCUpXCI7XG4gICAgICB0aGlzLmdsYXJlRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgfVxuICB9O1xuXG4gIFZhbmlsbGFUaWx0LnByb3RvdHlwZS5nZXRWYWx1ZXMgPSBmdW5jdGlvbiBnZXRWYWx1ZXMoKSB7XG4gICAgdmFyIHggPSB2b2lkIDAsXG4gICAgICAgIHkgPSB2b2lkIDA7XG5cbiAgICBpZiAodGhpcy5mdWxsUGFnZUxpc3RlbmluZykge1xuICAgICAgeCA9IHRoaXMuZXZlbnQuY2xpZW50WCAvIHRoaXMuY2xpZW50V2lkdGg7XG4gICAgICB5ID0gdGhpcy5ldmVudC5jbGllbnRZIC8gdGhpcy5jbGllbnRIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSAodGhpcy5ldmVudC5jbGllbnRYIC0gdGhpcy5sZWZ0KSAvIHRoaXMud2lkdGg7XG4gICAgICB5ID0gKHRoaXMuZXZlbnQuY2xpZW50WSAtIHRoaXMudG9wKSAvIHRoaXMuaGVpZ2h0O1xuICAgIH1cblxuICAgIHggPSBNYXRoLm1pbihNYXRoLm1heCh4LCAwKSwgMSk7XG4gICAgeSA9IE1hdGgubWluKE1hdGgubWF4KHksIDApLCAxKTtcblxuICAgIHZhciB0aWx0WCA9ICh0aGlzLnJldmVyc2UgKiAodGhpcy5zZXR0aW5ncy5tYXggLSB4ICogdGhpcy5zZXR0aW5ncy5tYXggKiAyKSkudG9GaXhlZCgyKTtcbiAgICB2YXIgdGlsdFkgPSAodGhpcy5yZXZlcnNlICogKHkgKiB0aGlzLnNldHRpbmdzLm1heCAqIDIgLSB0aGlzLnNldHRpbmdzLm1heCkpLnRvRml4ZWQoMik7XG4gICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMih0aGlzLmV2ZW50LmNsaWVudFggLSAodGhpcy5sZWZ0ICsgdGhpcy53aWR0aCAvIDIpLCAtKHRoaXMuZXZlbnQuY2xpZW50WSAtICh0aGlzLnRvcCArIHRoaXMuaGVpZ2h0IC8gMikpKSAqICgxODAgLyBNYXRoLlBJKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0aWx0WDogdGlsdFgsXG4gICAgICB0aWx0WTogdGlsdFksXG4gICAgICBwZXJjZW50YWdlWDogeCAqIDEwMCxcbiAgICAgIHBlcmNlbnRhZ2VZOiB5ICogMTAwLFxuICAgICAgYW5nbGU6IGFuZ2xlXG4gICAgfTtcbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUudXBkYXRlRWxlbWVudFBvc2l0aW9uID0gZnVuY3Rpb24gdXBkYXRlRWxlbWVudFBvc2l0aW9uKCkge1xuICAgIHZhciByZWN0ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgdGhpcy53aWR0aCA9IHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgdGhpcy5sZWZ0ID0gcmVjdC5sZWZ0O1xuICAgIHRoaXMudG9wID0gcmVjdC50b3A7XG4gIH07XG5cbiAgVmFuaWxsYVRpbHQucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5nZXRWYWx1ZXMoKTtcblxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBcInBlcnNwZWN0aXZlKFwiICsgdGhpcy5zZXR0aW5ncy5wZXJzcGVjdGl2ZSArIFwicHgpIFwiICsgXCJyb3RhdGVYKFwiICsgKHRoaXMuc2V0dGluZ3MuYXhpcyA9PT0gXCJ4XCIgPyAwIDogdmFsdWVzLnRpbHRZKSArIFwiZGVnKSBcIiArIFwicm90YXRlWShcIiArICh0aGlzLnNldHRpbmdzLmF4aXMgPT09IFwieVwiID8gMCA6IHZhbHVlcy50aWx0WCkgKyBcImRlZykgXCIgKyBcInNjYWxlM2QoXCIgKyB0aGlzLnNldHRpbmdzLnNjYWxlICsgXCIsIFwiICsgdGhpcy5zZXR0aW5ncy5zY2FsZSArIFwiLCBcIiArIHRoaXMuc2V0dGluZ3Muc2NhbGUgKyBcIilcIjtcblxuICAgIGlmICh0aGlzLmdsYXJlKSB7XG4gICAgICB0aGlzLmdsYXJlRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBcInJvdGF0ZShcIiArIHZhbHVlcy5hbmdsZSArIFwiZGVnKSB0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIjtcbiAgICAgIHRoaXMuZ2xhcmVFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIlwiICsgdmFsdWVzLnBlcmNlbnRhZ2VZICogdGhpcy5zZXR0aW5nc1tcIm1heC1nbGFyZVwiXSAvIDEwMDtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ0aWx0Q2hhbmdlXCIsIHtcbiAgICAgIFwiZGV0YWlsXCI6IHZhbHVlc1xuICAgIH0pKTtcblxuICAgIHRoaXMudXBkYXRlQ2FsbCA9IG51bGw7XG4gIH07XG5cbiAgLyoqXHJcbiAgICogQXBwZW5kcyB0aGUgZ2xhcmUgZWxlbWVudCAoaWYgZ2xhcmVQcmVyZW5kZXIgZXF1YWxzIGZhbHNlKVxyXG4gICAqIGFuZCBzZXRzIHRoZSBkZWZhdWx0IHN0eWxlXHJcbiAgICovXG5cblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUucHJlcGFyZUdsYXJlID0gZnVuY3Rpb24gcHJlcGFyZUdsYXJlKCkge1xuICAgIC8vIElmIG9wdGlvbiBwcmUtcmVuZGVyIGlzIGVuYWJsZWQgd2UgYXNzdW1lIGFsbCBodG1sL2NzcyBpcyBwcmVzZW50IGZvciBhbiBvcHRpbWFsIGdsYXJlIGVmZmVjdC5cbiAgICBpZiAoIXRoaXMuZ2xhcmVQcmVyZW5kZXIpIHtcbiAgICAgIC8vIENyZWF0ZSBnbGFyZSBlbGVtZW50XG4gICAgICB2YXIganNUaWx0R2xhcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAganNUaWx0R2xhcmUuY2xhc3NMaXN0LmFkZChcImpzLXRpbHQtZ2xhcmVcIik7XG5cbiAgICAgIHZhciBqc1RpbHRHbGFyZUlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGpzVGlsdEdsYXJlSW5uZXIuY2xhc3NMaXN0LmFkZChcImpzLXRpbHQtZ2xhcmUtaW5uZXJcIik7XG5cbiAgICAgIGpzVGlsdEdsYXJlLmFwcGVuZENoaWxkKGpzVGlsdEdsYXJlSW5uZXIpO1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGpzVGlsdEdsYXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsYXJlRWxlbWVudFdyYXBwZXIgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5qcy10aWx0LWdsYXJlXCIpO1xuICAgIHRoaXMuZ2xhcmVFbGVtZW50ID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanMtdGlsdC1nbGFyZS1pbm5lclwiKTtcblxuICAgIGlmICh0aGlzLmdsYXJlUHJlcmVuZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmdsYXJlRWxlbWVudFdyYXBwZXIuc3R5bGUsIHtcbiAgICAgIFwicG9zaXRpb25cIjogXCJhYnNvbHV0ZVwiLFxuICAgICAgXCJ0b3BcIjogXCIwXCIsXG4gICAgICBcImxlZnRcIjogXCIwXCIsXG4gICAgICBcIndpZHRoXCI6IFwiMTAwJVwiLFxuICAgICAgXCJoZWlnaHRcIjogXCIxMDAlXCIsXG4gICAgICBcIm92ZXJmbG93XCI6IFwiaGlkZGVuXCIsXG4gICAgICBcInBvaW50ZXItZXZlbnRzXCI6IFwibm9uZVwiLFxuICAgICAgXCJib3JkZXItcmFkaXVzXCI6IFwiaW5oZXJpdFwiXG4gICAgfSk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuZ2xhcmVFbGVtZW50LnN0eWxlLCB7XG4gICAgICBcInBvc2l0aW9uXCI6IFwiYWJzb2x1dGVcIixcbiAgICAgIFwidG9wXCI6IFwiNTAlXCIsXG4gICAgICBcImxlZnRcIjogXCI1MCVcIixcbiAgICAgIFwicG9pbnRlci1ldmVudHNcIjogXCJub25lXCIsXG4gICAgICBcImJhY2tncm91bmQtaW1hZ2VcIjogXCJsaW5lYXItZ3JhZGllbnQoMGRlZywgcmdiYSgyNTUsMjU1LDI1NSwwKSAwJSwgcmdiYSgyNTUsMjU1LDI1NSwxKSAxMDAlKVwiLFxuICAgICAgXCJ0cmFuc2Zvcm1cIjogXCJyb3RhdGUoMTgwZGVnKSB0cmFuc2xhdGUoLTUwJSwgLTUwJSlcIixcbiAgICAgIFwidHJhbnNmb3JtLW9yaWdpblwiOiBcIjAlIDAlXCIsXG4gICAgICBcIm9wYWNpdHlcIjogXCIwXCJcbiAgICB9KTtcblxuICAgIHRoaXMudXBkYXRlR2xhcmVTaXplKCk7XG4gIH07XG5cbiAgVmFuaWxsYVRpbHQucHJvdG90eXBlLnVwZGF0ZUdsYXJlU2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZUdsYXJlU2l6ZSgpIHtcbiAgICBpZiAodGhpcy5nbGFyZSkge1xuICAgICAgdmFyIGdsYXJlU2l6ZSA9ICh0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGggPiB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0ID8gdGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoIDogdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodCkgKiAyO1xuXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuZ2xhcmVFbGVtZW50LnN0eWxlLCB7XG4gICAgICAgIFwid2lkdGhcIjogZ2xhcmVTaXplICsgXCJweFwiLFxuICAgICAgICBcImhlaWdodFwiOiBnbGFyZVNpemUgKyBcInB4XCJcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUudXBkYXRlQ2xpZW50U2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZUNsaWVudFNpemUoKSB7XG4gICAgdGhpcy5jbGllbnRXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuXG4gICAgdGhpcy5jbGllbnRIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodDtcbiAgfTtcblxuICBWYW5pbGxhVGlsdC5wcm90b3R5cGUub25XaW5kb3dSZXNpemUgPSBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSgpIHtcbiAgICB0aGlzLnVwZGF0ZUdsYXJlU2l6ZSgpO1xuICAgIHRoaXMudXBkYXRlQ2xpZW50U2l6ZSgpO1xuICB9O1xuXG4gIFZhbmlsbGFUaWx0LnByb3RvdHlwZS5zZXRUcmFuc2l0aW9uID0gZnVuY3Rpb24gc2V0VHJhbnNpdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudHJhbnNpdGlvblRpbWVvdXQpO1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gdGhpcy5zZXR0aW5ncy5zcGVlZCArIFwibXMgXCIgKyB0aGlzLnNldHRpbmdzLmVhc2luZztcbiAgICBpZiAodGhpcy5nbGFyZSkgdGhpcy5nbGFyZUVsZW1lbnQuc3R5bGUudHJhbnNpdGlvbiA9IFwib3BhY2l0eSBcIiArIHRoaXMuc2V0dGluZ3Muc3BlZWQgKyBcIm1zIFwiICsgdGhpcy5zZXR0aW5ncy5lYXNpbmc7XG5cbiAgICB0aGlzLnRyYW5zaXRpb25UaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zaXRpb24gPSBcIlwiO1xuICAgICAgaWYgKF90aGlzLmdsYXJlKSB7XG4gICAgICAgIF90aGlzLmdsYXJlRWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gXCJcIjtcbiAgICAgIH1cbiAgICB9LCB0aGlzLnNldHRpbmdzLnNwZWVkKTtcbiAgfTtcblxuICAvKipcclxuICAgKiBNZXRob2QgcmV0dXJuIHBhdGNoZWQgc2V0dGluZ3Mgb2YgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldHRpbmdzLnJldmVyc2UgLSByZXZlcnNlIHRoZSB0aWx0IGRpcmVjdGlvblxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZXR0aW5ncy5tYXggLSBtYXggdGlsdCByb3RhdGlvbiAoZGVncmVlcylcclxuICAgKiBAcGFyYW0ge3N0YXJ0WH0gc2V0dGluZ3Muc3RhcnRYIC0gdGhlIHN0YXJ0aW5nIHRpbHQgb24gdGhlIFggYXhpcywgaW4gZGVncmVlcy4gRGVmYXVsdDogMFxyXG4gICAqIEBwYXJhbSB7c3RhcnRZfSBzZXR0aW5ncy5zdGFydFkgLSB0aGUgc3RhcnRpbmcgdGlsdCBvbiB0aGUgWSBheGlzLCBpbiBkZWdyZWVzLiBEZWZhdWx0OiAwXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNldHRpbmdzLnBlcnNwZWN0aXZlIC0gVHJhbnNmb3JtIHBlcnNwZWN0aXZlLCB0aGUgbG93ZXIgdGhlIG1vcmUgZXh0cmVtZSB0aGUgdGlsdCBnZXRzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdzLmVhc2luZyAtIEVhc2luZyBvbiBlbnRlci9leGl0XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNldHRpbmdzLnNjYWxlIC0gMiA9IDIwMCUsIDEuNSA9IDE1MCUsIGV0Yy4uXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNldHRpbmdzLnNwZWVkIC0gU3BlZWQgb2YgdGhlIGVudGVyL2V4aXQgdHJhbnNpdGlvblxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0dGluZ3MudHJhbnNpdGlvbiAtIFNldCBhIHRyYW5zaXRpb24gb24gZW50ZXIvZXhpdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IHNldHRpbmdzLmF4aXMgLSBXaGF0IGF4aXMgc2hvdWxkIGJlIGVuYWJsZWQuIENhbiBiZSBcInhcIiBvciBcInlcIlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0dGluZ3MuZ2xhcmUgLSBpZiBpdCBzaG91bGQgaGF2ZSBhIFwiZ2xhcmVcIiBlZmZlY3RcclxuICAgKiBAcGFyYW0ge251bWJlcn0gc2V0dGluZ3MubWF4LWdsYXJlIC0gdGhlIG1heGltdW0gXCJnbGFyZVwiIG9wYWNpdHkgKDEgPSAxMDAlLCAwLjUgPSA1MCUpXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXR0aW5ncy5nbGFyZS1wcmVyZW5kZXIgLSBmYWxzZSA9IFZhbmlsbGFUaWx0IGNyZWF0ZXMgdGhlIGdsYXJlIGVsZW1lbnRzIGZvciB5b3UsIG90aGVyd2lzZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0dGluZ3MuZnVsbC1wYWdlLWxpc3RlbmluZyAtIElmIHRydWUsIHBhcmFsbGF4IGVmZmVjdCB3aWxsIGxpc3RlbiB0byBtb3VzZSBtb3ZlIGV2ZW50cyBvbiB0aGUgd2hvbGUgZG9jdW1lbnQsIG5vdCBvbmx5IHRoZSBzZWxlY3RlZCBlbGVtZW50XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBzZXR0aW5ncy5tb3VzZS1ldmVudC1lbGVtZW50IC0gU3RyaW5nIHNlbGVjdG9yIG9yIGxpbmsgdG8gSFRNTC1lbGVtZW50IHdoYXQgd2lsbCBiZSBsaXN0ZW4gbW91c2UgZXZlbnRzXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXR0aW5ncy5yZXNldCAtIGZhbHNlID0gSWYgdGhlIHRpbHQgZWZmZWN0IGhhcyB0byBiZSByZXNldCBvbiBleGl0XHJcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXR0aW5ncy5yZXNldC10by1zdGFydCAtIHRydWUgPSBPbiByZXNldCBldmVudCAobW91c2UgbGVhdmUpIHdpbGwgcmV0dXJuIHRvIGluaXRpYWwgc3RhcnQgYW5nbGUgKGlmIHN0YXJ0WCBvciBzdGFydFkgaXMgc2V0KVxyXG4gICAqIEBwYXJhbSB7Z3lyb3Njb3BlfSBzZXR0aW5ncy5neXJvc2NvcGUgLSBFbmFibGUgdGlsdGluZyBieSBkZXZpY2VvcmllbnRhdGlvbiBldmVudHNcclxuICAgKiBAcGFyYW0ge2d5cm9zY29wZVNlbnNpdGl2aXR5fSBzZXR0aW5ncy5neXJvc2NvcGVTZW5zaXRpdml0eSAtIEJldHdlZW4gMCBhbmQgMSAtIFRoZSBhbmdsZSBhdCB3aGljaCBtYXggdGlsdCBwb3NpdGlvbiBpcyByZWFjaGVkLiAxID0gOTBkZWcsIDAuNSA9IDQ1ZGVnLCBldGMuLlxyXG4gICAqIEBwYXJhbSB7Z3lyb3Njb3BlU2FtcGxlc30gc2V0dGluZ3MuZ3lyb3Njb3BlU2FtcGxlcyAtIEhvdyBtYW55IGd5cm9zY29wZSBtb3ZlcyB0byBkZWNpZGUgdGhlIHN0YXJ0aW5nIHBvc2l0aW9uLlxyXG4gICAqL1xuXG5cbiAgVmFuaWxsYVRpbHQucHJvdG90eXBlLmV4dGVuZFNldHRpbmdzID0gZnVuY3Rpb24gZXh0ZW5kU2V0dGluZ3Moc2V0dGluZ3MpIHtcbiAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgcmV2ZXJzZTogZmFsc2UsXG4gICAgICBtYXg6IDE1LFxuICAgICAgc3RhcnRYOiAwLFxuICAgICAgc3RhcnRZOiAwLFxuICAgICAgcGVyc3BlY3RpdmU6IDEwMDAsXG4gICAgICBlYXNpbmc6IFwiY3ViaWMtYmV6aWVyKC4wMywuOTgsLjUyLC45OSlcIixcbiAgICAgIHNjYWxlOiAxLFxuICAgICAgc3BlZWQ6IDMwMCxcbiAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICBheGlzOiBudWxsLFxuICAgICAgZ2xhcmU6IGZhbHNlLFxuICAgICAgXCJtYXgtZ2xhcmVcIjogMSxcbiAgICAgIFwiZ2xhcmUtcHJlcmVuZGVyXCI6IGZhbHNlLFxuICAgICAgXCJmdWxsLXBhZ2UtbGlzdGVuaW5nXCI6IGZhbHNlLFxuICAgICAgXCJtb3VzZS1ldmVudC1lbGVtZW50XCI6IG51bGwsXG4gICAgICByZXNldDogdHJ1ZSxcbiAgICAgIFwicmVzZXQtdG8tc3RhcnRcIjogdHJ1ZSxcbiAgICAgIGd5cm9zY29wZTogdHJ1ZSxcbiAgICAgIGd5cm9zY29wZU1pbkFuZ2xlWDogLTQ1LFxuICAgICAgZ3lyb3Njb3BlTWF4QW5nbGVYOiA0NSxcbiAgICAgIGd5cm9zY29wZU1pbkFuZ2xlWTogLTQ1LFxuICAgICAgZ3lyb3Njb3BlTWF4QW5nbGVZOiA0NSxcbiAgICAgIGd5cm9zY29wZVNhbXBsZXM6IDEwXG4gICAgfTtcblxuICAgIHZhciBuZXdTZXR0aW5ncyA9IHt9O1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIGRlZmF1bHRTZXR0aW5ncykge1xuICAgICAgaWYgKHByb3BlcnR5IGluIHNldHRpbmdzKSB7XG4gICAgICAgIG5ld1NldHRpbmdzW3Byb3BlcnR5XSA9IHNldHRpbmdzW3Byb3BlcnR5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5lbGVtZW50Lmhhc0F0dHJpYnV0ZShcImRhdGEtdGlsdC1cIiArIHByb3BlcnR5KSkge1xuICAgICAgICB2YXIgYXR0cmlidXRlID0gdGhpcy5lbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtdGlsdC1cIiArIHByb3BlcnR5KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBuZXdTZXR0aW5nc1twcm9wZXJ0eV0gPSBKU09OLnBhcnNlKGF0dHJpYnV0ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBuZXdTZXR0aW5nc1twcm9wZXJ0eV0gPSBhdHRyaWJ1dGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1NldHRpbmdzW3Byb3BlcnR5XSA9IGRlZmF1bHRTZXR0aW5nc1twcm9wZXJ0eV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1NldHRpbmdzO1xuICB9O1xuXG4gIFZhbmlsbGFUaWx0LmluaXQgPSBmdW5jdGlvbiBpbml0KGVsZW1lbnRzLCBzZXR0aW5ncykge1xuICAgIGlmIChlbGVtZW50cyBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgIGVsZW1lbnRzID0gW2VsZW1lbnRzXTtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudHMgaW5zdGFuY2VvZiBOb2RlTGlzdCkge1xuICAgICAgZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICBpZiAoIShlbGVtZW50cyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgIGlmICghKFwidmFuaWxsYVRpbHRcIiBpbiBlbGVtZW50KSkge1xuICAgICAgICBlbGVtZW50LnZhbmlsbGFUaWx0ID0gbmV3IFZhbmlsbGFUaWx0KGVsZW1lbnQsIHNldHRpbmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gVmFuaWxsYVRpbHQ7XG59KCk7XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgLyogZXhwb3NlIHRoZSBjbGFzcyB0byB3aW5kb3cgKi9cbiAgd2luZG93LlZhbmlsbGFUaWx0ID0gVmFuaWxsYVRpbHQ7XG5cbiAgLyoqXHJcbiAgICogQXV0byBsb2FkXHJcbiAgICovXG4gIFZhbmlsbGFUaWx0LmluaXQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLXRpbHRdXCIpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWYW5pbGxhVGlsdDtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgSGVhZHJvb20gZnJvbSBcImhlYWRyb29tLmpzXCI7XHJcblxyXG52YXIgbXlFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImhlYWRlclwiKTtcclxuXHJcbnZhciBoZWFkcm9vbSA9IG5ldyBIZWFkcm9vbShteUVsZW1lbnQpO1xyXG5cclxuaGVhZHJvb20uaW5pdCgpO1xyXG5cclxuaW1wb3J0IFZhbmlsbGFUaWx0IGZyb20gXCJ2YW5pbGxhLXRpbHRcIjtcclxuXHJcbmZ1bmN0aW9uIHZhbmlsbGFUaWx0KGl0ZW0sIG1heCwgc3BlZWQpIHtcclxuXHRsZXQgaXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGl0ZW0pXHJcblx0VmFuaWxsYVRpbHQuaW5pdCgoaXRlbXMpLCB7bWF4OiBtYXgsIHNwZWVkOiBzcGVlZH0pO1xyXG59XHJcblxyXG52YW5pbGxhVGlsdCgnLmluc3RhbGxhdGlvbl9fcmlnaHQnLCAxLCAyMDAwKTtcclxuXHJcbiJdLCJuYW1lcyI6WyJIZWFkcm9vbSIsIm15RWxlbWVudCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsImhlYWRyb29tIiwiaW5pdCIsIlZhbmlsbGFUaWx0IiwidmFuaWxsYVRpbHQiLCJpdGVtIiwibWF4Iiwic3BlZWQiLCJpdGVtcyIsInF1ZXJ5U2VsZWN0b3JBbGwiXSwic291cmNlUm9vdCI6IiJ9