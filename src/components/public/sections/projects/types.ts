export type ProjectListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  contribution: string | null;
  coverImage: string | null;
  thumbnailImageUrl: string | null;
  isFeatured: boolean;
  isClosedSource: boolean;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  order: number;
};
