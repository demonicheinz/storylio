import { describe, expect, it } from "vitest";
import { createCursorDistanceField } from "@/components/effects/venom/distance-field";

// The upstream exhaustive boundary search is the oracle for the faster transform.
function upstreamDistanceField(inside: Uint8Array, size: number) {
  const edges: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = inside[y * size + x];
      if (
        (x > 0 && inside[y * size + x - 1] !== value) ||
        (x < size - 1 && inside[y * size + x + 1] !== value) ||
        (y > 0 && inside[(y - 1) * size + x] !== value) ||
        (y < size - 1 && inside[(y + 1) * size + x] !== value)
      ) {
        edges.push([x, y]);
      }
    }
  }
  return Float32Array.from(inside, (value, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    let best = 1e9;
    for (const [edgeX, edgeY] of edges) {
      best = Math.min(best, (x - edgeX) ** 2 + (y - edgeY) ** 2);
    }
    const distance = (Math.sqrt(best) + 0.5) * (24 / size);
    return value ? -distance : distance;
  });
}

describe("Venom cursor distance field", () => {
  it.each([
    ["empty", 8, () => false],
    ["filled", 8, () => true],
    ["single pixel", 7, (x: number, y: number) => x === 3 && y === 3],
    ["border", 9, (x: number, y: number) => x === 0 || y === 0],
    ["checkerboard", 12, (x: number, y: number) => (x + y) % 2 === 0],
    [
      "96px cursor mask",
      96,
      (x: number, y: number) => (x - 48) ** 2 + (y - 48) ** 2 < 32 ** 2,
    ],
  ] as const)("matches upstream exactly for %s", (_name, size, pixel) => {
    const inside = Uint8Array.from({ length: size * size }, (_, index) =>
      Number(pixel(index % size, Math.floor(index / size))),
    );
    expect(createCursorDistanceField(inside, size)).toEqual(
      upstreamDistanceField(inside, size),
    );
  });

  it("matches upstream for deterministic irregular masks and empty rows", () => {
    let seed = 41;
    for (let size = 1; size <= 24; size++) {
      const inside = Uint8Array.from({ length: size * size }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed >>> 31;
      });
      expect(createCursorDistanceField(inside, size)).toEqual(
        upstreamDistanceField(inside, size),
      );
    }
  });
});
