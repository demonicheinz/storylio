export const PostStatus = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const ProjectStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const HomeSectionType = { PHASE: "PHASE", LOGO: "LOGO" } as const;
export type HomeSectionType =
  (typeof HomeSectionType)[keyof typeof HomeSectionType];
