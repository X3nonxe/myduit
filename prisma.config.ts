import 'dotenv/config';
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        // Use process.env with fallback for CI/CD where DB connection is not needed for generate
        url: process.env.DIRECT_URL ?? '',
    },
});
