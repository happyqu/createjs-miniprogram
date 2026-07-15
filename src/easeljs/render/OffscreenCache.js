import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function OffscreenCache() {
		this.maxSurfaces=12;
		this.maxPixels=8*1024*1024;
		this._surfaces=[];
		this._pixels=0;
		this.created=0;
		this.reused=0;
	}
	var p=OffscreenCache.prototype;

	p.acquire=function(width,height) {
		width=Math.max(1,Math.ceil(width)); height=Math.max(1,Math.ceil(height));
		for (var i=this._surfaces.length-1; i>=0; i--) {
			var surface=this._surfaces[i];
			if (surface.width===width && surface.height===height) {
				this._surfaces.splice(i,1); this._pixels-=width*height; this.reused++; return surface;
			}
		}
		this.created++;
		return createjs.createCanvas(width,height);
	};

	p.release=function(surface) {
		if (!surface || !surface.getContext) { return; }
		var pixels=(surface.width||0)*(surface.height||0);
		if (!pixels || pixels>this.maxPixels || this._surfaces.length>=this.maxSurfaces) { return; }
		while (this._surfaces.length && this._pixels+pixels>this.maxPixels) {
			var removed=this._surfaces.shift(); this._pixels-=removed.width*removed.height;
		}
		if (this._pixels+pixels<=this.maxPixels) { this._surfaces.push(surface); this._pixels+=pixels; }
	};

	p.clear=function() { this._surfaces.length=0; this._pixels=0; };
	Object.defineProperty(p,"size",{get:function(){ return this._surfaces.length; }});

	createjs.OffscreenCache=OffscreenCache;
	OffscreenCache.shared=new OffscreenCache();
}());
