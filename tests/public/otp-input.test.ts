import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "@/components/common/otp-input";

describe("Shared authenticator code input", () => {
  it("exposes native autofill and numeric editing without splitting focus", () => {
    const html = renderToStaticMarkup(
      createElement(OtpInput, {
        id: "code",
        value: "",
        onValueChange: () => {},
      }),
    );
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('autoComplete="one-time-code"');
    expect(html).toContain('maxLength="6"');
  });
  it("accepts a formatted pasted six-digit code without truncating it at spaces", () => {
    const change = vi.fn();
    const input = OtpInput({ onValueChange: change });
    input.props.onChange(input.props.pasteTransformer("123 456"));
    expect(change).toHaveBeenCalledWith("123456");
  });
  it("filters typing while leaving partial or unsupported paste to native editing", () => {
    const change = vi.fn();
    const input = OtpInput({ onValueChange: change });
    input.props.onChange("a1234567");
    expect(change).toHaveBeenCalledWith("123456");
    change.mockClear();
    expect(input.props.pasteTransformer("12")).toBe("12");
    expect(change).not.toHaveBeenCalled();
  });
});
