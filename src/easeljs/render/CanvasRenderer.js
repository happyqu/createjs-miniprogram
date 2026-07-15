import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function CanvasRenderer() {
		this.Renderer_constructor();
		this.buffer=new createjs.CommandBuffer();
		this._listVersion=-1;
		this._listLength=-1;
		this._matrixKey="";
		this._alpha=-1;
	}
	var p=createjs.extend(CanvasRenderer,createjs.Renderer);

	p.invalidate=function() {
		this._listVersion=-1;
		this.buffer.reset();
	};

	p._compile=function(stage) {
		if (stage.bitmapCache || stage.mask || stage.shadow || stage.compositeOperation || (stage.filters && stage.filters.length)) { return false; }
		if (stage.draw !== createjs.Stage.prototype.draw) { return false; }
		if (stage._stageRenderListDirty) { stage._rebuildStageRenderList(); }
		var list=stage._stageRenderList;
		for (var stateIndex=0; stateIndex<list.length; stateIndex++) {
			if (list[stateIndex]._updateState) { list[stateIndex]._updateState(); }
		}
		if (stage._stageRenderListDirty) { stage._rebuildStageRenderList(); list=stage._stageRenderList; }
		var version=stage._stageRenderVersion;
		if (this._listVersion===version && this._listLength===list.length) { return this.buffer.compatible; }
		this.buffer.reset(version);
		this._listVersion=version;
		this._listLength=list.length;
		var complexBitmaps=0, nestedContainers=0;
		for (var i=0; i<list.length; i++) {
			var object=list[i];
			if (object instanceof createjs.Bitmap) {
				if (object.draw !== createjs.Bitmap.prototype.draw) { return false; }
				if (!object._canDrawBitmapFast || !object._canDrawBitmapFast()) { complexBitmaps++; }
				this.buffer.addBitmap(object);
			} else if (object instanceof createjs.Container) {
				var standard=object.draw===createjs.Container.prototype.draw;
				var movie=createjs.MovieClip && object instanceof createjs.MovieClip;
				if (!standard && !movie) { return false; }
				nestedContainers++;
			} else { return false; }
		}
		// Phase 2's translation-only bitmap path is already cheaper than building
		// world matrices. Compile only when it removes meaningful container/state work.
		if (!complexBitmaps && nestedContainers<4) { return false; }
		this.buffer.compatible=true;
		return true;
	};

	p._isSafe=function(object) {
		for (var current=object; current; current=current.parent) {
			if (current.bitmapCache || current.mask || current.shadow || current.compositeOperation ||
				(current.filters && current.filters.length)) { return false; }
		}
		return true;
	};

	p._drawBitmap=function(ctx, command) {
		var object=command.target, image=object.image, rect=object.sourceRect;
		if (image && image.getImage) { image=image.getImage(); }
		if (!image) { return; }
		var matrix=object._getWorldMatrix(command.matrix);
		if (createjs.DisplayObject._snapToPixelEnabled && object.snapToPixel) {
			matrix.tx=Math.round(matrix.tx); matrix.ty=Math.round(matrix.ty);
		}
		var translationOnly=matrix.a===1 && matrix.b===0 && matrix.c===0 && matrix.d===1;
		var key=translationOnly ? "identity" : [matrix.a,matrix.b,matrix.c,matrix.d,matrix.tx,matrix.ty].join(",");
		if (key!==this._matrixKey) {
			ctx.setTransform(translationOnly?1:matrix.a,translationOnly?0:matrix.b,translationOnly?0:matrix.c,
				translationOnly?1:matrix.d,translationOnly?0:matrix.tx,translationOnly?0:matrix.ty);
			this._matrixKey=key; this.canvasCalls++;
		}
		if (command.alpha!==this._alpha) { ctx.globalAlpha=command.alpha; this._alpha=command.alpha; this.canvasCalls++; }
		var drawX=translationOnly?matrix.tx:0, drawY=translationOnly?matrix.ty:0;
		if (!rect) { ctx.drawImage(image,drawX,drawY); this.canvasCalls++; return; }
		var x1=rect.x, y1=rect.y, x2=x1+rect.width, y2=y1+rect.height, x=drawX, y=drawY;
		var width=image.width, height=image.height;
		if (x1<0) { x-=x1; x1=0; }
		if (x2>width) { x2=width; }
		if (y1<0) { y-=y1; y1=0; }
		if (y2>height) { y2=height; }
		ctx.drawImage(image,x1,y1,x2-x1,y2-y1,x,y,x2-x1,y2-y1);
		this.canvasCalls++;
	};

	p.render=function(stage,ctx,dirty) {
		this.commandCount=this.canvasCalls=0;
		this.compiled=false;
		this._matrixKey=""; this._alpha=-1;
		if (!this._compile(stage)) { return false; }
		var commands=this.buffer.commands;
		for (var safetyIndex=0; safetyIndex<commands.length; safetyIndex++) {
			if (!this._isSafe(commands[safetyIndex].target)) { return false; }
		}
		for (var i=0; i<commands.length; i++) {
			var command=commands[i], object=command.target, alpha=1, visible=true;
			for (var current=object; current; current=current.parent) {
				if (!current.visible || current.scaleX===0 || current.scaleY===0) { visible=false; break; }
				alpha*=current.alpha;
			}
			if (!visible || alpha<=0 || !object.isVisible()) { continue; }
			if (dirty && !dirty.intersects(object._phase2GlobalBounds)) { continue; }
			command.alpha=alpha;
			this._drawBitmap(ctx,command);
			this.commandCount++;
			if (createjs.performance && createjs.performance._active) { createjs.performance._drawCount++; }
		}
		this.compiled=true;
		return true;
	};

	createjs.CanvasRenderer=createjs.promote(CanvasRenderer,"Renderer");
}());
