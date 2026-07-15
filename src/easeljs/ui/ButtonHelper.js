/*
 * Button state helper for EaselJS display objects.
 * Copyright (c) 2010 gskinner.com, inc.
 * Released under the MIT License.
 */

import createjs from "../../createjs/createjs.js"

(function () {
	"use strict"

	var EVENTS = ["rollover", "rollout", "mousedown", "pressup"]

	function ButtonHelper(target, outLabel, overLabel, downLabel, play, hitArea, hitLabel) {
		if (!target || typeof target.addEventListener !== "function" || typeof target.removeEventListener !== "function") {
			throw new TypeError("ButtonHelper target must support CreateJS events")
		}

		this.target = target
		this.outLabel = outLabel == null ? "out" : outLabel
		this.overLabel = overLabel == null ? "over" : overLabel
		this.downLabel = downLabel == null ? "down" : downLabel
		this.play = Boolean(play)
		this._enabled = false
		this._isPressed = false
		this._isOver = false

		target.mouseChildren = false
		if (hitArea) {
			if (hitLabel != null && typeof hitArea.gotoAndStop === "function") {
				hitArea.actionsEnabled = false
				hitArea.gotoAndStop(hitLabel)
			}
			target.hitArea = hitArea
		}

		this.enabled = true
		this._show(this.outLabel)
	}

	var p = ButtonHelper.prototype

	Object.defineProperty(p, "enabled", {
		get: function () {
			return this._enabled
		},
		set: function (value) {
			value = Boolean(value)
			if (value === this._enabled) {
				return
			}
			this._enabled = value
			for (var i = 0; i < EVENTS.length; i++) {
				var method = value ? "addEventListener" : "removeEventListener"
				this.target[method](EVENTS[i], this)
			}
		}
	})

	p.handleEvent = function (event) {
		if (!this._enabled || !event) {
			return
		}

		var label
		switch (event.type) {
			case "mousedown":
				this._isPressed = true
				label = this.downLabel
				break
			case "pressup":
				this._isPressed = false
				label = this._isOver ? this.overLabel : this.outLabel
				break
			case "rollover":
				this._isOver = true
				label = this._isPressed ? this.downLabel : this.overLabel
				break
			case "rollout":
				this._isOver = false
				label = this._isPressed ? this.downLabel : this.outLabel
				break
			default:
				return
		}
		this._show(label)
	}

	p.destroy = function () {
		this.enabled = false
		this.target = null
	}

	p._show = function (label) {
		var target = this.target
		var method = this.play ? "gotoAndPlay" : "gotoAndStop"
		if (target && typeof target[method] === "function") {
			target[method](label)
		}
	}

	p.toString = function () {
		return "[ButtonHelper]"
	}

	createjs.ButtonHelper = ButtonHelper
}())
