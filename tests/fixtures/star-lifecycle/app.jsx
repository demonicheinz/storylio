import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { FloatingDots } from "@/components/effects/floating-dots";
import GravityStars from "@/components/effects/gravity-stars";

function Fixture() {
  const [mounted, setMounted] = useState(true);
  const [paused, setPaused] = useState(false);
  const dots = new URLSearchParams(location.search).has("dots");
  return (
    <main>
      <div
        style={{ position: "fixed", top: 0, zIndex: 5, background: "#07111d" }}
      >
        <button type="button" onClick={() => setMounted(false)}>
          Unmount stars
        </button>
        <button type="button" onClick={() => setMounted(true)}>
          Mount stars
        </button>
        <button type="button" onClick={() => setPaused((current) => !current)}>
          Toggle pause
        </button>
      </div>
      <div
        data-star-stage
        style={{
          position: "relative",
          marginTop: 100,
          width: 600,
          maxWidth: "100%",
          height: 260,
        }}
      >
        {mounted &&
          (dots ? (
            <FloatingDots count={40} />
          ) : (
            <GravityStars
              paused={paused}
              count={40}
              className="h-full w-full"
            />
          ))}
      </div>
      <div style={{ height: 2000 }} />
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
