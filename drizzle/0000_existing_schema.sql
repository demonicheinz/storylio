CREATE TYPE "public"."HomeSectionType" AS ENUM('PHASE', 'LOGO');--> statement-breakpoint
CREATE TYPE "public"."PostStatus" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "AboutContent" (
	"id" text PRIMARY KEY NOT NULL,
	"introEn" text,
	"introId" text,
	"howIWorkEn" text,
	"howIWorkId" text,
	"whatIValueEn" text,
	"whatIValueId" text,
	"defaultLanguage" text DEFAULT 'en' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp (3),
	"refreshTokenExpiresAt" timestamp (3),
	"scope" text,
	"password" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Education" (
	"id" text PRIMARY KEY NOT NULL,
	"institution" text NOT NULL,
	"degree" text,
	"field" text,
	"location" text,
	"startYear" text,
	"endYear" text,
	"descriptionEn" text,
	"descriptionId" text,
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GalleryItem" (
	"id" text PRIMARY KEY NOT NULL,
	"imageUrl" text NOT NULL,
	"caption" text,
	"category" text,
	"description" text,
	"altText" text,
	"width" integer,
	"height" integer,
	"size" integer,
	"aspectRatio" double precision,
	"blurDataUrl" text,
	"isVisible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "HomeSection" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "HomeSectionType" NOT NULL,
	"label" text NOT NULL,
	"content" text,
	"imageUrl" text,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"publicId" text NOT NULL,
	"filename" text NOT NULL,
	"size" integer NOT NULL,
	"format" text NOT NULL,
	"width" integer,
	"height" integer,
	"aspectRatio" double precision,
	"blurDataUrl" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"publicKey" text NOT NULL,
	"userId" text NOT NULL,
	"credentialID" text NOT NULL,
	"counter" integer NOT NULL,
	"deviceType" text NOT NULL,
	"backedUp" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"createdAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"coverImage" text,
	"status" "PostStatus" DEFAULT 'DRAFT' NOT NULL,
	"publishedAt" timestamp (3),
	"viewCount" integer DEFAULT 0 NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PostToTag" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"contribution" text,
	"content" text,
	"coverImage" text,
	"thumbnailImageUrl" text,
	"ogImageUrl" text,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isClosedSource" boolean DEFAULT false NOT NULL,
	"techStack" text[],
	"liveUrl" text,
	"githubUrl" text,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "ProjectStatus" DEFAULT 'DRAFT' NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectScreenshot" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"imageUrl" text NOT NULL,
	"caption" text,
	"altText" text,
	"width" integer,
	"height" integer,
	"aspectRatio" double precision,
	"blurDataUrl" text,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Skill" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"name" text NOT NULL,
	"level" text,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SkillCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"descriptionEn" text,
	"descriptionId" text,
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Testimonial" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"company" text,
	"avatar" text,
	"content" text NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"tagline" text,
	"bio" text,
	"github" text,
	"instagram" text,
	"twitter" text,
	"websiteUrl" text,
	"publicEmail" text
);
--> statement-breakpoint
CREATE TABLE "Verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now(),
	"updatedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "ViewEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WorkExperience" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"location" text,
	"type" text,
	"startDate" text,
	"endDate" text,
	"isCurrent" boolean DEFAULT false NOT NULL,
	"descriptionEn" text,
	"descriptionId" text,
	"highlightsEn" text[],
	"highlightsId" text[],
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectScreenshot" ADD CONSTRAINT "ProjectScreenshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."SkillCategory"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Post_slug_key" ON "Post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "Project_slug_key" ON "Project" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ProjectScreenshot_projectId_idx" ON "ProjectScreenshot" USING btree ("projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "Session_token_key" ON "Session" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ViewEvent_createdAt_idx" ON "ViewEvent" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "ViewEvent_type_slug_createdAt_idx" ON "ViewEvent" USING btree ("type","slug","createdAt");