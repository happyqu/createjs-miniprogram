import createjs from "@happyqu/createjs-miniprogram/core";

declare class ButtonHelper {
  constructor(target: unknown, outLabel?: string | number, overLabel?: string | number, downLabel?: string | number);
  destroy(): void;
}

declare module "@happyqu/createjs-miniprogram/core" {
  interface CreateJSCore {
    ButtonHelper: typeof ButtonHelper;
  }
}

export default createjs;
