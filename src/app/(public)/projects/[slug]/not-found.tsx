import { SpaceState } from "@/components/common/space-state";
export default function ProjectNotFound() {
  return (
    <SpaceState
      title="This project isn’t available."
      description="It may have moved or is no longer published. Browse the archive for the work currently available."
      archive={{ href: "/projects", label: "Back to projects" }}
    />
  );
}
