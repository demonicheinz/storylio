"use client";

import { useRouter } from "next/navigation";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";

export default function NewPostPage() {
  const { bfcacheId } = useRouter();
  return <PostEditor key={bfcacheId} mode="create" />;
}
