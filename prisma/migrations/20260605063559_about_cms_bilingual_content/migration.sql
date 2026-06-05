-- CreateTable
CREATE TABLE "AboutContent" (
    "id" TEXT NOT NULL,
    "introEn" TEXT,
    "introId" TEXT,
    "howIWorkEn" TEXT,
    "howIWorkId" TEXT,
    "whatIValueEn" TEXT,
    "whatIValueId" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutContent_pkey" PRIMARY KEY ("id")
);
