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

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.queue !== undefined ? { queue: body.queue } : {}),
        ...(body.startDate !== undefined
          ? { startDate: parseDate(body.startDate) || new Date() }
          : {}),
        ...(body.endDate !== undefined
          ? {
              endDate:
                parseDate(body.endDate) ||
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
          : {}),
        ...(body.businessRequirementDate !== undefined
          ? { businessRequirementDate: parseDate(body.businessRequirementDate) }
          : {}),
        ...(body.budget !== undefined ? { budget: body.budget } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.entityId !== undefined ? { entityId: body.entityId || null } : {}),
        ...(body.departmentId !== undefined
          ? { departmentId: body.departmentId || null }
          : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId || null } : {}),
        ...(body.projectLeadId !== undefined
          ? { projectLeadId: body.projectLeadId || null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
