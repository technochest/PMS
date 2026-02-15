import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Parse .eml file content (MIME format)
function parseEmlContent(content: string): {
  subject: string;
  from: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  date: Date | null;
  body: string;
  bodyPreview: string;
} {
  const lines = content.split(/\r?\n/);
  let subject = "";
  let from = "";
  let fromName: string | null = null;
  let to: string[] = [];
  let cc: string[] = [];
  let date: Date | null = null;
  let body = "";
  let inBody = false;
  let inHeaders = true;
  let currentHeader = "";
  let currentValue = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line marks end of headers
    if (inHeaders && line.trim() === "") {
      // Save last header
      if (currentHeader) {
        processHeader(currentHeader, currentValue);
      }
      inHeaders = false;
      inBody = true;
      continue;
    }

    if (inHeaders) {
      // Check if this is a continuation of previous header (starts with whitespace)
      if (/^\s+/.test(line) && currentHeader) {
        currentValue += " " + line.trim();
      } else {
        // Save previous header
        if (currentHeader) {
          processHeader(currentHeader, currentValue);
        }
        // Parse new header
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          currentHeader = line.substring(0, colonIndex).toLowerCase().trim();
          currentValue = line.substring(colonIndex + 1).trim();
        }
      }
    } else if (inBody) {
      body += line + "\n";
    }
  }

  function processHeader(header: string, value: string) {
    switch (header) {
      case "subject":
        subject = decodeHeader(value);
        break;
      case "from":
        const fromParsed = parseEmailAddress(value);
        from = fromParsed.email;
        fromName = fromParsed.name;
        break;
      case "to":
        to = parseEmailAddresses(value).map((e) => e.email);
        break;
      case "cc":
        cc = parseEmailAddresses(value).map((e) => e.email);
        break;
      case "date":
        try {
          date = new Date(value);
          if (isNaN(date.getTime())) date = null;
        } catch {
          date = null;
        }
        break;
    }
  }

  // Decode MIME encoded headers (=?UTF-8?B?...?= or =?UTF-8?Q?...?=)
  function decodeHeader(value: string): string {
    return value.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (match, charset, encoding, text) => {
      try {
        if (encoding.toUpperCase() === "B") {
          return Buffer.from(text, "base64").toString("utf-8");
        } else if (encoding.toUpperCase() === "Q") {
          return text.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (m: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
          );
        }
      } catch {
        return text;
      }
      return text;
    });
  }

  function parseEmailAddress(value: string): { email: string; name: string | null } {
    const decoded = decodeHeader(value);
    // Match "Name <email@example.com>" or just "email@example.com"
    const match = decoded.match(/^(?:"?([^"<]*)"?\s*)?<?([^<>@\s]+@[^<>@\s]+)>?$/);
    if (match) {
      return {
        name: match[1]?.trim() || null,
        email: match[2].toLowerCase(),
      };
    }
    // Just return the value as email if no pattern matches
    return { email: decoded.trim().toLowerCase(), name: null };
  }

  function parseEmailAddresses(value: string): { email: string; name: string | null }[] {
    // Split by comma, but not within quotes or angle brackets
    const addresses: string[] = [];
    let current = "";
    let inQuotes = false;
    let inBrackets = false;

    for (const char of value) {
      if (char === '"' && !inBrackets) inQuotes = !inQuotes;
      if (char === "<") inBrackets = true;
      if (char === ">") inBrackets = false;
      if (char === "," && !inQuotes && !inBrackets) {
        addresses.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) addresses.push(current.trim());

    return addresses.map(parseEmailAddress);
  }

  // Clean up body - remove HTML tags for preview, handle encoding
  let cleanBody = body.trim();
  
  // Try to extract plain text from multipart MIME
  const boundaryMatch = content.match(/boundary="?([^"\r\n]+)"?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = body.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    for (const part of parts) {
      if (part.includes("Content-Type: text/plain") || part.includes("content-type: text/plain")) {
        const textStart = part.indexOf("\n\n");
        if (textStart > -1) {
          cleanBody = part.substring(textStart + 2).trim();
          break;
        }
      }
    }
  }

  // Remove HTML tags for body preview
  const textBody = cleanBody
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const bodyPreview = textBody.substring(0, 200) + (textBody.length > 200 ? "..." : "");

  return {
    subject: subject || "(No Subject)",
    from,
    fromName,
    to,
    cc,
    date: date || new Date(),
    body: cleanBody,
    bodyPreview,
  };
}

