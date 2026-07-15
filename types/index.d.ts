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
  on(type: string, listener: (event: Event) => void, scope?: unknown, once?: boolean, data?: unknown, useCapture?: boolean): Function;
  removeEventListener(type: string, listener: Function, useCapture?: boolean): void;
  off(type: string, listener: Function, useCapture?: boolean): void;
  removeAllEventListeners(type?: string): void;
  dispatchEvent(event: string | Event, bubbles?: boolean, cancelable?: boolean): boolean;
  hasEventListener(type: string): boolean;
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
  constructor(canvas: CanvasLike | unknown);
  canvas: CanvasLike | unknown;
  update(event?: unknown): void;
  clear(): void;
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
  compiledRender: boolean;
  commandCount: number;
  canvasCalls: number;
  offscreenSurfaces: number;
  workerEnabled: boolean;
}

interface CreateJSPerformance extends PerformanceMetrics {
  enable: boolean;
  phase2: boolean;
  phase3: boolean;
  inspect: boolean;
  debug: boolean;
  log: boolean;
  reset(): void;
  getMetrics(): PerformanceMetrics;
}

declare class OffscreenCache {
  maxSurfaces: number;
  maxPixels: number;
  readonly size: number;
  created: number;
  reused: number;
  acquire(width: number, height: number): CanvasLike;
  release(surface: CanvasLike): void;
  clear(): void;
  static shared: OffscreenCache;
}

declare class TextureManager {
  register(key: string, image: unknown): unknown;
  get(key: string): unknown;
  retain(key: string): unknown;
  load(key: string, loader: (key: string) => unknown | Promise<unknown>): Promise<unknown>;
  release(key: string): boolean;
  clear(): void;
  static shared: TextureManager;
}

declare class WorkerRenderer {
  constructor(worker?: unknown);
  enabled: boolean;
  connect(worker: unknown): boolean;
  computeMatrices(items: Array<{local: number[]; parent?: number[]}>): Promise<number[][]>;
  disconnect(): void;
  static compute(items: Array<{local: number[]; parent?: number[]}>): number[][];
}

declare class QualityManager {
  level: "high" | "medium" | "low";
  update(frameTime: number): string;
  static shared: QualityManager;
}

declare class Graphics {
  clear(): this;
  beginFill(color: string): this;
  endFill(): this;
  drawRect(x: number, y: number, width: number, height: number): this;
  drawCircle(x: number, y: number, radius: number): this;
}

declare class Shape extends DisplayObject {
  constructor(graphics?: Graphics);
  graphics: Graphics;
}

declare class Bitmap extends DisplayObject {
  constructor(image: unknown);
  image: unknown;
}

declare class Text extends DisplayObject {
  constructor(text?: string, font?: string, color?: string);
  text: string;
  font: string;
  color: string;
  textAlign: string;
  getMeasuredWidth(): number;
  getMeasuredHeight(): number;
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

export interface CreateJS {
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
  ButtonHelper: typeof ButtonHelper;
  Touch: TouchAPI;
  performance: CreateJSPerformance;
  quality: "auto" | "high" | "medium" | "low";
  OffscreenCache: typeof OffscreenCache;
  TextureManager: typeof TextureManager;
  WorkerRenderer: typeof WorkerRenderer;
  workerRenderer: WorkerRenderer;
  QualityManager: typeof QualityManager;
  Ticker: EventDispatcher & Record<string, unknown>;
  [key: string]: unknown;
}

declare const createjs: CreateJS;
export default createjs;
