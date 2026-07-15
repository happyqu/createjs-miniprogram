import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function CommandBuffer() {
		this.commands=[];
		this.version=-1;
		this.compatible=false;
	}
	var p=CommandBuffer.prototype;

	p.reset=function(version) {
		this.commands.length=0;
		this.version=version == null ? -1 : version;
		this.compatible=false;
	};

	p.addBitmap=function(target) {
		var command=new createjs.RenderCommand(createjs.RenderCommand.BITMAP,target);
		this.commands.push(command);
		return command;
	};

	createjs.CommandBuffer=CommandBuffer;
}());
