import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0";
const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com";

interface GraphMessage {
  id: string;
  conversationId?: string;
  subject: string;
  bodyPreview: string;
  body?: {
    contentType: string;
    content: string;
  };
  from?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  toRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  importance: string;
  hasAttachments: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    size: number;
  }>;
  isRead: boolean;
  receivedDateTime: string;
  sentDateTime?: string;
}

interface GraphResponse {
  value: GraphMessage[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

// Refresh access token using refresh token
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const response = await fetch(
      `${MICROSOFT_AUTH_URL}/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      }
    );

    if (!response.ok) {
      console.error("Token refresh failed");
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(
  account: {
    id: string;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date | null;
  }
): Promise<string | null> {
  const now = new Date();
  const bufferMinutes = 5;
  const tokenExpiry = account.tokenExpiry
    ? new Date(account.tokenExpiry.getTime() - bufferMinutes * 60 * 1000)
    : null;

  // If token is still valid, use it
  if (tokenExpiry && tokenExpiry > now) {
    return account.accessToken;
  }

  // Need to refresh
  if (!account.refreshToken) {
    console.error("No refresh token available");
    return null;
  }

  const newTokens = await refreshAccessToken(account.refreshToken);
  if (!newTokens) {
    return null;
  }

  // Update tokens in database
  await prisma.connectedEmailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenExpiry: new Date(Date.now() + newTokens.expiresIn * 1000),
    },
  });

  return newTokens.accessToken;
}

// POST /api/emails/sync - Sync emails from a connected account
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accountId, userId, fullSync = false } = body;

  if (!accountId || !userId) {
    return NextResponse.json(
      { error: "Account ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    // Get the connected account
    const account = await prisma.connectedEmailAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Ensure account has access token
    if (!account.accessToken) {
      return NextResponse.json(
        { error: "Account has no access token. Please reconnect the account." },
        { status: 401 }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken({
      ...account,
      accessToken: account.accessToken,
    });
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unable to get valid access token. Please reconnect the account." },
        { status: 401 }
      );
    }

    // Build request URL
    // Use delta query for incremental sync if we have a sync cursor
    let url: string;
    if (!fullSync && account.syncCursor) {
      url = account.syncCursor;
    } else {
      // Initial sync - get last 100 emails
      url = `${MICROSOFT_GRAPH_URL}/me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc&$select=id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,importance,hasAttachments,isRead,receivedDateTime,sentDateTime`;
    }

    let totalSynced = 0;
    let nextLink = url;

    // Fetch emails (with pagination)
    while (nextLink) {
      const response = await fetch(nextLink, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Graph API error:", errorData);
        return NextResponse.json(
          { error: "Failed to fetch emails from Microsoft Graph" },
          { status: response.status }
        );
      }

      const data: GraphResponse = await response.json();

      // Process and store emails
      for (const message of data.value) {
        await prisma.syncedEmail.upsert({
          where: {
            accountId_externalId: {
              accountId: account.id,
              externalId: message.id,
            },
          },
          update: {
            subject: message.subject || "(No Subject)",
            bodyPreview: message.bodyPreview || "",
            isRead: message.isRead,
            updatedAt: new Date(),
          },
          create: {
            accountId: account.id,
            externalId: message.id,
            conversationId: message.conversationId,
            subject: message.subject || "(No Subject)",
            bodyPreview: message.bodyPreview || "",
            fromEmail: message.from?.emailAddress.address || "unknown",
            fromName: message.from?.emailAddress.name || null,
            toEmails: JSON.stringify(
              message.toRecipients?.map((r) => r.emailAddress.address) || []
            ),
            ccEmails: message.ccRecipients
              ? JSON.stringify(message.ccRecipients.map((r) => r.emailAddress.address))
              : null,
            importance: message.importance?.toLowerCase() || "normal",
            hasAttachments: message.hasAttachments || false,
            isRead: message.isRead,
            status: message.isRead ? "read" : "unread",
            receivedAt: new Date(message.receivedDateTime),
            sentAt: message.sentDateTime ? new Date(message.sentDateTime) : null,
          },
        });
        totalSynced++;
      }

      // Update delta link for next sync
      if (data["@odata.deltaLink"]) {
        await prisma.connectedEmailAccount.update({
          where: { id: account.id },
          data: {
            syncCursor: data["@odata.deltaLink"],
            lastSyncAt: new Date(),
          },
        });
      }

      // Continue to next page if available (limit to 3 pages for initial sync)
      nextLink = data["@odata.nextLink"] || "";
      if (totalSynced >= 300) break; // Safety limit
    }

    // Update last sync time
    await prisma.connectedEmailAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email sync error:", error);
    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 });
  }
}

// GET /api/emails/sync - Get synced emails for an account
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status"); // unread, read, converted, archived

  if (!accountId || !userId) {
    return NextResponse.json(
      { error: "Account ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const account = await prisma.connectedEmailAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Build filter
    const where: any = { accountId };
    if (status) {
      where.status = status;
    }

    // Get emails with pagination
    const [emails, total] = await Promise.all([
      prisma.syncedEmail.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.syncedEmail.count({ where }),
    ]);

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
