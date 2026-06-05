import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.dueDate !== undefined
          ? { dueDate: parseDate(body.dueDate) || new Date() }
          : {}),
        ...(body.completed !== undefined ? { completed: body.completed } : {}),
        ...(body.completedAt !== undefined
          ? { completedAt: parseDate(body.completedAt) }
          : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
      },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error("Milestone update error:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.milestone.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Milestone delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
