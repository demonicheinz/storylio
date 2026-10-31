"use client";

import { useRouter } from "next/navigation";
import { ProjectEditor } from "@/features/dashboard/projects/components/project-editor";

export default function NewProjectPage() {
  const { bfcacheId } = useRouter();
  return <ProjectEditor key={bfcacheId} mode="create" />;
}
