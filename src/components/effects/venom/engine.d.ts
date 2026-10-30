export interface VenomScene {
  pause(options?: { keepVisible?: boolean }): void;
  resume(): void;
  dispose(): void;
}

/** Cache the two CPU-side cursor assets before GPU initialization. */
export function prepareVenomAssets(): Promise<unknown>;

/** Mount a full-size decorative scene; failure leaves the native link visible. */
export function createVenomScene(
  canvas: HTMLCanvasElement,
  link: HTMLAnchorElement,
): VenomScene | null;
