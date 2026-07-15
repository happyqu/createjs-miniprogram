import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function RenderCommand(type, target) {
		this.type=type || "bitmap";
		this.target=target || null;
		this.matrix=new createjs.Matrix2D();
		this.alpha=1;
	}

	RenderCommand.BITMAP="bitmap";
	createjs.RenderCommand=RenderCommand;
}());
