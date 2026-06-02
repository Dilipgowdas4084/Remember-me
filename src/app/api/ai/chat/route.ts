import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser } from "@/backend/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch patient context from DB
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        patient: {
          include: {
            knownPeople: true,
            places: true,
            medications: true,
            reminders: true,
            allergies: true,
          },
        },
      },
    });

    const patient = user?.patient;

    // Build context string for the AI
    let context = `You are a calm, gentle, and reassuring memory companion for an Alzheimer's patient named ${patient?.name || "the patient"}. Always speak in short, clear, and comforting sentences. Never mention that you are an AI.`;

    if (patient) {
      if (patient.knownPeople.length > 0) {
        context += `\n\nPeople this patient knows:\n`;
        patient.knownPeople.forEach((p) => {
          context += `- ${p.name} (${p.relationship}): ${p.description}`;
          if (p.positiveMemory) context += ` Memory: ${p.positiveMemory}`;
          context += `\n`;
        });
      }

      if (patient.places.length > 0) {
        context += `\n\nPlaces this patient is familiar with:\n`;
        patient.places.forEach((pl) => {
          context += `- ${pl.name}: ${pl.description}\n`;
        });
      }

      if (patient.medications.length > 0) {
        context += `\n\nMedications:\n`;
        patient.medications.forEach((m) => {
          context += `- ${m.name} (${m.dosage}): Take ${m.frequency} at ${m.timeOfDay}.\n`;
        });
      }

      if (patient.allergies.length > 0) {
        context += `\n\nAllergies:\n`;
        patient.allergies.forEach((a) => {
          context += `- ${a.item} (${a.type})\n`;
        });
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        response: "I'm here with you. Everything is safe. Please ask your caregiver if you need help.",
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      return NextResponse.json({
        response: "I am here with you. You are safe. Please try asking again.",
      });
    }

    const data = await openaiRes.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I am here. You are safe and loved.";

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json({
      response: "I am here with you. Everything is okay.",
    });
  }
}
