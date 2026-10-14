import type esm from "./index.mjs";
declare const createjs: typeof esm;
declare namespace createjs { type CreateJS = import("./index.mjs").CreateJS; type CreateJSCore = import("./index.mjs").CreateJSCore; }
export = createjs;
