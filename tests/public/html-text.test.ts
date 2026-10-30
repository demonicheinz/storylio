import { describe, expect, it } from "vitest";
import { htmlText } from "../helpers/html-text";

describe("rendered HTML text extraction", () => {
  it("extracts nested text without including comments or tag attributes", () => {
    expect(
      htmlText(
        '<h2 title="1 > 0">Build <em>together</em><!-- gap --> now</h2>',
      ),
    ).toBe("Build together now");
  });

  it("decodes escaped markup as literal text without parsing it a second time", () => {
    expect(
      htmlText("<p>&lt;script&gt; &amp; &quot;hello&quot; &#39;world&#39;</p>"),
    ).toBe("<script> & \"hello\" 'world'");
  });

  it("preserves adjacent values used by summary assertions", () => {
    expect(
      htmlText(
        "<dl><dt>Published</dt><dd>1</dd><dt>Drafts</dt><dd>0</dd></dl>",
      ),
    ).toBe("Published1Drafts0");
  });
});
