import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.projectId || !body?.name || !body?.category) {
      return NextResponse.json(
        { error: "projectId, name and category are required" },
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

    const budgetItem = await prisma.budgetItem.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        category: body.category,
        planned: typeof body.planned === "number" ? body.planned : 0,
        actual: typeof body.actual === "number" ? body.actual : 0,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, budgetItem }, { status: 201 });
  } catch (error) {
    console.error("Budget item create error:", error);
    return NextResponse.json(
      { error: "Failed to create budget item" },
      { status: 500 }
    );
  }
}
