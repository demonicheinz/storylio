import sharp from "sharp";

const BLUR_WIDTH = 12;
const MAX_REMOTE_IMAGE_BYTES = 25 * 1024 * 1024;

export async function generateBlurDataUrl(
  buffer: Buffer,
): Promise<string | null> {
  try {
    const output = await sharp(buffer, { animated: false })
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .blur(1)
      .webp({ quality: 35 })
      .toBuffer();

    return `data:image/webp;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}

export function computeAspectRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): number | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  return width / height;
}

export async function inspectImageBuffer(buffer: Buffer): Promise<{
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
}> {
  const metadata = await sharp(buffer, { animated: false }).metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  return {
    width,
    height,
    aspectRatio: computeAspectRatio(width, height),
  };
}

export async function fetchRemoteImageBuffer(url: string): Promise<Buffer> {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP(S) image URLs are supported");
  }

  const response = await fetch(parsedUrl, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Image request failed with HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength && contentLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error("Remote image exceeds the 25 MB safety limit");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error("Remote image exceeds the 25 MB safety limit");
  }

  return buffer;
}

export async function resolveRemoteImageMetadata(url: string): Promise<{
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
}> {
  const buffer = await fetchRemoteImageBuffer(url);
  const [metadata, blurDataUrl] = await Promise.all([
    inspectImageBuffer(buffer),
    generateBlurDataUrl(buffer),
  ]);

  return { ...metadata, blurDataUrl };
}
