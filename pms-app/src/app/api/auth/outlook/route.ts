import { NextRequest, NextResponse } from "next/server";

// Microsoft OAuth 2.0 endpoints
const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com";

export async function GET(request: NextRequest) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "Microsoft OAuth not configured. Please set MICROSOFT_CLIENT_ID in .env" },
      { status: 500 }
    );
  }

  // Get userId from query params (passed from frontend)
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  // OAuth 2.0 scopes for Microsoft Graph Mail API
  const scopes = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/User.Read",
  ].join(" ");

  // Build state parameter (contains userId for callback)
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

  // Build authorization URL
  const authUrl = new URL(`${MICROSOFT_AUTH_URL}/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account"); // Allow selecting different accounts

  return NextResponse.redirect(authUrl.toString());
}
