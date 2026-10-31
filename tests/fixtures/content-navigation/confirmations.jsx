import { useEffect, useState } from "react";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { registerNavigationGuard } from "@/features/dashboard/shared/navigation-guard";

export function ConfirmationsFixture() {
  const [dirty, setDirty] = useState(true);
  const [navigations, setNavigations] = useState(0);
  const [answer, setAnswer] = useState("none");
  useEffect(() => {
    if (!dirty) return;
    const first = registerNavigationGuard(
      "Leave this editor and discard changes?",
    );
    const second = registerNavigationGuard("Another dirty section.");
    return () => {
      first();
      second();
    };
  }, [dirty]);
  return (
    <main className="flex flex-col gap-4 p-4">
      <input aria-label="Fixture draft" defaultValue="Keep this draft" />
      <a
        href="/next"
        onClick={(event) => {
          event.preventDefault();
          setNavigations((value) => value + 1);
        }}
      >
        Leave editor
      </a>
      <a href="#same-page">Same-page anchor</a>
      <button type="button" onClick={() => setDirty(false)}>
        Mark saved
      </button>
      <button
        type="button"
        onClick={async () =>
          setAnswer(
            String(
              await confirmAction("Proceed with this action?", {
                title: "Confirm test action",
                confirmLabel: "Proceed",
                cancelLabel: "Cancel",
                destructive: false,
              }),
            ),
          )
        }
      >
        Ask confirmation
      </button>
      <output data-navigation-count>{navigations}</output>
      <output data-answer>{answer}</output>
    </main>
  );
}
