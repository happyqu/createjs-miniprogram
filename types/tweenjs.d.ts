import createjs from "@happyqu/createjs-miniprogram";

declare class Tween {
  static get(target: object, props?: object): Tween;
  static removeTweens(target: object): void;
  static removeAllTweens(): void;
  static hasActiveTweens(target?: object): boolean;
  wait(duration: number, passive?: boolean): this;
  to(props: object, duration?: number, ease?: (ratio: number) => number): this;
  call(callback: Function, params?: unknown[], scope?: unknown): this;
  set(props: object, target?: object): this;
  setPaused(value: boolean): this;
}

declare class Timeline {
  constructor(tweens?: Tween[], labels?: Record<string, number>, props?: object);
  addTween(...tweens: Tween[]): Tween;
  removeTween(...tweens: Tween[]): boolean;
  gotoAndPlay(positionOrLabel: number | string): void;
  gotoAndStop(positionOrLabel: number | string): void;
}

interface TweenPlugin {
  install(...args: unknown[]): void;
}

declare module "@happyqu/createjs-miniprogram" {
  interface CreateJS {
    Tween: typeof Tween;
    Timeline: typeof Timeline;
    Ease: Record<string, (ratio: number) => number>;
    MotionGuidePlugin: TweenPlugin;
    ColorPlugin: TweenPlugin;
    DotPlugin: TweenPlugin;
    RelativePlugin: TweenPlugin;
    RotationPlugin: TweenPlugin;
  }
}

export default createjs;
