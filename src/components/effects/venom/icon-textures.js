/** Upstream cursor artwork and rasterization, cached per browser module. See LICENSE. */
import { createCursorDistanceField } from "./distance-field";
import { iconSources } from "./icons";

let prepared;

function prepareIcon(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const color = document.createElement("canvas");
        color.width = color.height = 256;
        color.getContext("2d").drawImage(image, 0, 0, 256, 256);

        const size = 96;
        const mask = document.createElement("canvas");
        mask.width = mask.height = size;
        const context = mask.getContext("2d");
        context.drawImage(image, 0, 0, size, size);
        const alpha = context.getImageData(0, 0, size, size).data;
        const inside = new Uint8Array(size * size);
        for (let i = 0; i < inside.length; i++) {
          inside[i] = alpha[i * 4 + 3] > 127 ? 1 : 0;
        }
        const distance = createCursorDistanceField(inside, size);
        resolve({ color, distance, size });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Venom cursor artwork unavailable"));
    image.src =
      "data:image/svg+xml," +
      encodeURIComponent(
        decodeURIComponent(source.slice(source.indexOf(",") + 1)).replace(
          /\sfilter=(["'])url\([^)]*\)\1/g,
          "",
        ),
      );
  });
}

/** Two CPU-side assets are shared; every scene still owns its GPU textures. */
export function prepareVenomAssets() {
  prepared ??= Promise.all([
    prepareIcon(iconSources["--cur-hand"]),
    prepareIcon(iconSources["--cur-arrow"]),
  ])
    .then(([hand, arrow]) => ({ hand, arrow }))
    .catch((error) => {
      prepared = undefined;
      throw error;
    });
  return prepared;
}
