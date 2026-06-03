"use client";

import { useEffect, useState } from "react";

type ViewCounterProps = {
  slug: string;
  initialViews: number;
};

export function ViewCounter({ slug, initialViews }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const storageKey = `storylio:viewed:${slug}`;

    if (window.localStorage.getItem(storageKey)) {
      return;
    }

    window.localStorage.setItem(storageKey, "true");

    fetch(`/api/views/${slug}`, {
      method: "POST",
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
  }, [slug]);

  return <span>{views} views</span>;
}
