import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function syncMilestoneCompletion(milestoneId: string) {
  const milestoneTasks = await prisma.task.findMany({
    where: { milestoneId },
    select: { status: true },
  });

  const completed =
    milestoneTasks.length > 0 && milestoneTasks.every((task) => task.status === "done");

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { milestoneId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const targetMilestoneId =
      body.milestoneId !== undefined ? body.milestoneId : existingTask.milestoneId;

    if (body.milestoneId !== undefined && !targetMilestoneId) {
      return NextResponse.json(
        { error: "milestoneId is required when updating task milestone" },
        { status: 400 }
      );
    }

    if (body.milestoneId !== undefined) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: targetMilestoneId },
        select: { id: true, projectId: true },
      });

      if (!milestone) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
      }

      const taskProject = await prisma.task.findUnique({
        where: { id },
        select: { projectId: true },
      });

      if (!taskProject || taskProject.projectId !== milestone.projectId) {
        return NextResponse.json(
          { error: "milestoneId must belong to the task project" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.startDate !== undefined
          ? { startDate: parseDate(body.startDate) || new Date() }
          : {}),
        ...(body.endDate !== undefined
          ? { endDate: parseDate(body.endDate) || new Date() }
          : {}),
        ...(body.progress !== undefined ? { progress: body.progress } : {}),
        ...(body.estimatedHours !== undefined
          ? { estimatedHours: body.estimatedHours }
          : {}),
        ...(body.actualHours !== undefined ? { actualHours: body.actualHours } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId || null } : {}),
        ...(body.milestoneId !== undefined ? { milestoneId: body.milestoneId } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId || null } : {}),
      },
    });

    const milestoneIdsToSync = Array.from(
      new Set([existingTask.milestoneId, task.milestoneId].filter(Boolean) as string[])
    );
    await Promise.all(milestoneIdsToSync.map((milestoneId) => syncMilestoneCompletion(milestoneId)));

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { milestoneId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    if (existingTask.milestoneId) {
      await syncMilestoneCompletion(existingTask.milestoneId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
