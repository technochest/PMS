import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PSTFile, PSTFolder, PSTMessage } from "pst-extractor";
import { access, constants } from "fs/promises";

// Route segment config for Next.js App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtractedEmail {
  subject: string;
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  body: string;
  bodyHtml: string;
  receivedAt: Date;
  sentAt: Date | null;
  importance: string;
  hasAttachments: boolean;
}

// Recursively extract emails from PST folders
function extractEmailsFromFolder(folder: PSTFolder, emails: ExtractedEmail[], maxEmails: number = 1000): void {
  if (emails.length >= maxEmails) return;

  // Process emails in current folder
  if (folder.contentCount > 0) {
    let email = folder.getNextChild();
    while (email !== null && emails.length < maxEmails) {
      if (email instanceof PSTMessage) {
        try {
          const message = email as PSTMessage;
          
          // Extract recipients
          const toRecipients: string[] = [];
          const ccRecipients: string[] = [];
          
          const numRecipients = message.numberOfRecipients;
          for (let i = 0; i < numRecipients; i++) {
            try {
              const recipient = message.getRecipient(i);
              if (recipient) {
                const recipientEmail = recipient.smtpAddress || recipient.emailAddress || "";
                const recipientType = recipient.recipientType;
                if (recipientType === 1) { // TO
                  toRecipients.push(recipientEmail);
                } else if (recipientType === 2) { // CC
                  ccRecipients.push(recipientEmail);
                }
              }
            } catch {
              // Skip invalid recipients
            }
          }

          // Map importance
          let importance = "normal";
          const msgImportance = message.importance;
          if (msgImportance === 2) importance = "high";
          else if (msgImportance === 0) importance = "low";

          emails.push({
            subject: message.subject || "(No Subject)",
            from: message.senderEmailAddress || "",
            fromName: message.senderName || "",
            to: toRecipients,
            cc: ccRecipients,
            body: message.body || "",
            bodyHtml: message.bodyHTML || "",
            receivedAt: message.messageDeliveryTime || new Date(),
            sentAt: message.clientSubmitTime || null,
            importance,
            hasAttachments: message.hasAttachments,
          });
        } catch (err) {
          console.error("Error extracting email:", err);
        }
      }
      email = folder.getNextChild();
    }
  }

  // Process subfolders
  if (folder.hasSubfolders) {
    const subfolders = folder.getSubFolders();
    for (const subfolder of subfolders) {
      if (emails.length >= maxEmails) break;
      extractEmailsFromFolder(subfolder, emails, maxEmails);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, userId, maxEmails = 500 } = body as { 
      filePath: string; 
      userId: string; 
      maxEmails?: number;
    };

    console.log(`PST Import (path): Processing file at ${filePath} for user ${userId}`);

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if file exists and is readable
    try {
      await access(filePath, constants.R_OK);
    } catch {
      return NextResponse.json(
        { error: "Cannot access file. Please check the path is correct and the file exists." },
        { status: 400 }
      );
    }

    // Check file extension
    if (!filePath.toLowerCase().endsWith(".pst")) {
      return NextResponse.json(
        { error: "File must be a .pst file" },
        { status: 400 }
      );
    }

    // Open and parse PST file directly from the path
    console.log("PST Import (path): Opening PST file directly");
    let pstFile;
    try {
      pstFile = new PSTFile(filePath);
    } catch (pstError) {
      console.error("PST Import (path): Failed to open PST file:", pstError);
      return NextResponse.json(
        { 
          error: "Failed to open PST file. The file may be corrupted, password-protected, or in use by another application.",
          details: pstError instanceof Error ? pstError.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    const emails: ExtractedEmail[] = [];

    // Get root folder and extract emails
    console.log("PST Import (path): Extracting emails from folders");
    try {
      const rootFolder = pstFile.getRootFolder();
      extractEmailsFromFolder(rootFolder, emails, maxEmails);
    } catch (extractError) {
      console.error("PST Import (path): Error extracting emails:", extractError);
      pstFile.close();
      return NextResponse.json(
        { 
          error: "Failed to extract emails from PST file.",
          details: extractError instanceof Error ? extractError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Close PST file
    pstFile.close();
    console.log(`PST Import (path): Extracted ${emails.length} emails from PST`);

    // Create or get a "PST Import" account for this user
    let importAccount = await prisma.connectedEmailAccount.findFirst({
      where: {
        userId,
        provider: "pst-import",
      },
    });

    if (!importAccount) {
      importAccount = await prisma.connectedEmailAccount.create({
        data: {
          userId,
          provider: "pst-import",
          email: `pst-import-${userId}@local`,
          displayName: "PST Import",
          isActive: true,
        },
      });
    }

    // Store extracted emails
    let importedCount = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        // Generate a unique external ID
        const externalId = `pst-${Date.now()}-${importedCount}`;

        await prisma.syncedEmail.create({
          data: {
            accountId: importAccount.id,
            externalId,
            subject: email.subject,
            bodyPreview: email.body.substring(0, 500),
            body: email.body,
            bodyHtml: email.bodyHtml || null,
            fromEmail: email.from,
            fromName: email.fromName,
            toEmails: JSON.stringify(email.to),
            ccEmails: email.cc.length > 0 ? JSON.stringify(email.cc) : null,
            importance: email.importance,
            hasAttachments: email.hasAttachments,
            isRead: true,
            receivedAt: email.receivedAt,
            sentAt: email.sentAt,
            status: "read",
          },
        });
        importedCount++;
      } catch (err) {
        if (importedCount < 10) { // Only log first few errors
          errors.push(`Failed to import: ${email.subject}`);
        }
      }
    }

    // Update account sync time
    await prisma.connectedEmailAccount.update({
      where: { id: importAccount.id },
      data: { lastSyncAt: new Date() },
    });

    console.log(`PST Import (path): Successfully imported ${importedCount} of ${emails.length} emails`);

    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: emails.length,
      skipped: emails.length - importedCount,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("PST import (path) error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process PST file.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
