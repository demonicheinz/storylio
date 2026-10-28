import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/auth-flow";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = {
  title: "Forgot password — Storylio",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function ForgotPasswordPage() {
  return (
    <AuthFlow>
      <RecoveryForm />
    </AuthFlow>
  );
}
