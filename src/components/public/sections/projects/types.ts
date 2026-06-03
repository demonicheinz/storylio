export type ProjectListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  order: number;
};
