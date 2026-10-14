interface CanvasLike {
  width: number;
  height: number;
  getContext(type: "2d"): unknown;
}

declare class Matrix2D {
  constructor(a?: number, b?: number, c?: number, d?: number, tx?: number, ty?: number);
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
  identity(): this;
  setValues(a?: number, b?: number, c?: number, d?: number, tx?: number, ty?: number): this;
  clone(): Matrix2D;
  copy(matrix: Matrix2D): this;
  invert(): this;
  appendMatrix(matrix: Matrix2D): this;
  prependMatrix(matrix: Matrix2D): this;
}

interface Matrix2DPool {
  maxSize: number;
  readonly size: number;
  get(): Matrix2D;
  release(matrix: Matrix2D): void;
  clear(): void;
}

declare class Event {
  constructor(type: string, bubbles?: boolean, cancelable?: boolean);
  type: string;
  target: unknown;
  currentTarget: unknown;
  defaultPrevented: boolean;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
  remove(): void;
}

declare class EventDispatcher {
  addEventListener(type: string, listener: (event: Event) => void, useCapture?: boolean): Function;
  on(type: "tick", listener: (event: TickEvent) => void, scope?: unknown, once?: boolean, data?: unknown, useCapture?: boolean): Function;
  on(type: string, listener: (event: Event) => void, scope?: unknown, once?: boolean, data?: unknown, useCapture?: boolean): Function;
  removeEventListener(type: string, listener: Function, useCapture?: boolean): void;
  off(type: string, listener: Function, useCapture?: boolean): void;
  removeAllEventListeners(type?: string): void;
  dispatchEvent(event: string | Event, bubbles?: boolean, cancelable?: boolean): boolean;
  hasEventListener(type: string): boolean;
}

interface Rectangle { x: number; y: number; width: number; height: number; }
interface TickEvent extends Event { delta: number; paused: boolean; time: number; runTime: number; }
interface TickerAPI extends EventDispatcher {
  readonly RAF: string; readonly RAF_SYNCHED: string; readonly TIMEOUT: string;
  framerate: number; interval: number; paused: boolean; maxDelta: number; timingMode: string | null;
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  addEventListener(type: "tick", listener: ((event: TickEvent) => void) | {handleEvent(event: TickEvent): void}): Function;
  addEventListener(type: string, listener: (event: Event) => void, useCapture?: boolean): Function;
  reset(): void; init(): void; getMeasuredFPS(ticks?: number): number;
}
declare class DisplayObject extends EventDispatcher {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  visible: boolean;
  parent: Container | null;
  readonly stage: Stage | null;
  regX: number; regY: number; skewX: number; skewY: number; scale: number;
  snapToPixel: boolean; transformMatrix: Matrix2D | null;
  mask: DisplayObject | null; shadow: unknown; filters: unknown[] | null;
  cacheCanvas: CanvasLike | null; bitmapCache: unknown; cacheID: number | undefined;
  tickEnabled: boolean; mouseEnabled: boolean; cursor: string | null;
  set(props: object): this; invalidate(): this;
  setBounds(x: number, y: number, width: number, height: number): void;
  getBounds(): Rectangle | null; getMatrix(matrix?: Matrix2D): Matrix2D;
  localToGlobal(x: number, y: number): {x:number;y:number};
  globalToLocal(x: number, y: number): {x:number;y:number};
  updateCache(compositeOperation?: string): void;
  cache(x: number, y: number, width: number, height: number, scale?: number): void;
  uncache(): void;
}

declare class Container extends DisplayObject {
  children: DisplayObject[];
  addChild(...children: DisplayObject[]): DisplayObject;
  removeChild(...children: DisplayObject[]): boolean;
  removeAllChildren(): void;
}

declare class Stage extends Container {
  constructor(canvas: CanvasLike);
  canvas: CanvasLike | null;
  update(event?: unknown): void;
  clear(): void;
  dispose(): void;
  handleEvent(event: unknown): void;
  tickOnUpdate: boolean; autoClear: boolean; snapToPixelEnabled: boolean;
  cacheBudgetPixels: number;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  updateTime: number;
  drawCount: number;
  displayObjectCount: number;
  memory: number | null;
  dirtyRect: number;
  fullRender: boolean;
  cacheObject: number;
  drawCalls: number;
  skippedObjects: number;
  bitmapBatches: number;
  cachePixels: number; frameTimeP50: number; frameTimeP95: number;
}

