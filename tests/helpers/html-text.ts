import { fromHtml } from "hast-util-from-html";
import { toString as hastToString } from "hast-util-to-string";

/** Extract text for render assertions; this is not an HTML sanitizer. */
export function htmlText(html: string): string {
  return hastToString(fromHtml(html, { fragment: true }));
}
