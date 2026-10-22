import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { describe, it } from "vitest";
import { GET } from "../../src/app/og/route";
import {
  generateBlurDataUrl,
  inspectImageBuffer,
} from "../../src/lib/image-metadata";

describe("image processing after security updates", () => {
  it("preserves image dimensions and emits a decodable WebP placeholder", async () => {
    const image = await sharp({
      create: {
        width: 24,
        height: 16,
        channels: 4,
        background: { r: 139, g: 92, b: 246, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    assert.deepEqual(await inspectImageBuffer(image), {
      width: 24,
      height: 16,
      aspectRatio: 1.5,
    });

    const blur = await generateBlurDataUrl(image);
    assert.ok(blur);
    assert.match(blur, /^data:image\/webp;base64,/);
    const metadata = await sharp(
      Buffer.from(blur.slice(blur.indexOf(",") + 1), "base64"),
    ).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 12);
    assert.equal(metadata.height, 8);
  });

  it("rejects invalid image metadata and safely skips invalid placeholders", async () => {
    const invalid = Buffer.from("not an image");

    await assert.rejects(inspectImageBuffer(invalid));
    assert.equal(await generateBlurDataUrl(invalid), null);
  });

  it("renders the OG route as a 1200 by 630 PNG with next/og", async () => {
    const response = await GET(
      new NextRequest(
        "https://storylio.test/og?title=Security%20check&type=project",
      ),
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^image\/png/);

    const image = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
  });
});
