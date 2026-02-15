import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=${encodeURIComponent(errorDescription || error)}&view=marketplace`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=missing_code_or_state&view=marketplace`
    );
  }

  // Decode state to get userId
  let userId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    userId = stateData.userId;
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_state&view=marketplace`
    );
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=oauth_not_configured&view=marketplace`
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      `${MICROSOFT_AUTH_URL}/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=token_exchange_failed&view=marketplace`
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch(`${MICROSOFT_GRAPH_URL}/me`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("Failed to fetch user profile");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=profile_fetch_failed&view=marketplace`
      );
    }

    const profile: UserProfile = await profileResponse.json();
    const email = profile.mail || profile.userPrincipalName;

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store or update the connected email account
    await prisma.connectedEmailAccount.upsert({
      where: {
        userId_email_provider: {
          userId,
          email,
          provider: "outlook",
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry,
        displayName: profile.displayName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: "outlook",
        email,
        displayName: profile.displayName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry,
        isActive: true,
      },
    });

    // Success - redirect back to marketplace with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?success=outlook_connected&email=${encodeURIComponent(email)}&view=marketplace`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=connection_failed&view=marketplace`
    );
  }
}
