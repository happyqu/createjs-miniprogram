import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	var now = function() {
		if (typeof wx !== "undefined" && wx.getPerformance) { return wx.getPerformance().now(); }
		return Date.now();
	};

	createjs.performance = {
		enable: false,
		phase2: true,
		debug: false,
		log: false,
		fps: 0,
		renderTime: 0,
		updateTime: 0,
		drawCount: 0,
		displayObjectCount: 0,
		memory: null,
		dirtyRect: 0,
		fullRender: true,
		cacheObject: 0,
		drawCalls: 0,
		cachePixels: 0,
		frameTimeP50: 0,
		frameTimeP95: 0,
		_frameTimes: [],
		_canvasDrawCalls: 0,
		skippedObjects: 0,
		bitmapBatches: 0,
		_frameCount: 0,
		_drawCount: 0,
		_sampleTime: null,
		_now: now,
		reset: function() {
			this.fps=this.renderTime=this.updateTime=this.drawCount=this.displayObjectCount=0;
			this.memory=null; this.dirtyRect=this.cacheObject=this.drawCalls=this.skippedObjects=this.bitmapBatches=0;
			this.fullRender=true; this._frameCount=this._drawCount=0; this._sampleTime=null;
			this._canvasDrawCalls=this.cachePixels=this.frameTimeP50=this.frameTimeP95=0; this._frameTimes.length=0;
		},
		_setPhase2Metrics: function(manager,fullRender,cacheObject,batches,totalObjects,cachePixels) {
			this.dirtyRect=manager && !manager.fullRender ? manager.regions.length : 0;
			this.fullRender=!!fullRender; this.cacheObject=cacheObject || 0;
			this.drawCalls=this._canvasDrawCalls; this.bitmapBatches=batches || 0;
			this.cachePixels=cachePixels || 0;
			this.memory=this.cachePixels*4;
			this.skippedObjects=Math.max(0,(totalObjects || 0)-this._drawCount);
		},
		_snapshot: function(updateTime, renderTime, displayObjectCount) {
			var time=this._now(), elapsed=this._sampleTime == null ? 0 : time-this._sampleTime;
			this.updateTime=updateTime; this.renderTime=renderTime;
			this.drawCount=this._drawCount; this.displayObjectCount=displayObjectCount;
			this._drawCount=0; this._frameCount++;
			this._canvasDrawCalls=0;
			this._frameTimes.push(updateTime+renderTime);
			if (this._frameTimes.length > 120) { this._frameTimes.shift(); }
			if (this._sampleTime == null) { this._sampleTime=time; this._frameCount=0; }
			else if (elapsed >= 1000) {
				this.fps=this._frameCount*1000/elapsed;
				this._frameCount=0; this._sampleTime=time;
			}
			if ((this.log || this.debug) && typeof console !== "undefined" && console.log) {
				console.log("CreateJS performance", this.getMetrics());
			}
		},
		_recordDrawCall: function() { if (this._active) { this._canvasDrawCalls++; } },
		getMetrics: function() {
			var times=this._frameTimes.slice().sort(function(a,b) { return a-b; });
			this.frameTimeP50=times.length ? times[Math.ceil(times.length*0.5)-1] : 0;
			this.frameTimeP95=times.length ? times[Math.ceil(times.length*0.95)-1] : 0;
			return {fps:this.fps, renderTime:this.renderTime, updateTime:this.updateTime,
				drawCount:this.drawCount, displayObjectCount:this.displayObjectCount, memory:this.memory,
				dirtyRect:this.dirtyRect, fullRender:this.fullRender, cacheObject:this.cacheObject,
				drawCalls:this.drawCalls, skippedObjects:this.skippedObjects, bitmapBatches:this.bitmapBatches,
				cachePixels:this.cachePixels, frameTimeP50:this.frameTimeP50, frameTimeP95:this.frameTimeP95};
		}
	};
}());