interface CreateJSPerformance extends PerformanceMetrics {
  enable: boolean;
  phase2: boolean;
  debug: boolean;
  log: boolean;
  reset(): void;
  getMetrics(): PerformanceMetrics;
}

declare class Graphics {
  trackCommandChanges: boolean;
  clear(): this;
  beginFill(color: string): this;
  endFill(): this;
  drawRect(x: number, y: number, width: number, height: number): this;
  drawCircle(x: number, y: number, radius: number): this;
  drawRoundRect(x: number, y: number, width: number, height: number, radius: number): this;
  setStrokeStyle(thickness: number, caps?: string | number, joints?: string | number, miterLimit?: number, ignoreScale?: boolean): this;
  beginStroke(color: string): this; endStroke(): this;
  beginLinearGradientFill(colors: string[], ratios: number[], x0: number, y0: number, x1: number, y1: number): this;
  append(command: {exec(context: unknown): void}, clean?: boolean): this;
}

declare class Shape extends DisplayObject {
  constructor(graphics?: Graphics);
  graphics: Graphics;
}

declare class Bitmap extends DisplayObject {
  constructor(image: unknown);
  image: unknown;
  sourceRect: Rectangle | null;
}

declare class Text extends DisplayObject {
  constructor(text?: string, font?: string, color?: string);
  text: string;
  font: string;
  color: string;
  textAlign: string; textBaseline: string; outline: number; maxWidth: number | null;
  lineHeight: number; lineWidth: number | null;
  getMeasuredWidth(): number;
  getMeasuredHeight(): number;
}

declare class SpriteSheet extends EventDispatcher {
  constructor(data: Record<string, unknown>);
  complete: boolean; framerate: number;
  getFrame(frame: number): object | null;
  getNumFrames(animation?: string): number;
  getAnimation(name: string): object | null;
}
declare class Sprite extends DisplayObject {
  constructor(spriteSheet: SpriteSheet, frameOrAnimation?: number | string);
  spriteSheet: SpriteSheet; paused: boolean; currentFrame: number;
  gotoAndPlay(frameOrAnimation: number | string): void;
  gotoAndStop(frameOrAnimation: number | string): void;
}
declare class BitmapText extends Container {
  constructor(text?: string, spriteSheet?: SpriteSheet);
  text: string; spriteSheet: SpriteSheet;
}
declare class MovieClip extends Container {
  constructor(props?: Record<string, unknown>);
  paused: boolean;
  currentFrame: number;
  timeline: {addTween(...tweens: object[]): object};
  gotoAndPlay(position: number | string): void;
  gotoAndStop(position: number | string): void;
}
declare class ButtonHelper {
  constructor(
    target: unknown,
    outLabel?: string | number,
    overLabel?: string | number,
    downLabel?: string | number,
    play?: boolean,
    hitArea?: unknown,
    hitLabel?: string | number,
  );
  target: unknown;
  enabled: boolean;
  play: boolean;
  handleEvent(event: { type: string }): void;
  destroy(): void;
}

interface TouchAPI {
  isSupported(): boolean;
  enable(stage: Stage, options?: {
    pixelRatio?: number;
    singleTouch?: boolean;
    allowDefault?: boolean;
  }): boolean;
  disable(stage: Stage): boolean;
  handleEvent(stage: Stage, event: unknown): boolean;
}

export interface CreateJSCore {
  createCanvas(width?: number, height?: number): CanvasLike;
  globalDispatcher: EventDispatcher;
  canvas: CanvasLike | null;
  Event: typeof Event;
  EventDispatcher: typeof EventDispatcher;
  DisplayObject: typeof DisplayObject;
  Matrix2D: typeof Matrix2D;
  Matrix2DPool: Matrix2DPool;
  Container: typeof Container;
  Stage: typeof Stage;
  Graphics: typeof Graphics;
  Shape: typeof Shape;
  Bitmap: typeof Bitmap;
  Text: typeof Text;
  Touch: TouchAPI;
  performance: CreateJSPerformance;
  SpriteSheet: typeof SpriteSheet; Sprite: typeof Sprite; BitmapText: typeof BitmapText;
  Ticker: TickerAPI;
}

export interface CreateJS extends CreateJSCore {
  ButtonHelper: typeof ButtonHelper;
  MovieClip: typeof MovieClip;
  [key: string]: unknown;
}

declare const createjs: CreateJS;
export default createjs;
