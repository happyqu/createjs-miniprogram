import createjs from "@happyqu/createjs-miniprogram/core";

type FilterConstructor = new (...args: any[]) => object;

declare module "@happyqu/createjs-miniprogram/core" {
  interface CreateJSCore {
    BlurFilter: FilterConstructor;
    AlphaMapFilter: FilterConstructor;
    AlphaMaskFilter: FilterConstructor;
    ColorFilter: FilterConstructor;
    ColorMatrix: FilterConstructor;
    ColorMatrixFilter: FilterConstructor;
  }
}

export default createjs;
