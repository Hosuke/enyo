﻿/**
enyo.Scroller is scroller suitable for use in both desktop and mobile applications.

In some mobile environments, a default scrolling solution is not implemented for dom elements. In these cases, enyo.Scroller implements
a touch based scrolling solution. This can be opted into either globally by setting the flag enyo.Scroller.touchScrolling = true;
or on a per instance basis by specifying a strategyKind of "TouchScrollStrategy."
*/
enyo.kind({
	name: "enyo.Scroller",
	published: {
		/**
			Specifies how to horizontally scroll. Acceptable values are "scroll", "auto," "hidden," and "default" The precise
			effect of the setting is determined by the scroll strategy.
		*/
		horizontal: "default",
		/**
			Specifies how to vertically scroll. Acceptable values are "scroll", "auto," "hidden," and "default" The precise
			effect of the setting is determined by the scroll strategy.
		*/
		vertical: "default",
		/**
			Sets the vertical scroll position.
		*/
		scrollTop: 0,
		/**
			Sets the horizontal scroll position.
		*/
		scrollLeft: 0,
		/**
			Sets the maximum height of the scroll content.
		*/
		maxHeight: null,
		/**
			Set to true to make this scroller select a platform appropriate touch based scrolling strategy.
			Please note that specifycing a scrollStrategy will take precedence over this setting.
		*/
		touch: false,
		/**
			Specify a type of scrolling. The enyo Scroller will attempt to automatically select 
			a strategy compatbile with the runtime environment. A specific strategy can also be chosen:

			* <a href="#enyo.ScrollStrategy">ScrollStrategy</a> is the default and implements no scrolling, relying instead on the environment to scroll properly.
			* <a href="#enyo.TouchScrollStrategy">TouchScrollStrategy</a> implements a touch scrolling mechanism.
			* <a href="#enyo.TranslateScrollStrategy">TranslateScrollStrategy</a> implements a touch scrolling mechanism using translations, recommended only for Android 3 and 4 currently.
		*/
		strategyKind: "ScrollStrategy",
		//* set to true to display a scroll thumb in Touch scrollers.
		thumb: true
	},
	events: {
		onScrollStart: "",
		onScroll: "",
		onScrollStop: ""
	},
	handlers: {
		onscroll: "scroll"
	},
	classes: "enyo-scroller",
	/**
		If true, the scroller will not propagate dragstart events that cause it to start scrolling (defaults to true)
	*/
	preventDragPropagation: true,
	//* @protected
	statics: {
		osInfo: [
			{os: "android", version: 3},
			{os: "ios", version: 5},
			{os: "webos", version: 1e9}
		],
		//* returns true if platform should have touch events
		hasTouchScrolling: function() {
			for (var i=0, t, m; t=this.osInfo[i]; i++) {
				if (enyo.platform[t.os]) {
					return true;
				}
			}
		},
		//* returns true if the platform has native div scrollers, desktop browsers always have them
		hasNativeScrolling: function() {
			for (var i=0, t, m; t=this.osInfo[i]; i++) {
				if (enyo.platform[t.os] < t.version) {
					return false;
				}
			}
			return true;
		},
		getTouchStrategy: function() {
			return enyo.platform.android >= 3 ? "TranslateScrollStrategy" : "TouchScrollStrategy";
		}
	},
	//* @protected
	controlParentName: "strategy",
	create: function() {
		this.inherited(arguments);
		this.horizontalChanged();
		this.verticalChanged();
	},
	importProps: function(inProps) {
		this.inherited(arguments);
		// allow global overriding of strategy kind
		if (inProps && inProps.strategyKind === undefined && (enyo.Scroller.touchScrolling || this.touch)) {
			this.strategyKind = enyo.Scroller.getTouchStrategy();
		}
	},
	initComponents: function() {
		this.strategyKindChanged();
		this.inherited(arguments);
	},
	teardownChildren: function() {
		this.cacheScrollPosition();
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		this.restoreScrollPosition();
	},
	strategyKindChanged: function() {
		if (this.$.strategy) {
			this.$.strategy.destroy();
			this.controlParent = null;
		}
		// note: createComponents automatically updates controlParent.
		this.createComponents([{name: "strategy", maxHeight: this.maxHeight, kind: this.strategyKind, thumb: this.thumb, preventDragPropagation: this.preventDragPropagation, isChrome: true}]);
		if (this.hasNode()) {
			this.render();
		}
	},
	maxHeightChanged: function() {
		this.$.strategy.setMaxHeight(this.maxHeight);
	},
	showingChanged: function() {
		if (!this.showing) {
			this.cacheScrollPosition();
			this.setScrollLeft(0);
			this.setScrollTop(0);
		}
		this.inherited(arguments);
		if (this.showing) {
			this.restoreScrollPosition();
		}
	},
	thumbChanged: function() {
		this.$.strategy.setThumb(this.thumb);
	},
	cacheScrollPosition: function() {
		this.cachedPosition = {left: this.getScrollLeft(), top: this.getScrollTop()};
	},
	restoreScrollPosition: function() {
		if (this.cachedPosition) {
			this.setScrollLeft(this.cachedPosition.left);
			this.setScrollTop(this.cachedPosition.top);
			this.cachedPosition = null;
		}
	},
	horizontalChanged: function() {
		this.$.strategy.setHorizontal(this.horizontal);
	},
	verticalChanged: function() {
		this.$.strategy.setVertical(this.vertical);
	},
	// FIXME: these properties are virtual; property changed methods are fired only if 
	// property value changes, not if getter changes.
	setScrollLeft: function(inLeft) {
		this.scrollLeft = inLeft;
		this.$.strategy.setScrollLeft(this.scrollLeft);
	},
	setScrollTop: function(inTop) {
		this.scrollTop = inTop;
		this.$.strategy.setScrollTop(inTop);
	},
	getScrollLeft: function() {
		return this.$.strategy.getScrollLeft();
	},
	getScrollTop: function() {
		return this.$.strategy.getScrollTop();
	},
	//* @public
	//* returns an object describing the scroll boundaries with height and width properties.
	getScrollBounds: function() {
		return this.$.strategy.getScrollBounds();
	},
	//* scrolls the given control (inControl) into view. If inAlignWithTop is true, inControl is aligned with the top of the scroller.
	scrollIntoView: function(inControl, inAlignWithTop) {
		this.$.strategy.scrollIntoView(inControl, inAlignWithTop);
	},
	//* Scroll to the position given by inX and inY in pixel units.
	scrollTo: function(inX, inY) {
		this.$.strategy.scrollTo(inX, inY);
	},
	//* ensure that the given control is visible in the scroller's viewport.  Unlike scrollIntoView which uses DOM's scrollIntoView, this only affects the current scroller.
	scrollToControl: function(inControl, inAlignWithTop) {
		this.scrollToNode(inControl.hasNode(), inAlignWithTop);
	},
	// ensure that the given node is visible in the scroller's viewport.
	scrollToNode: function(inNode, inAlignWithTop) {
		this.$.strategy.scrollToNode(inNode, inAlignWithTop);
	},
	// normalize scroll event to onScroll.
	scroll: function(inSender, e) {
		if (this.$.strategy.scroll) {
			this.$.strategy.scroll(inSender, e);
		}
		return this.doScroll(e);
	}
});

// provide a touch scrolling solution by default when the environment is mobile
if (enyo.Scroller.hasTouchScrolling()) {
	enyo.Scroller.prototype.strategyKind = enyo.Scroller.getTouchStrategy();
}
