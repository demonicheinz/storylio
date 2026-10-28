/** Exact upstream cursor distances, using a separable squared-distance transform. */
export function createCursorDistanceField(inside: Uint8Array, size: number) {
  const edges = new Uint8Array(inside.length);
  const squared = new Float64Array(inside.length).fill(1e9);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      const value = inside[index];
      edges[index] = Number(
        (x > 0 && inside[index - 1] !== value) ||
          (x < size - 1 && inside[index + 1] !== value) ||
          (y > 0 && inside[index - size] !== value) ||
          (y < size - 1 && inside[index + size] !== value),
      );
    }
    let nearest = -1;
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      if (edges[index]) nearest = x;
      if (nearest >= 0) squared[index] = (x - nearest) ** 2;
    }
    nearest = size;
    for (let x = size - 1; x >= 0; x--) {
      const index = y * size + x;
      if (edges[index]) nearest = x;
      if (nearest < size) {
        squared[index] = Math.min(squared[index], (x - nearest) ** 2);
      }
    }
  }

  const result = new Float32Array(inside.length);
  const sites = new Int32Array(size);
  const boundaries = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) {
    let envelope = 0;
    sites[0] = 0;
    boundaries[0] = -Infinity;
    boundaries[1] = Infinity;
    for (let y = 1; y < size; y++) {
      let intersection: number;
      while (true) {
        const previous = sites[envelope];
        intersection =
          (squared[y * size + x] +
            y * y -
            squared[previous * size + x] -
            previous * previous) /
          (2 * (y - previous));
        if (envelope === 0 || intersection > boundaries[envelope]) break;
        envelope--;
      }
      sites[++envelope] = y;
      boundaries[envelope] = intersection;
      boundaries[envelope + 1] = Infinity;
    }
    let selected = 0;
    for (let y = 0; y < size; y++) {
      while (boundaries[selected + 1] < y) selected++;
      const nearest = sites[selected];
      const distance =
        (Math.sqrt((y - nearest) ** 2 + squared[nearest * size + x]) + 0.5) *
        (24 / size);
      const index = y * size + x;
      result[index] = inside[index] ? -distance : distance;
    }
  }
  return result;
}
