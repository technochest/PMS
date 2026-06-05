import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error("Resource list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.name || !body?.email || !body?.role) {
      return NextResponse.json(
        { error: "name, email and role are required" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        hourlyRate: typeof body.hourlyRate === "number" ? body.hourlyRate : 0,
        department: body.department || null,
        skills: body.skills || null,
        availability:
          typeof body.availability === "number" ? body.availability : 100,
      },
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    console.error("Resource create error:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
