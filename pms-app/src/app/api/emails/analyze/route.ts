import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  analyzeEmail, 
  analyzeTicket,
  groupRelatedEmails, 
  findPotentialDuplicates,
  crossAnalyzeEmailsAndTickets,
  AnalyzedEmail,
  AnalyzedTicket,
  EmailGroup 
} from "@/lib/emailAnalysis";

// Type for emails passed from the client (from Zustand store)
interface ClientEmail {
  id: string;
  subject: string;
  body?: string;
  bodyPreview?: string;
  fromEmail: string;
  fromName?: string | null;
  toEmails: string; // JSON string array
  ccEmails?: string; // JSON string array
  receivedAt: Date | string;
  sentAt?: Date | string;
  status?: string;
  isRead?: boolean;
  importance?: string;
  hasAttachments?: boolean;
}

export async function POST(request: NextRequest) {
  console.log("[EMAIL-ANALYSIS] POST request received - v6 (with client emails support)");
  try {
    const body = await request.json();
    console.log("[EMAIL-ANALYSIS] Request body keys:", Object.keys(body));
    const { emailIds, emails: clientEmails } = body;

    // Use client-provided emails if available, otherwise query database
    let emailsToAnalyze: ClientEmail[] = [];
    
    if (clientEmails && Array.isArray(clientEmails) && clientEmails.length > 0) {
      // Use emails from the client (Zustand store)
      console.log("[EMAIL-ANALYSIS] Using", clientEmails.length, "emails from client");
      emailsToAnalyze = clientEmails;
    } else {
      // Fall back to database query
      console.log("[EMAIL-ANALYSIS] No client emails, querying database");
      
      // Build where clause - analyze all synced emails, optionally filtered by IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailWhereClause: any = {};
      if (emailIds && Array.isArray(emailIds) && emailIds.length > 0) {
        emailWhereClause.id = { in: emailIds };
      }

      // Fetch emails from database
      try {
        const syncedEmails = await prisma.syncedEmail.findMany({
          where: emailWhereClause,
          orderBy: { receivedAt: "desc" },
          take: 500,
        });
        console.log("[EMAIL-ANALYSIS] Found", syncedEmails.length, "emails in database");
        emailsToAnalyze = syncedEmails.map(e => ({
          id: e.id,
          subject: e.subject,
          body: e.body || undefined,
          bodyPreview: e.bodyPreview || undefined,
          fromEmail: e.fromEmail,
          fromName: e.fromName,
          toEmails: e.toEmails,
          ccEmails: e.ccEmails || undefined,
          receivedAt: e.receivedAt,
          sentAt: e.sentAt || undefined,
          status: e.status,
          isRead: e.isRead,
          importance: e.importance,
          hasAttachments: e.hasAttachments,
        }));
      } catch (dbError) {
        console.error("[EMAIL-ANALYSIS] DB error finding emails:", dbError);
        return NextResponse.json(
          { error: "Database error", details: String(dbError) },
          { status: 500 }
        );
      }
    }
    
    console.log("[EMAIL-ANALYSIS] Total emails to analyze:", emailsToAnalyze.length);

    // Fetch ALL tickets (open and closed) for cross-reference
    let allTickets: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      category: string;
      createdAt: Date;
    }[] = [];
    try {
      allTickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
        },
      });
      console.log("[EMAIL-ANALYSIS] Found", allTickets.length, "tickets to compare");
    } catch (dbError) {
      console.error("[EMAIL-ANALYSIS] DB error finding tickets:", dbError);
      allTickets = [];
    }

    if (emailsToAnalyze.length === 0 && allTickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No emails or tickets to analyze.",
        groups: [],
        emailAnalysis: [],
        ticketStats: { total: 0, open: 0, closed: 0 },
        stats: {
          totalEmails: 0,
          totalGroups: 0,
          potentialDuplicates: 0,
          emailsWithDuplicates: 0,
          emailsToLink: 0,
          emailsToCreate: 0,
        },
      });
    }

    // Analyze each email
    const analyzedEmails: AnalyzedEmail[] = [];
    for (const email of emailsToAnalyze) {
      try {
        let toArray: string[] = [];
        try {
          toArray = email.toEmails ? JSON.parse(email.toEmails) : [];
        } catch {
          toArray = [];
        }
        
        const analyzed = analyzeEmail({
          id: email.id,
          subject: email.subject || "",
          from: email.fromEmail || "",
          to: toArray,
          body: email.body || email.bodyPreview || "",
          receivedAt: new Date(email.receivedAt),
        });
        analyzedEmails.push(analyzed);
      } catch (emailError) {
        console.error(`Error analyzing email ${email.id}:`, emailError);
      }
    }

    // Analyze each ticket
    const analyzedTickets: AnalyzedTicket[] = [];
    for (const ticket of allTickets) {
      try {
        const analyzed = analyzeTicket({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          createdAt: new Date(ticket.createdAt),
        });
        analyzedTickets.push(analyzed);
      } catch (ticketError) {
        console.error(`Error analyzing ticket ${ticket.id}:`, ticketError);
      }
    }

    // Group related emails
    let groups: EmailGroup[] = [];
    if (analyzedEmails.length > 0) {
      try {
        groups = groupRelatedEmails(analyzedEmails);
      } catch (groupError) {
        console.error("Error grouping emails:", groupError);
      }
    }

    // Cross-analyze emails with tickets
    const crossAnalysis = analyzedEmails.length > 0 && analyzedTickets.length > 0
      ? crossAnalyzeEmailsAndTickets(analyzedEmails, analyzedTickets)
      : { emailsWithMatches: [], stats: { totalEmails: 0, emailsWithDuplicates: 0, emailsToLink: 0, emailsToCreate: analyzedEmails.length } };

    // Find duplicate email groups
    const duplicateGroups = groups.filter((g) => g.relatedEmails.length > 0);

    // Count ticket statuses
    const openStatuses = ["open", "in-progress", "pending", "new"];
    const openTickets = allTickets.filter(t => openStatuses.includes(t.status.toLowerCase()));
    const closedTickets = allTickets.filter(t => !openStatuses.includes(t.status.toLowerCase()));

    // Enrich groups with ticket match info
    const enrichedGroups = groups.map(group => {
      const emailMatch = crossAnalysis.emailsWithMatches.find(
        em => em.email.id === group.primaryEmail.id
      );
      return {
        ...group,
        matchingTickets: emailMatch?.matchingTickets || [],
        recommendation: emailMatch?.recommendation || "create",
        recommendationReason: emailMatch?.recommendationReason || "No matching tickets",
      };
    });

    return NextResponse.json({
      success: true,
      groups: enrichedGroups,
      emailAnalysis: crossAnalysis.emailsWithMatches,
      ticketStats: {
        total: allTickets.length,
        open: openTickets.length,
        closed: closedTickets.length,
        analyzed: analyzedTickets.length,
      },
      stats: {
        totalEmails: analyzedEmails.length,
        totalTickets: allTickets.length,
        totalGroups: groups.length,
        potentialDuplicates: duplicateGroups.length,
        emailsWithDuplicates: crossAnalysis.stats.emailsWithDuplicates,
        emailsToLink: crossAnalysis.stats.emailsToLink,
        emailsToCreate: crossAnalysis.stats.emailsToCreate,
      },
    });
  } catch (error) {
    console.error("Email analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze emails", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to analyze a single email and find duplicates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get("emailId");

    if (!emailId) {
      return NextResponse.json(
        { error: "Email ID is required" },
        { status: 400 }
      );
    }

    // Fetch the target email
    const targetEmail = await prisma.syncedEmail.findUnique({
      where: { id: emailId },
    });

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Fetch other emails for comparison
    const otherEmails = await prisma.syncedEmail.findMany({
      where: {
        id: { not: emailId },
      },
      orderBy: { receivedAt: "desc" },
      take: 200,
    });

    // Parse target email toEmails
    let targetToArray: string[] = [];
    try {
      targetToArray = targetEmail.toEmails ? JSON.parse(targetEmail.toEmails) : [];
    } catch {
      targetToArray = [];
    }

    // Analyze emails with correct field names
    const analyzedTarget = analyzeEmail({
      id: targetEmail.id,
      subject: targetEmail.subject,
      from: targetEmail.fromEmail,
      to: targetToArray,
      body: targetEmail.body || targetEmail.bodyPreview || "",
      receivedAt: new Date(targetEmail.receivedAt),
    });

    const analyzedOthers = otherEmails.map((email) => {
      let toArray: string[] = [];
      try {
        toArray = email.toEmails ? JSON.parse(email.toEmails) : [];
      } catch {
        toArray = [];
      }
      return analyzeEmail({
        id: email.id,
        subject: email.subject,
        from: email.fromEmail,
        to: toArray,
        body: email.body || email.bodyPreview || "",
        receivedAt: new Date(email.receivedAt),
      });
    });

    // Find potential duplicates
    const potentialDuplicates = findPotentialDuplicates(analyzedTarget, analyzedOthers);

    // Find potentially related tickets
    const existingTickets = await prisma.ticket.findMany({
      where: {
        sourceId: { in: potentialDuplicates.map((d) => d.email.id) },
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      email: analyzedTarget,
      potentialDuplicates: potentialDuplicates.map((d) => ({
        email: {
          id: d.email.id,
          subject: d.email.subject,
          from: d.email.from,
          receivedAt: d.email.receivedAt,
          issueType: d.email.entities.issueType,
        },
        similarity: d.similarity,
      })),
      relatedTickets: existingTickets,
    });
  } catch (error) {
    console.error("Email analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze email", details: String(error) },
      { status: 500 }
    );
  }
}