// Parse CSV content
function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    results.push(row);
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// POST /api/emails/import - Import emails from files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const importType = formData.get("type") as string; // "eml", "csv", or "manual"
    const mailbox = formData.get("mailbox") as string || "imported@local";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get or create a "local import" account for this user
    let account = await prisma.connectedEmailAccount.findFirst({
      where: { userId, provider: "import", email: mailbox },
    });

    if (!account) {
      account = await prisma.connectedEmailAccount.create({
        data: {
          userId,
          provider: "import",
          email: mailbox,
          displayName: "Imported Emails",
          accessToken: "local-import", // No OAuth needed
          isActive: true,
        },
      });
    }

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    if (importType === "eml") {
      // Handle .eml file uploads
      const files = formData.getAll("files") as File[];

      for (const file of files) {
        try {
          const content = await file.text();
          const parsed = parseEmlContent(content);

          if (!parsed.from) {
            errors.push(`${file.name}: Could not parse sender`);
            skipped++;
            continue;
          }

          // Check for duplicates based on subject, from, and date
          const existingEmail = await prisma.syncedEmail.findFirst({
            where: {
              accountId: account.id,
              subject: parsed.subject,
              fromEmail: parsed.from,
              receivedAt: parsed.date || undefined,
            },
          });

          if (existingEmail) {
            skipped++;
            continue;
          }

          await prisma.syncedEmail.create({
            data: {
              accountId: account.id,
              externalId: uuidv4(),
              subject: parsed.subject,
              bodyPreview: parsed.bodyPreview,
              body: parsed.body,
              fromEmail: parsed.from,
              fromName: parsed.fromName,
              toEmails: JSON.stringify(parsed.to),
              ccEmails: parsed.cc.length > 0 ? JSON.stringify(parsed.cc) : null,
              importance: "normal",
              hasAttachments: false,
              isRead: false,
              status: "unread",
              receivedAt: parsed.date || new Date(),
            },
          });
          imported++;
        } catch (err) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : "Parse error"}`);
          skipped++;
        }
      }
    } else if (importType === "csv") {
      // Handle CSV upload
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
      }

      const content = await file.text();
      const rows = parseCSV(content);

      for (const row of rows) {
        try {
          // Map common CSV column names
          const subject = row.subject || row.title || row.email_subject || "(No Subject)";
          const from = row.from || row.sender || row.from_email || row.email_from || "";
          const fromName = row.from_name || row.sender_name || null;
          const to = row.to || row.recipients || row.to_email || "";
          const cc = row.cc || "";
          const body = row.body || row.content || row.message || row.email_body || "";
          const dateStr = row.date || row.received || row.received_date || row.sent_date || "";
          
          if (!from) {
            skipped++;
            continue;
          }

          let receivedAt = new Date();
          if (dateStr) {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) receivedAt = parsed;
          }

          // Check for duplicates
          const existing = await prisma.syncedEmail.findFirst({
            where: {
              accountId: account.id,
              subject,
              fromEmail: from.toLowerCase(),
            },
          });

          if (existing) {
            skipped++;
            continue;
          }

          await prisma.syncedEmail.create({
            data: {
              accountId: account.id,
              externalId: uuidv4(),
              subject,
              bodyPreview: body.substring(0, 200) + (body.length > 200 ? "..." : ""),
              body,
              fromEmail: from.toLowerCase(),
              fromName,
              toEmails: JSON.stringify(to.split(/[,;]/).map((e: string) => e.trim()).filter(Boolean)),
              ccEmails: cc ? JSON.stringify(cc.split(/[,;]/).map((e: string) => e.trim()).filter(Boolean)) : null,
              importance: row.importance || row.priority || "normal",
              hasAttachments: row.has_attachments === "true" || row.attachments === "yes",
              isRead: false,
              status: "unread",
              receivedAt,
            },
          });
          imported++;
        } catch (err) {
          errors.push(`Row: ${err instanceof Error ? err.message : "Parse error"}`);
          skipped++;
        }
      }
    } else if (importType === "manual") {
      // Handle manual/pasted emails
      const emails = JSON.parse(formData.get("emails") as string || "[]");

      for (const email of emails) {
        try {
          await prisma.syncedEmail.create({
            data: {
              accountId: account.id,
              externalId: uuidv4(),
              subject: email.subject || "(No Subject)",
              bodyPreview: (email.body || "").substring(0, 200),
              body: email.body || "",
              fromEmail: email.from?.toLowerCase() || "unknown@unknown.com",
              fromName: email.fromName || null,
              toEmails: JSON.stringify(email.to || []),
              ccEmails: email.cc ? JSON.stringify(email.cc) : null,
              importance: email.importance || "normal",
              hasAttachments: false,
              isRead: false,
              status: "unread",
              receivedAt: email.date ? new Date(email.date) : new Date(),
            },
          });
          imported++;
        } catch (err) {
          errors.push(`Email: ${err instanceof Error ? err.message : "Import error"}`);
          skipped++;
        }
      }
    }

    // Update account sync time
    await prisma.connectedEmailAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit error messages
      accountId: account.id,
    });
  } catch (error) {
    console.error("Email import error:", error);
    return NextResponse.json(
      { error: "Failed to import emails" },
      { status: 500 }
    );
  }
}
