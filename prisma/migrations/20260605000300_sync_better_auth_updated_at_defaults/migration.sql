-- Align migration history with the existing BetterAuth database shape.
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Session" ALTER COLUMN "updatedAt" DROP DEFAULT;
