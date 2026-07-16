import createjs, { DisplayObject } from "@happyqu/createjs-miniprogram/core";

declare class Text extends DisplayObject {
  constructor(text?: string, font?: string, color?: string);
  text: string;
  font: string;
  color: string;
  getMeasuredWidth(): number;
  getMeasuredHeight(): number;
}

declare module "@happyqu/createjs-miniprogram/core" {
  interface CreateJSCore {
    Text: typeof Text;
    BitmapText: new (...args: unknown[]) => DisplayObject;
  }
}

export default createjs;
