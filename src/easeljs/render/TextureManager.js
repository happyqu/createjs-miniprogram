import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function TextureManager() { this._entries={}; }
	var p=TextureManager.prototype;

	p.register=function(key,image) {
		var entry=this._entries[key];
		if (entry) { entry.image=image; return image; }
		this._entries[key]={image:image,refs:1,promise:null};
		return image;
	};
	p.get=function(key) { var entry=this._entries[key]; return entry && entry.image; };
	p.retain=function(key) { var entry=this._entries[key]; if (entry) { entry.refs++; return entry.image; } return null; };
	p.load=function(key,loader) {
		var entry=this._entries[key];
		if (entry) { entry.refs++; return entry.promise || Promise.resolve(entry.image); }
		if (typeof loader!=="function") { return Promise.reject(new Error("TextureManager.load requires a loader")); }
		entry=this._entries[key]={image:null,refs:1,promise:null};
		entry.promise=Promise.resolve(loader(key)).then(function(image){ entry.image=image; entry.promise=null; return image; },function(error){ delete this._entries[key]; throw error; }.bind(this));
		return entry.promise;
	};
	p.release=function(key) { var entry=this._entries[key]; if (!entry) { return false; } if (--entry.refs<=0) { delete this._entries[key]; } return true; };
	p.clear=function() { this._entries={}; };

	createjs.TextureManager=TextureManager;
	TextureManager.shared=new TextureManager();
}());
