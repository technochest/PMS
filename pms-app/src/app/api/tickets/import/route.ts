import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TicketRecord {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string;
  assignedto?: string;
  reportedby?: string;
  duedate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, userId } = body as { records: TicketRecord[]; userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records to import" },
        { status: 400 }
      );
    }

    const imported: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields
        if (!record.title) {
          errors.push(`Row ${i + 2}: Title is required`);
          continue;
        }

        // Map priority
        const priorityMap: Record<string, string> = {
          low: "low",
          medium: "medium",
          high: "high",
          critical: "critical",
          urgent: "critical",
        };
        const priority = priorityMap[record.priority?.toLowerCase() || ""] || "medium";

        // Map status
        const statusMap: Record<string, string> = {
          open: "open",
          "in-progress": "in-progress",
          "in progress": "in-progress",
          inprogress: "in-progress",
          resolved: "resolved",
          closed: "closed",
          backlog: "backlog",
          pending: "open",
          new: "open",
        };
        const status = statusMap[record.status?.toLowerCase() || ""] || "open";

        // Create ticket
        const ticket = await prisma.ticket.create({
          data: {
            title: record.title,
            description: record.description || "",
            priority,
            status,
            category: record.category || "general",
            assignedTo: record.assignedto || null,
            reportedBy: record.reportedby || userId,
            dueDate: record.duedate ? new Date(record.duedate) : null,
            createdById: userId,
          },
        });

        imported.push(ticket.id);
      } catch (err) {
        errors.push(`Row ${i + 2}: Failed to import - ${record.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: records.length,
      errors,
    });
  } catch (error) {
    console.error("Ticket import error:", error);
    return NextResponse.json(
      { error: "Failed to import tickets" },
      { status: 500 }
    );
  }
}
