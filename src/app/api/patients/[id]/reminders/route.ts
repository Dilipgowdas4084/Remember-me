import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { getAuthUser, checkPatientAccess } from "@/backend/auth";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, false);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reminderId = searchParams.get("reminderId");

    if (reminderId) {
      const reminder = await prisma.reminder.findFirst({
        where: { id: reminderId, patientId },
      });
      if (!reminder) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
      }
      return NextResponse.json({ reminder });
    }

    const reminders = await prisma.reminder.findMany({
      where: { patientId },
      orderBy: { dateTime: "asc" },
    });

    return NextResponse.json({ reminders });
  } catch (error: any) {
    console.error("Reminders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, true);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, dateTime, completed, voiceReminderUrl } = body;

    if (!title || !dateTime) {
      return NextResponse.json({ error: "Missing required fields (title, dateTime)" }, { status: 400 });
    }

    const newReminder = await prisma.reminder.create({
      data: {
        patientId,
        title,
        description: description || null,
        dateTime: new Date(dateTime),
        completed: completed !== undefined ? completed : false,
        voiceReminderUrl: voiceReminderUrl || null,
      },
    });

    return NextResponse.json({ message: "Reminder added successfully", reminder: newReminder }, { status: 201 });
  } catch (error: any) {
    console.error("Reminders POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    // Allow patients to toggle completion status of their own reminders
    const body = await req.json();
    const { reminderId, title, description, dateTime, completed, voiceReminderUrl } = body;

    if (!reminderId) {
      return NextResponse.json({ error: "Missing reminderId" }, { status: 400 });
    }

    const isOnlyCompleting = completed !== undefined && title === undefined && description === undefined && dateTime === undefined && voiceReminderUrl === undefined;

    const access = await checkPatientAccess(authUser, patientId, !isOnlyCompleting);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId, patientId },
      data: {
        title,
        description,
        dateTime: dateTime ? new Date(dateTime) : undefined,
        completed,
        voiceReminderUrl,
      },
    });

    return NextResponse.json({ message: "Reminder updated successfully", reminder: updatedReminder });
  } catch (error: any) {
    console.error("Reminders PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const access = await checkPatientAccess(authUser, patientId, true);
    if (!access) {
      return NextResponse.json({ error: "Forbidden: No write permission" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reminderId = searchParams.get("reminderId");

    if (!reminderId) {
      return NextResponse.json({ error: "Missing reminderId in query" }, { status: 400 });
    }

    await prisma.reminder.delete({
      where: { id: reminderId, patientId },
    });

    return NextResponse.json({ message: "Reminder deleted successfully" });
  } catch (error: any) {
    console.error("Reminders DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
