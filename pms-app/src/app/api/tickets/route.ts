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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { reportedBy: { contains: search } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      tickets: tickets.map(toUiTicket),
    });
  } catch (error) {
    console.error("Ticket list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.title || !body?.createdById) {
      return NextResponse.json(
        { error: "Title and createdById are required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description || "",
        status: body.status || "open",
        priority: body.priority || "medium",
        category: body.category || "general",
        assignedTo: body.assignedTo || null,
        reportedBy: body.reportedBy || body.createdById,
        dueDate: parseDate(body.dueDate),
        sourceType: body.sourceType || "manual",
        sourceId: body.sourceId || null,
        createdById: body.createdById,
      },
    });

    return NextResponse.json({ success: true, ticket: toUiTicket(ticket) }, { status: 201 });
  } catch (error) {
    console.error("Ticket create error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
