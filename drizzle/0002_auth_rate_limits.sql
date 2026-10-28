CREATE TABLE "RateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"lastRequest" bigint NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit" USING btree ("key");--> statement-breakpoint
CREATE INDEX "RateLimit_lastRequest_idx" ON "RateLimit" USING btree ("lastRequest");