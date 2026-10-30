import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/auth-flow";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = {
  title: "Reset password — Storylio",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function ResetPasswordPage() {
  return (
    <AuthFlow>
      <RecoveryForm reset />
    </AuthFlow>
  );
}
