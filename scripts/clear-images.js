// Plain Node.js script — no ts-node needed
// Run with: node scripts/clear-images.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function clearAllImages() {
  const client = await pool.connect();
  try {
    const results = await Promise.all([
      client.query(`UPDATE known_people SET "photoUrl" = NULL WHERE "photoUrl" IS NOT NULL RETURNING id`),
      client.query(`UPDATE places SET "photoUrl" = NULL WHERE "photoUrl" IS NOT NULL RETURNING id`),
      client.query(`UPDATE memories SET "mediaUrl" = NULL, "mediaType" = NULL WHERE "mediaUrl" IS NOT NULL RETURNING id`),
      client.query(`UPDATE journals SET "mediaUrl" = NULL, "mediaType" = NULL WHERE "mediaUrl" IS NOT NULL RETURNING id`),
      client.query(`UPDATE patients SET "profileImage" = NULL WHERE "profileImage" IS NOT NULL RETURNING id`),
      client.query(`UPDATE medications SET "imageUrl" = NULL WHERE "imageUrl" IS NOT NULL RETURNING id`),
    ]);

    console.log("✅ All uploaded images cleared from database:");
    console.log("  KnownPerson photos cleared:  ", results[0].rowCount);
    console.log("  Place photos cleared:        ", results[1].rowCount);
    console.log("  Memory media cleared:        ", results[2].rowCount);
    console.log("  Journal media cleared:       ", results[3].rowCount);
    console.log("  Patient profile imgs cleared:", results[4].rowCount);
    console.log("  Medication images cleared:   ", results[5].rowCount);
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllImages().catch((e) => {
  console.error("❌ Error clearing images:", e.message);
  process.exit(1);
});
