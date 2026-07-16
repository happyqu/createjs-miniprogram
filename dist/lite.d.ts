export interface CanvasLike {
  width: number;
  height: number;
  getContext(type: "2d"): unknown;
}

export class EventDispatcher {
  addEventListener(type: string, listener: Function, useCapture?: boolean): Function;
  on(type: string, listener: Function, scope?: unknown, once?: boolean, data?: unknown, useCapture?: boolean): Function;
  removeEventListener(type: string, listener: Function, useCapture?: boolean): void;
  dispatchEvent(event: string | object, bubbles?: boolean, cancelable?: boolean): boolean;
}

export class DisplayObject extends EventDispatcher {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  visible: boolean;
  parent: Container | null;
  cache(x: number, y: number, width: number, height: number, scale?: number): void;
  uncache(): void;
}

export class Container extends DisplayObject {
  children: DisplayObject[];
  addChild(...children: DisplayObject[]): DisplayObject;
  removeChild(...children: DisplayObject[]): boolean;
  removeAllChildren(): void;
}

export class Stage extends Container {
  constructor(canvas: CanvasLike | unknown);
  canvas: CanvasLike | unknown;
  update(event?: unknown): void;
  clear(): void;
}

export class Graphics {
  clear(): this;
  beginFill(color: string): this;
  endFill(): this;
  drawRect(x: number, y: number, width: number, height: number): this;
  drawCircle(x: number, y: number, radius: number): this;
}

export class Shape extends DisplayObject {
  constructor(graphics?: Graphics);
  graphics: Graphics;
}

export class Bitmap extends DisplayObject {
  constructor(image: unknown);
  image: unknown;
}

export class Text extends DisplayObject {
  constructor(text?: string, font?: string, color?: string);
  text: string;
  font: string;
  color: string;
  lineHeight: number;
  lineWidth: number | null;
}

export class SpriteSheet {
  constructor(data: Record<string, unknown>);
  complete: boolean;
  framerate: number;
  getFrame(frameIndex: number): object | null;
  getAnimation(name: string): object | null;
}

export class Sprite extends DisplayObject {
  constructor(spriteSheet: SpriteSheet, frameOrAnimation?: number | string);
  gotoAndPlay(frameOrAnimation: number | string): void;
  gotoAndStop(frameOrAnimation: number | string): void;
}

export class BitmapText extends Container {
  constructor(text?: string, spriteSheet?: SpriteSheet);
  text: string;
  spriteSheet: SpriteSheet;
}

export interface CreateJSLite {
  createCanvas(width?: number, height?: number): CanvasLike;
  globalDispatcher: EventDispatcher;
  canvas: CanvasLike | null;
  EventDispatcher: typeof EventDispatcher;
  DisplayObject: typeof DisplayObject;
  Container: typeof Container;
  Stage: typeof Stage;
  Graphics: typeof Graphics;
  Shape: typeof Shape;
  Bitmap: typeof Bitmap;
  Text: typeof Text;
  SpriteSheet: typeof SpriteSheet;
  Sprite: typeof Sprite;
  BitmapText: typeof BitmapText;
  Touch: Record<string, Function>;
  performance: Record<string, unknown>;
  Ticker: EventDispatcher & Record<string, unknown>;
  [key: string]: unknown;
}

declare const createjs: CreateJSLite;
export default createjs;
