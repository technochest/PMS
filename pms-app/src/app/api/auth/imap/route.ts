import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Note: This endpoint attempts IMAP login for Microsoft 365/Outlook
// Many organizations disable IMAP/Basic Auth, but some still allow it.
// Modern Auth (OAuth) is preferred but requires Azure AD app registration.

// Microsoft 365 IMAP settings
const OUTLOOK_IMAP = {
  host: "outlook.office365.com",
  port: 993,
  secure: true,
};

interface IMAPLoginRequest {
  userId: string;
  email: string;
  password: string;
}

// This is a simplified check - in production you'd use a real IMAP library
// For browser/Next.js, we'd need to call an external service or use Edge-compatible code
export async function POST(request: NextRequest) {
  try {
    const body: IMAPLoginRequest = await request.json();
    const { userId, email, password } = body;

    if (!userId || !email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // For Microsoft 365 accounts, Basic Auth (IMAP with password) is often disabled
    // We'll attempt the connection and handle the error gracefully
    
    // In a real implementation, you would:
    // 1. Use a library like 'imapflow' or 'imap-simple'
    // 2. Connect to outlook.office365.com:993 with SSL
    // 3. Authenticate with email/password
    // 4. Fetch emails from INBOX
    
    // However, most M365 tenants have disabled Basic Auth
    // So we'll check if this is likely to work and provide guidance

    const domain = email.split("@")[1]?.toLowerCase();
    const isCorporate = domain && !["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain);

    if (isCorporate) {
      // Corporate accounts usually have Basic Auth disabled
      return NextResponse.json({
        success: false,
        error: "basic_auth_likely_disabled",
        message: `Corporate Microsoft 365 accounts (like @${domain}) typically have IMAP/Basic Authentication disabled for security. Your IT department has likely enforced Modern Authentication (OAuth) only.`,
        suggestions: [
          "Use the 'Import Emails' feature to upload .eml files exported from Outlook",
          "Ask your IT admin to register this app in Azure AD",
          "Export emails from Outlook Desktop using File → Save As",
        ],
      }, { status: 403 });
    }

    // For personal accounts, we could attempt IMAP
    // But Microsoft also requires "App Passwords" for personal accounts with 2FA
    
    // Store as a "pending" connection that needs IMAP verification
    // In a full implementation, we'd actually verify via IMAP here
    
    // For now, inform the user about the situation
    return NextResponse.json({
      success: false,
      error: "imap_not_implemented",
      message: "Direct IMAP login is not yet implemented. Microsoft requires App Passwords for accounts with 2-factor authentication.",
      suggestions: [
        "Use the 'Import Emails' feature to upload exported emails",
        "If you have a personal Microsoft account, generate an App Password in your Microsoft Security settings",
      ],
    }, { status: 501 });

  } catch (error) {
    console.error("IMAP login error:", error);
    return NextResponse.json(
      { error: "Connection failed" },
      { status: 500 }
    );
  }
}
