import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUiTicket(ticket: any) {
  const createdAt = new Date(ticket.createdAt);
  const ticketNumber = 40000 + Math.floor(createdAt.getTime() / 1000) % 50000;

  return {
    id: ticket.id,
    ticketNumber,
    type: "issue",
    title: ticket.title,
    summary: ticket.description || "",
    rootCause: "",
    emailSubject: "",
    emailConversation: "",
    emailFrom: "",
    emailTo: "",
    emailCc: "",
    source: (ticket.sourceType || "manual").toLowerCase(),
    dateRequested: ticket.createdAt,
    expectedEndDate: ticket.dueDate,
    startDate: null,
    endDate: ticket.resolvedAt || ticket.closedAt,
    ventureName: "",
    department: "",
    requestorName: ticket.reportedBy || "",
    requestorEmail: "",
    requestorManager: "",
    assignedToId: ticket.assignedTo || null,
    leadId: null,
    contractors: "",
    status: ticket.status || "open",
    priority: ticket.priority || "medium",
    queue: 1,
    tracking: "on-track",
    phase: "not-started",
    percentComplete: ticket.status === "closed" || ticket.status === "resolved" ? 100 : ticket.status === "in-progress" ? 50 : 0,
    category: ticket.category || "Other",
    application: null,
    integration: null,
    projectId: null,
    attachments: null,
    notes: "",
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: toUiTicket(ticket) });
  } catch (error) {
    console.error("Ticket get error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};

    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.priority === "string") updates.priority = body.priority;
    if (typeof body.category === "string") updates.category = body.category;
    if (typeof body.assignedTo === "string" || body.assignedTo === null) updates.assignedTo = body.assignedTo;
    if (typeof body.reportedBy === "string") updates.reportedBy = body.reportedBy;
    if (typeof body.sourceType === "string") updates.sourceType = body.sourceType;
    if (typeof body.sourceId === "string" || body.sourceId === null) updates.sourceId = body.sourceId;

    if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
      updates.dueDate = parseDate(body.dueDate);
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, ticket: toUiTicket(ticket) });
  } catch (error) {
    console.error("Ticket patch error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ticket delete error:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
