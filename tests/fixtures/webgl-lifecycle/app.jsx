import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import GooeyNav from "@/components/common/gooey-nav";
import { LiveOrb } from "@/components/common/live-orb";

function Fixture() {
  const [mounted, setMounted] = useState(true);
  const [active, setActive] = useState(0);
  return (
    <main>
      <div
        style={{
          position: "fixed",
          top: 0,
          zIndex: 10,
          padding: 8,
          background: "#07111d",
        }}
      >
        <button type="button" onClick={() => setMounted(false)}>
          Unmount engines
        </button>
        <button type="button" onClick={() => setMounted(true)}>
          Mount engines
        </button>
        <button
          type="button"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          Toggle theme
        </button>
      </div>
      {mounted && (
        <section data-engine-stage style={{ padding: "120px 40px 40px" }}>
          <GooeyNav
            ariaLabel="Lifecycle navigation"
            items={[{ label: "Alpha" }, { label: "Beta" }, { label: "Gamma" }]}
            activeIndex={active}
            onChange={setActive}
            animationTime={1800}
          />
          <div style={{ marginTop: 32 }}>
            <LiveOrb
              size={96}
              label="Lifecycle orb"
              variant="webgl"
              interactive={!new URLSearchParams(location.search).has("still")}
            />
          </div>
        </section>
      )}
      <div style={{ height: 2200 }} aria-hidden="true" />
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
