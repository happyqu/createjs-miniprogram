import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	var now = function() { return Date.now(); };

	createjs.performance = {
		enable: false,
		log: false,
		fps: 0,
		renderTime: 0,
		updateTime: 0,
		drawCount: 0,
		displayObjectCount: 0,
		memory: null,
		_frameCount: 0,
		_drawCount: 0,
		_sampleTime: 0,
		_now: now,
		reset: function() {
			this.fps=this.renderTime=this.updateTime=this.drawCount=this.displayObjectCount=0;
			this.memory=null; this._frameCount=this._drawCount=0; this._sampleTime=0;
		},
		_snapshot: function(updateTime, renderTime, displayObjectCount) {
			var time=now(), elapsed=this._sampleTime ? time-this._sampleTime : 0;
			this.updateTime=updateTime; this.renderTime=renderTime;
			this.drawCount=this._drawCount; this.displayObjectCount=displayObjectCount;
			this._drawCount=0; this._frameCount++;
			if (!this._sampleTime) { this._sampleTime=time; }
			else if (elapsed >= 1000) {
				this.fps=this._frameCount*1000/elapsed;
				this._frameCount=0; this._sampleTime=time;
			}
			if (this.log && typeof console !== "undefined" && console.log) {
				console.log("CreateJS performance", this.getMetrics());
			}
		},
		getMetrics: function() {
			return {fps:this.fps, renderTime:this.renderTime, updateTime:this.updateTime,
				drawCount:this.drawCount, displayObjectCount:this.displayObjectCount, memory:this.memory};
		}
	};
}());
