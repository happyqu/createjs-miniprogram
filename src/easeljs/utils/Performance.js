import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	var now = function() { return Date.now(); };

	createjs.performance = {
		enable: false,
		phase2: true,
		phase3: true,
		inspect: false,
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
		skippedObjects: 0,
		bitmapBatches: 0,
		compiledRender: false,
		commandCount: 0,
		canvasCalls: 0,
		offscreenSurfaces: 0,
		workerEnabled: false,
		_frameCount: 0,
		_drawCount: 0,
		_sampleTime: 0,
		_now: now,
		reset: function() {
			this.fps=this.renderTime=this.updateTime=this.drawCount=this.displayObjectCount=0;
			this.memory=null; this.dirtyRect=this.cacheObject=this.drawCalls=this.skippedObjects=this.bitmapBatches=0;
			this.compiledRender=false; this.commandCount=this.canvasCalls=this.offscreenSurfaces=0; this.workerEnabled=false;
			this.fullRender=true; this._frameCount=this._drawCount=0; this._sampleTime=0;
		},
		_setPhase2Metrics: function(manager,fullRender,cacheObject,batches,totalObjects) {
			this.dirtyRect=manager && !manager.fullRender ? manager.regions.length : 0;
			this.fullRender=!!fullRender; this.cacheObject=cacheObject || 0;
			this.drawCalls=this._drawCount; this.bitmapBatches=batches || 0;
			this.skippedObjects=Math.max(0,(totalObjects || 0)-this._drawCount);
		},
		_setPhase3Metrics: function(renderer,compiled) {
			this.compiledRender=!!compiled;
			this.commandCount=compiled && renderer ? renderer.commandCount : 0;
			this.canvasCalls=compiled && renderer ? renderer.canvasCalls : 0;
			this.offscreenSurfaces=createjs.OffscreenCache ? createjs.OffscreenCache.shared.size : 0;
			this.workerEnabled=!!(createjs.workerRenderer && createjs.workerRenderer.enabled);
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
			if ((this.log || this.debug || this.inspect) && typeof console !== "undefined" && console.log) {
				console.log("CreateJS performance", this.getMetrics());
			}
		},
		getMetrics: function() {
			return {fps:this.fps, renderTime:this.renderTime, updateTime:this.updateTime,
				drawCount:this.drawCount, displayObjectCount:this.displayObjectCount, memory:this.memory,
				dirtyRect:this.dirtyRect, fullRender:this.fullRender, cacheObject:this.cacheObject,
				drawCalls:this.drawCalls, skippedObjects:this.skippedObjects, bitmapBatches:this.bitmapBatches,
				compiledRender:this.compiledRender, commandCount:this.commandCount, canvasCalls:this.canvasCalls,
				offscreenSurfaces:this.offscreenSurfaces, workerEnabled:this.workerEnabled};
		}
	};
}());
