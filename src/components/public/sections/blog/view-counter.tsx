"use client";

import { useEffect, useState } from "react";

type ViewCounterProps = {
  type?: "post" | "project";
  slug: string;
  initialViews?: number;
};

export function ViewCounter({
  type = "post",
  slug,
  initialViews,
}: ViewCounterProps) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const storageKey = `storylio:viewed:${type}:${slug}`;

    if (window.localStorage.getItem(storageKey)) {
      return;
    }

    window.localStorage.setItem(storageKey, "true");

    fetch(`/api/views/${slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    })
      .then((response) => {
        if (!response.ok) {
          window.localStorage.removeItem(storageKey);
          return null;
        }

        return response.json() as Promise<{ views?: number }>;
      })
      .then((data) => {
        if (typeof data?.views === "number") {
          setViews(data.views);
        }
      })
      .catch(() => {
        window.localStorage.removeItem(storageKey);
      });
  }, [slug, type]);

  return typeof initialViews === "number" && typeof views === "number" ? (
    <span>{views} views</span>
  ) : null;
}
