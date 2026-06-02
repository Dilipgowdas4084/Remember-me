import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Cleaning up database...");
  await prisma.user.deleteMany({});
  console.log("Database cleaned.");

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const doctorPasswordHash = await bcrypt.hash("doctor123", salt);
  const patientPasswordHash = await bcrypt.hash("robert123", salt);
  const caregiverPasswordHash = await bcrypt.hash("sarah123", salt);

  console.log("Seeding users...");

  // 1. Create Doctor
  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@rememberme.com",
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      doctor: {
        create: {
          name: "Dr. Emily Carter",
          specialization: "Neurology & Geriatrics",
          phone: "555-0211",
        },
      },
    },
    include: {
      doctor: true,
    },
  });
  const doctorId = doctorUser.doctor!.id;

  // 2. Create Patient
  const patientUser = await prisma.user.create({
    data: {
      email: "robert@rememberme.com",
      passwordHash: patientPasswordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          name: "Robert Chen",
          age: 78,
          bloodGroup: "AB+",
          address: "123 Lavender Lane, Seattle, WA",
          emergencyContact: "Sarah Chen (Daughter) - 555-0199",
          profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
          doctorId: doctorId,
        },
      },
    },
    include: {
      patient: true,
    },
  });
  const patientId = patientUser.patient!.id;

  // 3. Create Caregiver
  const caregiverUser = await prisma.user.create({
    data: {
      email: "caregiver@rememberme.com",
      passwordHash: caregiverPasswordHash,
      role: Role.CAREGIVER,
      caregiver: {
        create: {
          name: "Sarah Chen",
          phone: "555-0199",
          relationshipToPatient: "Daughter",
        },
      },
    },
    include: {
      caregiver: true,
    },
  });
  const caregiverId = caregiverUser.caregiver!.id;

  // Assign Caregiver to Patient
  await prisma.patientAssignment.create({
    data: {
      patientId: patientId,
      caregiverId: caregiverId,
      canEditMedical: true, // Doctor grants editing permission to caregiver
    },
  });

  console.log("Seeding patient data details...");

  // Seed Known People
  await prisma.knownPerson.createMany({
    data: [
      {
        patientId,
        name: "Sarah Chen",
        relationship: "Daughter",
        description: "Sarah is your eldest daughter. She lives nearby, visits every Sunday afternoon, and loves baking sugar-free apple pies with you. She has a warm smile and a golden retriever named Max.",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
        positiveMemory: "She remembers when you taught her how to ride a bicycle in Green Lake Park and held the seat until she could balance on her own.",
      },
      {
        patientId,
        name: "Dr. Emily Carter",
        relationship: "Primary Care Doctor",
        description: "Dr. Carter is your neurologist. She is dedicated to helping monitor your health and medications. She always wears a friendly blue stethoscope and speaks in a soft, reassuring voice.",
        photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=60",
        positiveMemory: "She always compliments your classic watch collection and listens patiently to your stories about jazz music.",
      },
      {
        patientId,
        name: "Michael Chen",
        relationship: "Son",
        description: "Michael is your younger son. He lives in Boston and works as a high school history teacher. He calls you every Wednesday evening to chat about sports and his two children, Leo and Lily.",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
        positiveMemory: "You both went fly-fishing in Maine ten years ago, and he caught the largest trout of the weekend while you took photos.",
      },
    ],
  });

  // Seed Places
  await prisma.place.createMany({
    data: [
      {
        patientId,
        name: "Cozy Home (Lavender Lane)",
        address: "123 Lavender Lane, Seattle, WA",
        description: "Your lovely house with a lavender garden in the front. Your favorite deep-blue armchair is next to the fireplace in the living room, where you like to read books and listen to jazz.",
        photoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60",
        mapsUrl: "https://maps.google.com/?q=123+Lavender+Lane,+Seattle,+WA",
      },
      {
        patientId,
        name: "Green Lake Park",
        address: "7201 East Green Lake Dr N, Seattle",
        description: "A beautiful, peaceful park with a paved path around the lake. You love walking here on sunny mornings to watch the ducks and feed the squirrels.",
        photoUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=500&auto=format&fit=crop&q=60",
        mapsUrl: "https://maps.google.com/?q=Green+Lake+Park,+Seattle",
      },
      {
        patientId,
        name: "Grace Community Temple & Center",
        address: "450 10th Ave, Seattle",
        description: "A quiet, spiritual community center. You go here for peaceful prayer and social coffee hours on Tuesday and Sunday mornings.",
        photoUrl: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=500&auto=format&fit=crop&q=60",
        mapsUrl: "https://maps.google.com/?q=450+10th+Ave,+Seattle",
      },
    ],
  });

  // Seed Allergies
  await prisma.allergy.createMany({
    data: [
      {
        patientId,
        type: "FOOD",
        item: "Peanuts",
        reaction: "Severe throat swelling and hives. Avoid all peanut oils and peanut-butter cookies.",
        severity: "HIGH",
      },
      {
        patientId,
        type: "MEDICINE",
        item: "Penicillin",
        reaction: "Widespread red skin rash and mild breathing issues. Make sure alternative antibiotics are used.",
        severity: "HIGH",
      },
    ],
  });

  // Seed Medications
  await prisma.medication.createMany({
    data: [
      {
        patientId,
        name: "Donepezil (Aricept)",
        dosage: "10 mg",
        frequency: "Once daily",
        timeOfDay: "Night",
        reminderTime: "20:00",
        instructions: "Take one tablet with a full glass of water right before going to sleep. Helps support memory and clarity.",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
        active: true,
      },
      {
        patientId,
        name: "Memantine",
        dosage: "10 mg",
        frequency: "Twice daily",
        timeOfDay: "Morning",
        reminderTime: "08:00",
        instructions: "Take one tablet in the morning with your breakfast. Helps with brain signaling.",
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60",
        active: true,
      },
      {
        patientId,
        name: "Multivitamin Active",
        dosage: "1 tablet",
        frequency: "Once daily",
        timeOfDay: "Morning",
        reminderTime: "08:00",
        instructions: "Take with food during breakfast to maintain general strength.",
        imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60",
        active: true,
      },
    ],
  });

  // Seed Reminders
  await prisma.reminder.createMany({
    data: [
      {
        patientId,
        title: "Eat a Warm Breakfast",
        description: "Have oatmeal with berries and take Memantine medication.",
        dateTime: new Date(new Date().setHours(8, 0, 0, 0)),
        completed: false,
      },
      {
        patientId,
        title: "Morning Walk in the Garden",
        description: "Step outside to enjoy the sunshine and fresh air for 15 minutes.",
        dateTime: new Date(new Date().setHours(10, 0, 0, 0)),
        completed: false,
      },
      {
        patientId,
        title: "Donepezil Medication Time",
        description: "Take Donepezil with water before bed.",
        dateTime: new Date(new Date().setHours(20, 0, 0, 0)),
        completed: false,
      },
    ],
  });

  // Seed Journals
  await prisma.journal.create({
    data: {
      patientId,
      title: "Robert's Cozy 78th Birthday Party",
      content: "We gathered at Robert's home to celebrate his birthday. We had sugar-free apple pie and played his favorite jazz records by Miles Davis. Robert was smiling, tapped his feet to the music, and recognized everyone. It was a beautiful afternoon filled with love.",
      mediaUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&auto=format&fit=crop&q=60",
      mediaType: "IMAGE",
    },
  });

  // Seed Emergency Contacts
  await prisma.emergencyContact.createMany({
    data: [
      {
        patientId,
        name: "Sarah Chen",
        relationship: "Daughter",
        phone: "555-0199",
        isPrimary: true,
      },
      {
        patientId,
        name: "Dr. Emily Carter",
        relationship: "Neurologist",
        phone: "555-0211",
        isPrimary: false,
      },
    ],
  });

  // Seed Voice Notes
  await prisma.voiceNote.create({
    data: {
      patientId,
      title: "Morning Reassurance from Sarah",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Mock public audio
      duration: 35,
    },
  });

  // Seed Memory Cards
  await prisma.memory.createMany({
    data: [
      {
        patientId,
        title: "My Favorite Guitar",
        description: "The classic acoustic guitar you bought in 1974. You played in a community band for ten years. You still love to strum the cords when Sarah visits.",
        category: "OTHER",
        mediaUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&auto=format&fit=crop&q=60",
        mediaType: "IMAGE",
        isNarrated: true,
      },
      {
        patientId,
        title: "Summer Trip to Hawaii",
        description: "The family trip to Maui in 1995. You, your wife Helen, Sarah, and Michael spent two weeks on the beach. You loved watching the sunsets.",
        category: "OTHER",
        mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60",
        mediaType: "IMAGE",
        isNarrated: true,
      },
    ],
  });

  console.log("Seeding finished successfully!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seeding failed: ", e);
  process.exit(1);
});
