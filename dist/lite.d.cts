import type esm from "./lite.mjs";
declare const createjs: typeof esm;
declare namespace createjs { type CreateJSLite = import("./lite.mjs").CreateJSLite; }
export = createjs;
