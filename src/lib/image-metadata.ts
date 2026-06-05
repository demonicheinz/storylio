import sharp from "sharp";

const BLUR_WIDTH = 12;

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
  } catch (error) {
    console.error("Blur placeholder generation failed:", error);
    return null;
  }
}
