const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://REDACTED:REDACTED@REDACTED-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function run() {
  await client.connect();
  console.log("Connected to Neon DB");

  await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERVISOR'`);
  console.log("Added SUPERVISOR to Role enum");

  await client.query(`
    CREATE TABLE IF NOT EXISTS "supervisors" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log("Created supervisors table");

  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "supervisors_userId_key" ON "supervisors"("userId")`);

  await client.query(`ALTER TABLE "supervisors" DROP CONSTRAINT IF EXISTS "supervisors_userId_fkey"`);
  await client.query(`
    ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `);
  console.log("All done!");
  await client.end();
}

run().catch(async (e) => {
  console.error("Error:", e.message);
  await client.end();
  process.exit(1);
});
