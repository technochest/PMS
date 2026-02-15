import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Link an email to an existing ticket
 */
export async function POST(request: NextRequest) {
  try {
    const { emailId, ticketId, action } = await request.json();

    if (!emailId || !ticketId) {
      return NextResponse.json(
        { error: "Email ID and Ticket ID are required" },
        { status: 400 }
      );
    }

    // Verify email exists
    const email = await prisma.syncedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Update email to link to ticket
    const updatedEmail = await prisma.syncedEmail.update({
      where: { id: emailId },
      data: {
        status: "converted",
        convertedToTicketId: ticketId,
      },
    });

    // If action is "append", add email info to ticket description
    if (action === "append") {
      const appendText = `\n\n---\nLinked Email (${new Date().toLocaleDateString()}):\nFrom: ${email.fromEmail}\nSubject: ${email.subject}\n${email.bodyPreview || ""}`;
      
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          description: (ticket.description || "") + appendText,
        },
      });
    }

    return NextResponse.json({
      success: true,
      email: updatedEmail,
      message: `Email linked to ticket: ${ticket.title}`,
    });
  } catch (error) {
    console.error("Email-ticket link error:", error);
    return NextResponse.json(
      { error: "Failed to link email to ticket", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Create a new ticket from an email and optionally link related emails
 * OR link emails to an existing ticket when existingTicketId is provided
 */
export async function PUT(request: NextRequest) {
  try {
    const { 
      primaryEmailId, 
      relatedEmailIds, 
      existingTicketId,
      title, 
      description, 
      priority, 
      category,
      assignedTo,
      userId 
    } = await request.json();

    if (!primaryEmailId || !userId) {
      return NextResponse.json(
        { error: "Primary email ID and user ID are required" },
        { status: 400 }
      );
    }

    // Fetch primary email
    const primaryEmail = await prisma.syncedEmail.findUnique({
      where: { id: primaryEmailId },
    });

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "Primary email not found" },
        { status: 404 }
      );
    }

    let ticket;
    
    // If existingTicketId is provided, link to existing ticket instead of creating new one
    if (existingTicketId) {
      ticket = await prisma.ticket.findUnique({
        where: { id: existingTicketId },
      });
      
      if (!ticket) {
        return NextResponse.json(
          { error: "Existing ticket not found" },
          { status: 404 }
        );
      }
      
      // Append email info to ticket description
      const appendText = `\n\n---\nLinked Email (${new Date().toLocaleDateString()}):\nFrom: ${primaryEmail.fromEmail}\nSubject: ${primaryEmail.subject}\n${primaryEmail.bodyPreview || ""}`;
      
      await prisma.ticket.update({
        where: { id: existingTicketId },
        data: {
          description: (ticket.description || "") + appendText,
        },
      });
    } else {
      // Create new ticket
      ticket = await prisma.ticket.create({
        data: {
          title: title || primaryEmail.subject,
          description: description || primaryEmail.body || primaryEmail.bodyPreview || "",
          priority: priority || "medium",
          category: category || "general",
          assignedTo: assignedTo || null,
          reportedBy: primaryEmail.fromEmail,
          sourceType: "email",
          sourceId: primaryEmailId,
          createdById: userId,
        },
      });
    }

    // Link primary email to ticket
    await prisma.syncedEmail.update({
      where: { id: primaryEmailId },
      data: {
        status: "converted",
        convertedToTicketId: ticket.id,
      },
    });

    // Link related emails if provided
    const linkedEmailIds = [primaryEmailId];
    if (relatedEmailIds && Array.isArray(relatedEmailIds) && relatedEmailIds.length > 0) {
      await prisma.syncedEmail.updateMany({
        where: { id: { in: relatedEmailIds } },
        data: {
          status: "converted",
          convertedToTicketId: ticket.id,
        },
      });
      linkedEmailIds.push(...relatedEmailIds);
    }

    return NextResponse.json({
      success: true,
      ticket,
      linkedEmails: linkedEmailIds.length,
      isLinked: !!existingTicketId,
      message: existingTicketId 
        ? `Linked ${linkedEmailIds.length} email(s) to existing ticket "${ticket.title}"`
        : `Created ticket "${ticket.title}" from ${linkedEmailIds.length} email(s)`,
    });
  } catch (error) {
    console.error("Create ticket from email error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket from email", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get emails linked to a ticket
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const linkedEmails = await prisma.syncedEmail.findMany({
      where: { convertedToTicketId: ticketId },
      orderBy: { receivedAt: "desc" },
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        bodyPreview: true,
        receivedAt: true,
        importance: true,
      },
    });

    return NextResponse.json({
      success: true,
      emails: linkedEmails,
      count: linkedEmails.length,
    });
  } catch (error) {
    console.error("Get linked emails error:", error);
    return NextResponse.json(
      { error: "Failed to get linked emails", details: String(error) },
      { status: 500 }
    );
  }
}
