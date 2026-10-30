import { SpaceState } from "@/components/common/space-state";
export default function ArticleNotFound() {
  return (
    <SpaceState
      title="This article isn’t available."
      description="It may have moved or is no longer published. Browse the writing archive for the posts currently available."
      archive={{ href: "/blog", label: "Back to writing" }}
    />
  );
}
