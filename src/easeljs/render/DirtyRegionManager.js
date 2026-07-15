import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function DirtyRegionManager() {
		this.regions=[];
		this.fullRender=true;
		this.width=this.height=0;
	}
	var p=DirtyRegionManager.prototype;

	p.reset=function(width,height) {
		this.regions.length=0;
		this.fullRender=false;
		this.width=width || 0;
		this.height=height || 0;
	};

	p.setFullRender=function() {
		this.fullRender=true;
		this.regions.length=0;
	};

	p.addRect=function(rect) {
		if (this.fullRender || !rect || rect.width <= 0 || rect.height <= 0) { return; }
		var pad=2, x=Math.max(0,Math.floor(rect.x)-pad), y=Math.max(0,Math.floor(rect.y)-pad);
		var right=Math.min(this.width,Math.ceil(rect.x+rect.width)+pad);
		var bottom=Math.min(this.height,Math.ceil(rect.y+rect.height)+pad);
		if (right <= x || bottom <= y) { return; }
		var next={x:x,y:y,width:right-x,height:bottom-y};
		for (var i=0; i<this.regions.length;) {
			var current=this.regions[i];
			if (!this._touches(current,next)) { i++; continue; }
			var nx=Math.min(current.x,next.x), ny=Math.min(current.y,next.y);
			next.x=nx; next.y=ny;
			next.width=Math.max(current.x+current.width,next.x+next.width)-nx;
			next.height=Math.max(current.y+current.height,next.y+next.height)-ny;
			this.regions.splice(i,1);
		}
		this.regions.push(next);
	};

	p.finalize=function() {
		if (this.fullRender) { return; }
		var area=0;
		for (var i=0; i<this.regions.length; i++) { area+=this.regions[i].width*this.regions[i].height; }
		if (this.regions.length > 12 || area > this.width*this.height*0.65) { this.setFullRender(); }
	};

	p.intersects=function(rect) {
		if (this.fullRender || !rect) { return true; }
		for (var i=0; i<this.regions.length; i++) {
			var r=this.regions[i];
			if (rect.x < r.x+r.width && rect.x+rect.width > r.x && rect.y < r.y+r.height && rect.y+rect.height > r.y) { return true; }
		}
		return false;
	};

	p._touches=function(a,b) {
		return a.x <= b.x+b.width+1 && a.x+a.width+1 >= b.x && a.y <= b.y+b.height+1 && a.y+a.height+1 >= b.y;
	};

	createjs.DirtyRegionManager=DirtyRegionManager;
}());
