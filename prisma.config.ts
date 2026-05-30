import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    adapter() {
      return new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      });
    },
  },
});