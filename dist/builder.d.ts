import createjs from "@happyqu/createjs-miniprogram/core";

declare module "@happyqu/createjs-miniprogram/core" {
  interface CreateJSCore {
    SpriteSheetUtils: Record<string, Function>;
    SpriteSheetBuilder: new (...args: any[]) => object;
  }
}

export default createjs;
