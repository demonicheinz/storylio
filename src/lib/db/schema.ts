import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(createId);
const createdAt = () =>
  timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const postStatus = pgEnum("PostStatus", ["DRAFT", "PUBLISHED"]);
export const projectStatus = pgEnum("ProjectStatus", ["DRAFT", "PUBLISHED"]);
export const homeSectionType = pgEnum("HomeSectionType", ["PHASE", "LOGO"]);

export const user = pgTable(
  "User",
  {
    id: id(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    image: text("image"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    tagline: text("tagline"),
    bio: text("bio"),
    github: text("github"),
    instagram: text("instagram"),
    twitter: text("twitter"),
    websiteUrl: text("websiteUrl"),
    publicEmail: text("publicEmail"),
  },
  (table) => [uniqueIndex("User_email_key").on(table.email)],
);

export const session = pgTable(
  "Session",
  {
    id: id(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull(),
  },
  (table) => [
    uniqueIndex("Session_token_key").on(table.token),
    foreignKey({
      name: "Session_userId_fkey",
      columns: [table.userId],
      foreignColumns: [user.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const account = pgTable(
  "Account",
  {
    id: id(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "Account_userId_fkey",
      columns: [table.userId],
      foreignColumns: [user.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const verification = pgTable("Verification", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", {
    precision: 3,
    mode: "date",
  }).defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const post = pgTable(
  "Post",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: text("coverImage"),
    status: postStatus("status").default("DRAFT").notNull(),
    publishedAt: timestamp("publishedAt", { precision: 3, mode: "date" }),
    viewCount: integer("viewCount").default(0).notNull(),
    authorId: text("authorId").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("Post_slug_key").on(table.slug),
    foreignKey({
      name: "Post_authorId_fkey",
      columns: [table.authorId],
      foreignColumns: [user.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const project = pgTable(
  "Project",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    contribution: text("contribution"),
    content: text("content"),
    coverImage: text("coverImage"),
    thumbnailImageUrl: text("thumbnailImageUrl"),
    ogImageUrl: text("ogImageUrl"),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    isClosedSource: boolean("isClosedSource").default(false).notNull(),
    // Prisma's SQL left array columns nullable; keep the physical schema unchanged.
    techStack: text("techStack")
      .array()
      .$defaultFn(() => []),
    liveUrl: text("liveUrl"),
    githubUrl: text("githubUrl"),
    order: integer("order").default(0).notNull(),
    status: projectStatus("status").default("DRAFT").notNull(),
    viewCount: integer("viewCount").default(0).notNull(),
    authorId: text("authorId").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("Project_slug_key").on(table.slug),
    foreignKey({
      name: "Project_authorId_fkey",
      columns: [table.authorId],
      foreignColumns: [user.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const projectScreenshot = pgTable(
  "ProjectScreenshot",
  {
    id: id(),
    projectId: text("projectId").notNull(),
    imageUrl: text("imageUrl").notNull(),
    caption: text("caption"),
    altText: text("altText"),
    width: integer("width"),
    height: integer("height"),
    aspectRatio: doublePrecision("aspectRatio"),
    blurDataUrl: text("blurDataUrl"),
    order: integer("order").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("ProjectScreenshot_projectId_idx").on(table.projectId),
    foreignKey({
      name: "ProjectScreenshot_projectId_fkey",
      columns: [table.projectId],
      foreignColumns: [project.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const viewEvent = pgTable(
  "ViewEvent",
  {
    id: id(),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("ViewEvent_createdAt_idx").on(table.createdAt),
    index("ViewEvent_type_slug_createdAt_idx").on(
      table.type,
      table.slug,
      table.createdAt,
    ),
  ],
);

export const galleryItem = pgTable("GalleryItem", {
  id: id(),
  imageUrl: text("imageUrl").notNull(),
  caption: text("caption"),
  category: text("category"),
  description: text("description"),
  altText: text("altText"),
  width: integer("width"),
  height: integer("height"),
  size: integer("size"),
  aspectRatio: doublePrecision("aspectRatio"),
  blurDataUrl: text("blurDataUrl"),
  isVisible: boolean("isVisible").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: createdAt(),
});

export const tag = pgTable(
  "Tag",
  {
    id: id(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("Tag_name_key").on(table.name)],
);

export const postToTag = pgTable(
  "_PostToTag",
  {
    postId: text("A").notNull(),
    tagId: text("B").notNull(),
  },
  (table) => [
    primaryKey({
      name: "_PostToTag_AB_pkey",
      columns: [table.postId, table.tagId],
    }),
    index("_PostToTag_B_index").on(table.tagId),
    foreignKey({
      name: "_PostToTag_A_fkey",
      columns: [table.postId],
      foreignColumns: [post.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      name: "_PostToTag_B_fkey",
      columns: [table.tagId],
      foreignColumns: [tag.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const media = pgTable("Media", {
  id: id(),
  url: text("url").notNull(),
  publicId: text("publicId").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  format: text("format").notNull(),
  width: integer("width"),
  height: integer("height"),
  aspectRatio: doublePrecision("aspectRatio"),
  blurDataUrl: text("blurDataUrl"),
  createdAt: createdAt(),
});

export const testimonial = pgTable("Testimonial", {
  id: id(),
  name: text("name").notNull(),
  role: text("role"),
  company: text("company"),
  avatar: text("avatar"),
  content: text("content").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: createdAt(),
});

export const homeSection = pgTable("HomeSection", {
  id: id(),
  type: homeSectionType("type").notNull(),
  label: text("label").notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  order: integer("order").default(0).notNull(),
  createdAt: createdAt(),
});

export const aboutContent = pgTable("AboutContent", {
  id: id(),
  introEn: text("introEn"),
  introId: text("introId"),
  howIWorkEn: text("howIWorkEn"),
  howIWorkId: text("howIWorkId"),
  whatIValueEn: text("whatIValueEn"),
  whatIValueId: text("whatIValueId"),
  defaultLanguage: text("defaultLanguage").default("en").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const workExperience = pgTable("WorkExperience", {
  id: id(),
  title: text("title").notNull(),
  company: text("company"),
  location: text("location"),
  type: text("type"),
  startDate: text("startDate"),
  endDate: text("endDate"),
  isCurrent: boolean("isCurrent").default(false).notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionId: text("descriptionId"),
  highlightsEn: text("highlightsEn")
    .array()
    .$defaultFn(() => []),
  highlightsId: text("highlightsId")
    .array()
    .$defaultFn(() => []),
  order: integer("order").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const education = pgTable("Education", {
  id: id(),
  institution: text("institution").notNull(),
  degree: text("degree"),
  field: text("field"),
  location: text("location"),
  startYear: text("startYear"),
  endYear: text("endYear"),
  descriptionEn: text("descriptionEn"),
  descriptionId: text("descriptionId"),
  order: integer("order").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const skillCategory = pgTable("SkillCategory", {
  id: id(),
  name: text("name").notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionId: text("descriptionId"),
  order: integer("order").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const skill = pgTable(
  "Skill",
  {
    id: id(),
    categoryId: text("categoryId").notNull(),
    name: text("name").notNull(),
    level: text("level"),
    icon: text("icon"),
    order: integer("order").default(0).notNull(),
    isVisible: boolean("isVisible").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "Skill_categoryId_fkey",
      columns: [table.categoryId],
      foreignColumns: [skillCategory.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const passkey = pgTable(
  "Passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("publicKey").notNull(),
    userId: text("userId").notNull(),
    credentialID: text("credentialID").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("deviceType").notNull(),
    backedUp: boolean("backedUp").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }),
  },
  (table) => [
    foreignKey({
      name: "Passkey_userId_fkey",
      columns: [table.userId],
      foreignColumns: [user.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  posts: many(post),
  projects: many(project),
}));
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, { fields: [passkey.userId], references: [user.id] }),
}));
export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  tags: many(postToTag),
}));
export const tagRelations = relations(tag, ({ many }) => ({
  posts: many(postToTag),
}));
export const postToTagRelations = relations(postToTag, ({ one }) => ({
  post: one(post, { fields: [postToTag.postId], references: [post.id] }),
  tag: one(tag, { fields: [postToTag.tagId], references: [tag.id] }),
}));
export const projectRelations = relations(project, ({ one, many }) => ({
  author: one(user, { fields: [project.authorId], references: [user.id] }),
  structuredScreenshots: many(projectScreenshot),
}));
export const screenshotRelations = relations(projectScreenshot, ({ one }) => ({
  project: one(project, {
    fields: [projectScreenshot.projectId],
    references: [project.id],
  }),
}));
export const skillCategoryRelations = relations(skillCategory, ({ many }) => ({
  skills: many(skill),
}));
export const skillRelations = relations(skill, ({ one }) => ({
  category: one(skillCategory, {
    fields: [skill.categoryId],
    references: [skillCategory.id],
  }),
}));
