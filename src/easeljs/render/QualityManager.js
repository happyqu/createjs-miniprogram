import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function QualityManager() { this.level="high"; this._slowFrames=0; this._fastFrames=0; }
	var p=QualityManager.prototype;
	p.update=function(frameTime) {
		if (createjs.quality!=="auto") { return this.level=createjs.quality || "high"; }
		if (frameTime>24) { this._slowFrames++; this._fastFrames=0; }
		else if (frameTime<17) { this._fastFrames++; this._slowFrames=0; }
		else { this._slowFrames=this._fastFrames=0; }
		if (this._slowFrames>=30) { this.level=this.level==="high"?"medium":"low"; this._slowFrames=0; }
		if (this._fastFrames>=180) { this.level=this.level==="low"?"medium":"high"; this._fastFrames=0; }
		return this.level;
	};

	createjs.quality="high";
	createjs.QualityManager=QualityManager;
	QualityManager.shared=new QualityManager();
}());
