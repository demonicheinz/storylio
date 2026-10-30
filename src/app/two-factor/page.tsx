import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/auth-flow";
import { TwoFactorForm } from "@/components/auth/two-factor-form";

export const metadata: Metadata = {
  title: "Verify sign-in — Storylio",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function TwoFactorPage() {
  return (
    <AuthFlow>
      <TwoFactorForm />
    </AuthFlow>
  );
}
