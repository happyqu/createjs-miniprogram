/*
 * Touch adapter for WeChat Mini Programs.
 * Copyright (c) 2010 gskinner.com, inc.
 * Released under the MIT License.
 */

import createjs from "../../createjs/createjs.js"

(function () {
	"use strict"

	function Touch() {
		throw "Touch cannot be instantiated"
	}

	Touch.isSupported = function () {
		return typeof wx !== "undefined"
	}

	Touch.enable = function (stage, options) {
		if (!stage || !stage.canvas || !Touch.isSupported()) {
			return false
		}
		if (stage.__touch) {
			return true
		}
		options = options || {}
		var pixelRatio = Number(options.pixelRatio)
		if (!isFinite(pixelRatio) || pixelRatio <= 0) {
			pixelRatio = 1
		}

		stage.__touch = {
			pointers: {},
			multitouch: !options.singleTouch,
			preventDefault: !options.allowDefault,
			pixelRatio: pixelRatio,
			count: 0
		}
		return true
	}

	Touch.disable = function (stage) {
		if (!stage || !stage.__touch) {
			return false
		}
		delete stage.__touch
		return true
	}

	Touch.handleEvent = function (stage, event) {
		if (!stage || !stage.__touch || !event) {
			return false
		}

		if (stage.__touch.preventDefault && typeof event.preventDefault === "function") {
			event.preventDefault()
		}

		var touches = event.changedTouches || []
		var type = event.type
		var pixelRatio = stage.__touch.pixelRatio
		for (var i = 0; i < touches.length; i++) {
			var touch = touches[i]
			var id = touch.identifier == null ? i : touch.identifier
			var x = typeof touch.x === "number" ? touch.x : null
			var y = typeof touch.y === "number" ? touch.y : null

			if (type === "touchstart") {
				if (x != null && y != null) {
					Touch._handleStart(stage, id, event, x * pixelRatio, y * pixelRatio)
				}
			} else if (type === "touchmove") {
				if (x != null && y != null) {
					Touch._handleMove(stage, id, event, x * pixelRatio, y * pixelRatio)
				}
			} else if (type === "touchend" || type === "touchcancel") {
				Touch._handleEnd(stage, id, event)
			}
		}
		return true
	}

	Touch._handleStart = function (stage, id, event, x, y) {
		var props = stage.__touch
		if (!props || (!props.multitouch && props.count) || props.pointers[id]) {
			return
		}
		props.pointers[id] = true
		props.count++
		stage._handlePointerDown(id, event, x, y)
	}

	Touch._handleMove = function (stage, id, event, x, y) {
		var props = stage.__touch
		if (props && props.pointers[id]) {
			stage._handlePointerMove(id, event, x, y)
		}
	}

	Touch._handleEnd = function (stage, id, event) {
		var props = stage.__touch
		if (!props || !props.pointers[id]) {
			return
		}
		delete props.pointers[id]
		props.count--
		stage._handlePointerUp(id, event, true)
	}

	createjs.Touch = Touch
}())
