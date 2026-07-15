import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function BitmapBatchRenderer() { this.batchCount=0; }
	var p=BitmapBatchRenderer.prototype;

	p.drawRun=function(ctx,list,start,manager) {
		var i=start, drew=false;
		for (; i<list.length; i++) {
			var child=list[i];
			if (!child.isVisible() || !child._canDrawBitmapFast || !child._canDrawBitmapFast()) { break; }
			if (manager && !manager.intersects(child._phase2GlobalBounds)) { continue; }
			if (createjs.performance && createjs.performance._active) { createjs.performance._drawCount++; }
			child._drawBitmapFast(ctx);
			drew=true;
		}
		if (drew) { this.batchCount++; }
		return i;
	};

	createjs.BitmapBatchRenderer=BitmapBatchRenderer;
	BitmapBatchRenderer._shared=new BitmapBatchRenderer();
}());
