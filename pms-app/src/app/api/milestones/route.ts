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

    const milestone = await prisma.milestone.create({
      data: {
        name: body.name,
        description: body.description || null,
        dueDate: parseDate(body.dueDate) || new Date(),
        color: body.color || "#10B981",
        projectId: body.projectId,
      },
    });

    return NextResponse.json({ success: true, milestone }, { status: 201 });
  } catch (error) {
    console.error("Milestone create error:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
