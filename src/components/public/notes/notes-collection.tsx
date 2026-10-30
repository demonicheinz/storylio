import { renderPublicMDX } from "@/lib/public-mdx";
import { getPublicNote } from "@/lib/public-notes";
import { formatDate } from "@/lib/utils";
import { ExpandableNotes, type NoteView } from "./expandable-notes";

type NoteSource = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
};

export async function NotesCollection({
  posts,
  selectedSlug,
  home = false,
}: {
  posts: NoteSource[];
  selectedSlug?: string;
  home?: boolean;
}) {
  const render = async (note: NoteSource): Promise<NoteView> => ({
    id: note.id,
    slug: note.slug,
    title: note.title,
    excerpt: note.excerpt,
    dateISO: (note.publishedAt ?? note.createdAt).toISOString(),
    dateLabel: formatDate(note.publishedAt ?? note.createdAt),
    body: await renderPublicMDX(note.content, "post"),
  });
  const notes = await Promise.all(posts.map(render));
  const extra =
    selectedSlug && !posts.some((post) => post.slug === selectedSlug)
      ? await getPublicNote(selectedSlug)
      : null;
  const selectedNote = extra ? await render(extra) : null;
  return (
    <ExpandableNotes notes={notes} selectedNote={selectedNote} home={home} />
  );
}
