import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seeds/index.ts",
  },
  datasource: {
    // Client generation during install does not require database credentials.
    url: process.env.DIRECT_URL,
  },
});
