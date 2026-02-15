import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/emails/accounts - List connected email accounts for a user
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const accounts = await prisma.connectedEmailAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        lastSyncAt: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { syncedEmails: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        ...a,
        emailCount: a._count.syncedEmails,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// DELETE /api/emails/accounts - Disconnect an email account
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");
  const userId = searchParams.get("userId");

  if (!accountId || !userId) {
    return NextResponse.json(
      { error: "Account ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership and delete
    const account = await prisma.connectedEmailAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Delete the account (cascade deletes synced emails)
    await prisma.connectedEmailAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect account:", error);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
