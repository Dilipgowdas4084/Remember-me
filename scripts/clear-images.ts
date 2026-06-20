import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllImages() {
  const [kp, pl, mem, jour, pat, med] = await Promise.all([
    prisma.knownPerson.updateMany({ data: { photoUrl: null } }),
    prisma.place.updateMany({ data: { photoUrl: null } }),
    prisma.memory.updateMany({ data: { mediaUrl: null, mediaType: null } }),
    prisma.journal.updateMany({ data: { mediaUrl: null, mediaType: null } }),
    prisma.patient.updateMany({ data: { profileImage: null } }),
    prisma.medication.updateMany({ data: { imageUrl: null } }),
  ]);

  console.log("✅ All uploaded images cleared from database:");
  console.log("  KnownPerson photos:", kp.count);
  console.log("  Place photos:", pl.count);
  console.log("  Memory media:", mem.count);
  console.log("  Journal media:", jour.count);
  console.log("  Patient profile images:", pat.count);
  console.log("  Medication images:", med.count);

  await prisma.$disconnect();
}

clearAllImages().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
