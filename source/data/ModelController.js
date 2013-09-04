//*@public
/**
	The _enyo.ModelController_ kind is designed as a proxy for other objects
	to bind to properties of a _model_ safely, even when the model is changing.
	It also allows for extended logic capabilities beyond that of the _model_
	alone without modifying the _model_ kind. Its primary purpose is to _proxy_
	the underlying data from the _model_. Like _enyo.Model_, the use of the _get_
	and _set_ methods are restricted to _attributes_ of the _model_ schema. There
	are convenience methods _localGet_ and _localSet_ that will act like the _get_
	and _set_ of _enyo.Object_ and subkinds. This _controller_ has the ability
	to interact with the _enyo.Component_ event system but also proxies the _event_
	API of _enyo.Model_ and _enyo.Controller_.
*/
enyo.kind({
	name: "enyo.ModelController",
	kind: enyo.Controller,
	/**
		This property must be set to an instance of _enyo.Model_ for it
		to function as expected.
	*/
	model: null,
	/**
		Retrieve an _attribute_ from the _model_ (if it exists). The only exception
		is the _model_ property itself may be returned from this method.
	*/
	get: function (prop) {
		if (prop == "model") { return this.getLocal(prop); }
		if (this.model) { return this.model.get.apply(this.model, arguments); }
	},
	/**
		Will allow the retrieval of local properties and computed properties
		according to the _enyo.Object.get_ method.
	*/
	getLocal: function () {
		return enyo.getPath.apply(this, arguments);
	},
	/**
		Set an _attribute_ (or _attributes_ if an object) on the _model_
		(if it exists). Returns the _model_ if it exists otherwise _undefined_.
		The only exception is the _model_ properties itself may be set using
		this method as well.
	*/
	set: function (prop, value) {
		if (prop == "model") { return this.setLocal(prop, value); }
		if (this.model) { return this.model.set.apply(this.model, arguments); }
	},
	/**
		Will allow the setting of local properties according to the _enyo.Object.set_
		method.
	*/
	setLocal: function () {
		return enyo.setPath.apply(this, arguments);
	},
	/**
		To arbitrarily update any bindings to known _attributes_ of the
		_model_ (if it exists), call this method.
	*/
	sync: function () {
		if (this.model) {
			var aa = this.model.attributes;
			for (var k in aa) { this.notifyObservers(k, this.model.previous[k], this.model.get(k)); }
		}
	},
	/**
		This method responds to the _model_ property being set on this _controller_.
		Overload this method for additional behaviors.
	*/
	modelChanged: function (previous, model) {
		var p = previous,
			m = model;
		// remove our listeners from the model that is no longer ours
		if (p) {
			p.removeListener("change", this._modelChanged);
			p.removeListener("destroy", this._modelDestroyed);
		}
		if (m) {
			// assign listeners to respond to events from the model
			m.addListener("change", this._modelChanged);
			m.addListener("destroy", this._modelDestroyed);
			this.sync();
		}
	},
	//*@protected
	create: enyo.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this.notifyObservers("model");
		};
	}),
	constructor: enyo.inherit(function (sup) {
		return function () {
			sup.apply(this, arguments);
			this._modelChanged = this.bindSafely("_modelChanged");
		};
	}),
	_modelChanged: function (r, e, a) {
		var ch = r.changed;
		for (var k in ch) { this.notifyObservers(k, r.previous[k], ch[k]); }
	},
	_modelDestroyed: function (r, e, a) {
		if (r === this.model) {
			this.setLocal("model", null);
		}
	}
});
