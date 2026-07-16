import createjs, { Container } from "@happyqu/createjs-miniprogram/core";

declare class MovieClip extends Container {
  constructor(props?: Record<string, unknown>);
  paused: boolean;
  gotoAndPlay(positionOrLabel: number | string): void;
  gotoAndStop(positionOrLabel: number | string): void;
}

declare module "@happyqu/createjs-miniprogram/core" {
  interface CreateJSCore {
    MovieClip: typeof MovieClip;
  }
}

export default createjs;
