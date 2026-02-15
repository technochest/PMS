import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProjectRecord {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  startdate?: string;
  enddate?: string;
  budget?: string;
  color?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, userId } = body as { records: ProjectRecord[]; userId: string };

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
        if (!record.name) {
          errors.push(`Row ${i + 2}: Name is required`);
          continue;
        }

        // Map status
        const statusMap: Record<string, string> = {
          planning: "planning",
          active: "active",
          "in-progress": "active",
          "in progress": "active",
          "on-hold": "on-hold",
          "on hold": "on-hold",
          completed: "completed",
          done: "completed",
          archived: "archived",
        };
        const status = statusMap[record.status?.toLowerCase() || ""] || "planning";

        // Map priority
        const priorityMap: Record<string, string> = {
          low: "low",
          medium: "medium",
          high: "high",
          critical: "critical",
        };
        const priority = priorityMap[record.priority?.toLowerCase() || ""] || "medium";

        // Parse budget
        const budget = record.budget ? parseFloat(record.budget.replace(/[^0-9.-]/g, "")) : 0;

        // Create project
        const project = await prisma.project.create({
          data: {
            name: record.name,
            description: record.description || "",
            status,
            priority,
            startDate: record.startdate ? new Date(record.startdate) : new Date(),
            endDate: record.enddate ? new Date(record.enddate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            budget,
            color: record.color || "#3B82F6",
            createdById: userId,
          },
        });

        imported.push(project.id);
      } catch (err) {
        errors.push(`Row ${i + 2}: Failed to import - ${record.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: records.length,
      errors,
    });
  } catch (error) {
    console.error("Project import error:", error);
    return NextResponse.json(
      { error: "Failed to import projects" },
      { status: 500 }
    );
  }
}
