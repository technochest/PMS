import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.projectId || !body?.name) {
      return NextResponse.json(
        { error: "projectId and name are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { createdById: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const lastTask = await prisma.task.findFirst({
      where: { projectId: body.projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status || "todo",
        priority: body.priority || "medium",
        startDate: parseDate(body.startDate) || new Date(),
        endDate: parseDate(body.endDate) || new Date(),
        estimatedHours:
          typeof body.estimatedHours === "number" ? body.estimatedHours : 0,
        actualHours: typeof body.actualHours === "number" ? body.actualHours : 0,
        progress: typeof body.progress === "number" ? body.progress : 0,
        order:
          typeof body.order === "number"
            ? body.order
            : (lastTask?.order ?? -1) + 1,
        projectId: body.projectId,
        parentId: body.parentId || null,
        milestoneId: body.milestoneId || null,
        assigneeId: body.assigneeId || null,
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Task create error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
