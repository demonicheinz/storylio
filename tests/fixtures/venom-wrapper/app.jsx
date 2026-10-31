import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { VenomButton } from "@/components/common/venom-button";

window.venomFixture = {
  created: 0,
  disposed: 0,
  mode: "ok",
  pending: false,
  preparations: 0,
};
function Fixture() {
  const [mounted, setMounted] = useState(true);
  return (
    <main style={{ padding: 80 }}>
      <button type="button" onClick={() => setMounted(false)}>
        Unmount CTA
      </button>
      <button type="button" onClick={() => setMounted(true)}>
        Mount CTA
      </button>
      {mounted && <VenomButton href="#target">Selected projects</VenomButton>}
      <section id="target" style={{ marginTop: 1000 }}>
        Target
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
