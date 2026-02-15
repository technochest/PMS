import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PSTFile, PSTFolder, PSTMessage } from "pst-extractor";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

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
  let tempFilePath: string | null = null;

  try {
    console.log("PST Import: Starting request processing");
    
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const maxEmailsStr = formData.get("maxEmails") as string | null;
    const maxEmails = maxEmailsStr ? parseInt(maxEmailsStr, 10) : 500;

    console.log(`PST Import: File received - ${file?.name}, size: ${file?.size}, userId: ${userId}`);

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pst")) {
      return NextResponse.json(
        { error: "File must be a .pst file" },
        { status: 400 }
      );
    }

    // Check file size (limit to 500MB for now)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "PST file is too large. Maximum size is 500MB." },
        { status: 400 }
      );
    }

    // Save file temporarily
    console.log("PST Import: Saving file to temp directory");
    const tempDir = join(tmpdir(), "pms-pst-import");
    await mkdir(tempDir, { recursive: true });
    tempFilePath = join(tempDir, `${randomUUID()}.pst`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);
    console.log(`PST Import: File saved to ${tempFilePath}`);

    // Parse PST file
    console.log("PST Import: Opening PST file");
    let pstFile;
    try {
      pstFile = new PSTFile(tempFilePath);
    } catch (pstError) {
      console.error("PST Import: Failed to open PST file:", pstError);
      return NextResponse.json(
        { 
          error: "Failed to open PST file. The file may be corrupted, password-protected, or in an unsupported format.",
          details: pstError instanceof Error ? pstError.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    const emails: ExtractedEmail[] = [];

    // Get root folder and extract emails
    console.log("PST Import: Extracting emails from folders");
    try {
      const rootFolder = pstFile.getRootFolder();
      extractEmailsFromFolder(rootFolder, emails, maxEmails);
    } catch (extractError) {
      console.error("PST Import: Error extracting emails:", extractError);
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
    console.log(`PST Import: Extracted ${emails.length} emails from PST`);

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
        const externalId = `pst-${randomUUID()}`;

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
        errors.push(`Failed to import: ${email.subject}`);
      }
    }

    // Update account sync time
    await prisma.connectedEmailAccount.update({
      where: { id: importAccount.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: emails.length,
      skipped: emails.length - importedCount,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error("PST import error:", error);
    return NextResponse.json(
      { 
        error: "Failed to parse PST file. The file may be corrupted or in an unsupported format.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
