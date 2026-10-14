import createjs from "@happyqu/createjs-miniprogram/lite";

type FilterConstructor = new (...args: any[]) => object;

declare module "@happyqu/createjs-miniprogram/lite" {
  interface CreateJSLite {
    BlurFilter: FilterConstructor;
    AlphaMapFilter: FilterConstructor;
    AlphaMaskFilter: FilterConstructor;
    ColorFilter: FilterConstructor;
    ColorMatrix: FilterConstructor;
    ColorMatrixFilter: FilterConstructor;
  }
}

export default createjs;
