import createjs from "../../createjs/createjs";

(function() {
	"use strict";

	function WorkerRenderer(worker) {
		this.worker=null; this.enabled=false; this.pending={}; this.sequence=0;
		if (worker) { this.connect(worker); }
	}
	var p=WorkerRenderer.prototype;
	p.connect=function(worker) {
		this.disconnect(); this.worker=worker; this.enabled=!!(worker && worker.postMessage);
		if (this.enabled && worker.onMessage) {
			var self=this; worker.onMessage(function(message){
				var task=message && self.pending[message.id];
				if (task) { delete self.pending[message.id]; task.resolve(message.matrices || []); }
			});
		}
		return this.enabled;
	};
	p.computeMatrices=function(items) {
		if (!this.enabled) { return Promise.resolve(WorkerRenderer.compute(items)); }
		var id=++this.sequence, self=this;
		return new Promise(function(resolve,reject){ self.pending[id]={resolve:resolve,reject:reject}; self.worker.postMessage({type:"createjs:matrices",id:id,items:items}); });
	};
	p.disconnect=function() {
		for (var id in this.pending) { this.pending[id].reject(new Error("WorkerRenderer disconnected")); }
		this.pending={}; this.worker=null; this.enabled=false;
	};
	WorkerRenderer.compute=function(items) {
		var output=[];
		for (var i=0; i<items.length; i++) {
			var item=items[i], local=item.local, parent=item.parent || [1,0,0,1,0,0];
			output.push([
				parent[0]*local[0]+parent[2]*local[1], parent[1]*local[0]+parent[3]*local[1],
				parent[0]*local[2]+parent[2]*local[3], parent[1]*local[2]+parent[3]*local[3],
				parent[0]*local[4]+parent[2]*local[5]+parent[4], parent[1]*local[4]+parent[3]*local[5]+parent[5]
			]);
		}
		return output;
	};

	createjs.WorkerRenderer=WorkerRenderer;
	createjs.workerRenderer=new WorkerRenderer();
}());
