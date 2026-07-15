import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function Renderer() {
		this.commandCount=0;
		this.canvasCalls=0;
		this.compiled=false;
	}
	Renderer.prototype.render=function() { return false; };
	Renderer.prototype.invalidate=function() {};

	createjs.Renderer=Renderer;
}());
