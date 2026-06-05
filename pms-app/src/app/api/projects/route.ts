import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        milestones: true,
        budgetItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status || "planning",
        priority: body.priority || "medium",
        queue: Number.isInteger(body.queue) ? body.queue : 0,
        startDate: parseDate(body.startDate) || new Date(),
        endDate:
          parseDate(body.endDate) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        businessRequirementDate: parseDate(body.businessRequirementDate),
        budget: typeof body.budget === "number" ? body.budget : 0,
        color: body.color || "#3B82F6",
        entityId: body.entityId || null,
        departmentId: body.departmentId || null,
        categoryId: body.categoryId || null,
        projectLeadId: body.projectLeadId || null,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Project create error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
