import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // CLI migrations must use the direct URL, as they did before the upgrade.
  // Generation does not require a database URL or contact the database.
  datasource: { url: process.env.DIRECT_DATABASE_URL },
});
