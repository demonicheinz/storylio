import { AuthFlow } from "@/components/auth/auth-flow";
import styles from "@/components/auth/sign-in.module.css";
import { TwoFactorSettings } from "@/features/dashboard/settings/components/two-factor-settings";

export default function AuthSecurityFixture() {
  return (
    <AuthFlow>
      <section className={styles.content}>
        <h1 className="mb-6 font-heading text-2xl">
          Two-factor settings fixture
        </h1>
        <TwoFactorSettings />
      </section>
    </AuthFlow>
  );
}
