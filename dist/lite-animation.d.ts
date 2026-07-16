import createjs, { Container } from "@happyqu/createjs-miniprogram/lite";

declare class Tween {
  static get(target: object, props?: object): Tween;
  static removeTweens(target: object): void;
  static removeAllTweens(): void;
  wait(duration: number, passive?: boolean): this;
  to(props: object, duration?: number, ease?: (ratio: number) => number): this;
  call(callback: Function, params?: unknown[], scope?: unknown): this;
}

declare class MovieClip extends Container {
  constructor(props?: Record<string, unknown>);
  paused: boolean;
  gotoAndPlay(positionOrLabel: number | string): void;
  gotoAndStop(positionOrLabel: number | string): void;
}

declare module "@happyqu/createjs-miniprogram/lite" {
  interface CreateJSLite {
    Tween: typeof Tween;
    Timeline: new (...args: any[]) => object;
    Ease: Record<string, (ratio: number) => number>;
    MovieClip: typeof MovieClip;
    MotionGuidePlugin: Record<string, unknown>;
    ColorPlugin: Record<string, unknown>;
    DotPlugin: Record<string, unknown>;
    RelativePlugin: Record<string, unknown>;
    RotationPlugin: Record<string, unknown>;
  }
}

export default createjs;
