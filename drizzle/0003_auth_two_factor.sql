CREATE TABLE "TwoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"failedVerificationCount" integer DEFAULT 0 NOT NULL,
	"lockedUntil" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "TwoFactor_userId_key" ON "TwoFactor" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor" USING btree ("secret");