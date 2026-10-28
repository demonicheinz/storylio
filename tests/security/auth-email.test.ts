import { describe, expect, it } from "vitest";
import { authEmail } from "@/lib/auth-email";

describe("transactional auth email", () => {
  it("separates current-address approval from new-address verification", () => {
    const approval = authEmail({
      to: "old@example.test",
      newEmail: "new@example.test",
      url: "https://storylio.test/verify-email?token=x&callbackURL=y",
      name: '<img src=x onerror="alert(1)">',
    });
    expect(approval.to).toBe("old@example.test");
    expect(approval.subject).toMatch(/Approve/);
    expect(approval.html).toContain("new@example.test");
    expect(approval.html).not.toContain("<img");
    expect(approval.html).toContain("&amp;callbackURL");
    const verification = authEmail({
      to: "new@example.test",
      url: "https://storylio.test/verify-email",
    });
    expect(verification.to).toBe("new@example.test");
    expect(verification.subject).toMatch(/Verify/);
  });
});
