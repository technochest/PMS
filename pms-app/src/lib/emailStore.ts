import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  Email,
  EmailStatus,
  EmailAccount,
  Priority,
} from "./types";

// Sample emails based on the CSV data patterns
const generateSampleEmails = (): Email[] => {
  const baseDate = new Date();
  const emails: Email[] = [
    {
      id: uuidv4(),
      messageId: "msg-001",
      conversationId: "conv-001",
      subject: "Problem with Zest Order #TBT1105",
      body: `Hi Team,

Order TBT1105 was stuck in the Shopify-NetSuite workflow with a Celigo error. Alex successfully resynced the order, but the root cause remains unidentified. The order became visible in Celigo only after syncing back through Shopify into NetSuite.

Can you please investigate why this happened and prevent it from occurring again?

Thanks,
Kate Borrelli`,
      bodyPreview: "Order TBT1105 was stuck in the Shopify-NetSuite workflow with a Celigo error...",
      from: "kate.borrelli@mdlz.com",
      fromName: "Kate Borrelli",
      to: ["junaid.buchal@mdlz.com", "suitetooth@mdlz.com"],
      cc: ["maria.melvin@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-002",
      conversationId: "conv-002",
      subject: "RE: Netsuite balances for BlackLine - Request - Session #2",
      body: `Hello,

The requirement is a report that lists all subsidiaries. It should show the amounts for each account, shown separately for each company. The report should not combine the amounts into one total.

Can this report be automatically sent from NetSuite? I have included an example.

Best regards,
Poonam Srivastava`,
      bodyPreview: "The requirement is a report that lists all subsidiaries...",
      from: "poonam.srivastava@mdlz.com",
      fromName: "Poonam Srivastava",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["deyanira.chavarria@mdlz.com"],
      status: "unread",
      importance: "normal",
      hasAttachments: true,
      attachments: [
        { id: "att-001", name: "BlackLine_Report_Example.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 245000 }
      ],
      receivedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-003",
      conversationId: "conv-003",
      subject: "Netsuite: Cash Flow Report Request",
      body: `Hi Junaid,

Tech Team is looking to create Cash Flow Statement Google Cloud from the ODBC Connection. They need to know how to do that.

Can you provide guidance on this?

Thanks,
Chris Ypsilantis`,
      bodyPreview: "Tech Team is looking to create Cash Flow Statement Google Cloud from the ODBC Connection...",
      from: "chris.ypsilantis@mdlz.com",
      fromName: "Chris Ypsilantis",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["aditya.rahul@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-004",
      conversationId: "conv-004",
      subject: "Unfulfilled/Partially Fulfilled Shopify Orders",
      body: `Hi Team,

Orders in Shopify were getting partially fulfilled. Hairball have identified that the root cause of the issue was a negative inventory adjustment made in late October to the Outbound Staging bin.

This bin is solely intended for WMS pick tasks and fulfillments, so it shouldn't have been transacted against. This negative quantity adjustment led to the item's quantity resetting to zero once processed.

Please advise on next steps.

Thanks,
Maria Melvin`,
      bodyPreview: "Orders in Shopify were getting partially fulfilled. Hairball have identified...",
      from: "maria.melvin@mdlz.com",
      fromName: "Maria Melvin",
      to: ["suitetooth@mdlz.com"],
      cc: ["junaid.buchal@mdlz.com", "joe.p@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "suitetooth@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-005",
      conversationId: "conv-005",
      subject: "[External] : Re: PO Audit Trail",
      body: `Hi,

IR didn't record the GL impact for the PO in question. This was flagged during our internal review.

Can you please investigate and provide the missing information?

Thanks,
Diandra Harriot-Samuel`,
      bodyPreview: "IR didn't record the GL impact for the PO in question...",
      from: "diandra.harriot-samuel@mdlz.com",
      fromName: "Diandra Harriot-Samuel",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["brian.lambart@mdlz.com"],
      status: "unread",
      importance: "normal",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-006",
      conversationId: "conv-006",
      subject: "WEBCKY-1199 - MUP-2PK - Late Shipments",
      body: `Hi Team,

We have 131 late Amazon shipments, primarily for WEBCKY-1199 (MUP-2PK item), with 229 units backordered across 161 orders. Orders continued flowing into Amazon until Nov 11 despite expectation that the item was turned off on Friday (Nov 7).

Root Cause: Miscommunication - Faire and Web were turned off Friday, but Amazon remained active to sell through pre-built inventory. The ASIN wasn't disabled until Wednesday (Nov 12) when the issue was identified.

Please investigate and resolve.

Maria Melvin`,
      bodyPreview: "We have 131 late Amazon shipments, primarily for WEBCKY-1199...",
      from: "maria.melvin@mdlz.com",
      fromName: "Maria Melvin",
      to: ["junaid.buchal@mdlz.com", "suitetooth@mdlz.com"],
      cc: ["joe.p@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-007",
      conversationId: "conv-007",
      subject: "Re: Kelvin Valladares - Login Reset Needed",
      body: `Hi,

Could you please reset credentials to Kelvin Valladares? He is not able to log-in to the handheld device as it showing incorrect email or password.

Please if you can support in getting this done ASAP, would be great as he is a picker and need to go back to build orders.

Thanks,
Eduardo Loyola`,
      bodyPreview: "Could you please reset credentials to Kelvin Valladares?...",
      from: "eduardo.loyola@mdlz.com",
      fromName: "Eduardo Loyola",
      to: ["suitetooth@mdlz.com"],
      cc: ["junaid.buchal@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "suitetooth@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-008",
      conversationId: "conv-008",
      subject: "Email addresses for the Temps",
      body: `Hi,

We have several temps that will be working here for the holidays & they will be needing email addresses so they can sign on the mobile devices for NetSuite. I am not sure if you are the goto person for this if not can tell me who I need to speak to & I will reach out.

The names below are the temps that are working here now so we would need them to have access as soon as possible.

- John Smith
- Jane Doe
- Mike Johnson

Thanks,
Maria Melvin`,
      bodyPreview: "We have several temps that will be working here for the holidays...",
      from: "maria.melvin@mdlz.com",
      fromName: "Maria Melvin",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["joe.p@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-009",
      conversationId: "conv-009",
      subject: "Urgent - PaceJet Labels with Future Date",
      body: `Hi,

We need PaceJet shipping labels to print with the customer-requested ship date (future date) instead of the current date when processing Zest corporate gifting orders that have scheduled delivery dates.

CURRENT STATE - PROBLEM DESCRIPTION:
1. Order Flow:
   - Customers place corporate gifting orders through Zest platform (gifts.zest.co)
   - Orders are transmitted to Shopify with future ship dates (e.g., ship date of 11/15/2025)
   - Orders sync from Shopify → NetSuite with the future ship date stored in NetSuite

2. Issue:
   - When Maria (Operations) waves orders in NetSuite and prints shipping labels via PaceJet, the labels print with today's date instead of the requested future ship date
   - This creates operational confusion and potential shipping errors
   - Operations team needs to manually track which orders should be held for future shipment

Please provide a proposal with scope, timeline, and cost estimate.

Thanks,
Maria Melvin`,
      bodyPreview: "We need PaceJet shipping labels to print with the customer-requested ship date...",
      from: "maria.melvin@mdlz.com",
      fromName: "Maria Melvin",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["joe.p@mdlz.com", "suitetooth@mdlz.com"],
      status: "unread",
      importance: "high",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 25 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 25 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      messageId: "msg-010",
      conversationId: "conv-010",
      subject: "265610: Celigo flow getting stuck for 40 hours until manually cancelled",
      body: `Hello,

My name is Ronnie De Guzman. I have been assigned to your ticket #265610: Celigo flow getting stuck for 40 hours until manually cancelled.

I need access to investigate the issue. Can you please provide the necessary credentials or grant access to the Celigo environment?

Let me know when would be a good time for a call to discuss this further.

Best regards,
Ronnie De Guzman
Celigo Support`,
      bodyPreview: "My name is Ronnie De Guzman. I have been assigned to your ticket #265610...",
      from: "ronnie.deguzman@celigo.com",
      fromName: "Ronnie De Guzman",
      to: ["junaid.buchal@mdlz.com"],
      cc: ["alex.g@hairball.com", "suitetooth@mdlz.com"],
      status: "unread",
      importance: "normal",
      hasAttachments: false,
      receivedAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      sentAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      aiAnalyzed: false,
      mailbox: "junaid.buchal@mdlz.com",
      folder: "Inbox",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  return emails;
};

interface EmailStore {
  // State
  emails: Email[];
  selectedEmailId: string | null;
  emailAccounts: EmailAccount[];
  selectedMailbox: string;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;

  // Actions
  setEmails: (emails: Email[]) => void;
  addEmail: (email: Omit<Email, "id" | "createdAt" | "updatedAt">) => Email;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  deleteEmail: (id: string) => void;
  selectEmail: (id: string | null) => void;
  
  // Email operations
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  archiveEmail: (id: string) => void;
  ignoreEmail: (id: string) => void;
  
  // AI Analysis
  analyzeEmail: (id: string) => Promise<void>;
  
  // Ticket conversion
  convertToTicket: (emailId: string) => {
    ticketData: any;
    emailId: string;
  };
  markAsConverted: (emailId: string, ticketId: string, ticketNumber: number) => void;
  
  // Mailbox
  setSelectedMailbox: (mailbox: string) => void;
  getEmailsByMailbox: (mailbox: string) => Email[];
  
  // Sync (placeholder for MS Graph integration)
  syncEmails: () => Promise<void>;
  
  // Initialize with sample data
  initializeSampleData: () => void;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Simple AI analysis simulation (in production, this would call an actual AI API)
const analyzeEmailWithAI = (email: Email): Partial<Email> => {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Determine category based on keywords
  let category = "Other";
  let application = "NetSuite";
  let priority: Priority = "medium";
  let type = "task";
  
  // Category detection
  if (subject.includes("celigo") || body.includes("celigo") || body.includes("integration") || body.includes("sync")) {
    category = "Integration";
  } else if (subject.includes("report") || body.includes("report") || body.includes("odbc")) {
    category = "Reporting";
  } else if (subject.includes("access") || body.includes("login") || body.includes("password") || body.includes("credentials")) {
    category = "Access";
  } else if (subject.includes("error") || body.includes("error") || body.includes("issue") || body.includes("problem")) {
    category = "System Error";
  } else if (subject.includes("inventory") || body.includes("inventory") || body.includes("fulfillment")) {
    category = "Inventory";
  }
  
  // Application detection
  if (subject.includes("shopify") || body.includes("shopify")) {
    application = "Shopify";
  } else if (subject.includes("celigo") || body.includes("celigo")) {
    application = "Celigo";
  } else if (subject.includes("pacejet") || body.includes("pacejet")) {
    application = "PaceJet";
  } else if (subject.includes("amazon") || body.includes("amazon")) {
    application = "Amazon";
  } else if (subject.includes("zest") || body.includes("zest")) {
    application = "Zest";
  } else if (subject.includes("blackline") || body.includes("blackline")) {
    application = "BlackLine";
  }
  
  // Priority detection
  if (subject.includes("urgent") || subject.includes("asap") || body.includes("urgent") || body.includes("critical")) {
    priority = "critical";
  } else if (email.importance === "high" || subject.includes("important")) {
    priority = "high";
  }
  
  // Type detection
  if (body.includes("request") || subject.includes("request")) {
    type = "request";
  } else if (body.includes("issue") || body.includes("problem") || body.includes("error")) {
    type = "issue";
  } else if (body.includes("question") || body.includes("inquiry") || body.includes("how to")) {
    type = "inquiry";
  }
  
  // Generate suggested title
  let suggestedTitle = email.subject
    .replace(/^(re:|fw:|fwd:)\s*/gi, "")
    .replace(/^\[external\]\s*:\s*/gi, "")
    .trim();
  
  // Generate suggested summary
  const sentences = email.body.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const suggestedSummary = sentences.slice(0, 2).join(". ").trim() + ".";
  
  return {
    aiAnalyzed: true,
    aiSuggestedCategory: category,
    aiSuggestedApplication: application,
    aiSuggestedPriority: priority,
    aiSuggestedTitle: suggestedTitle,
    aiSuggestedSummary: suggestedSummary.length > 500 ? suggestedSummary.substring(0, 500) + "..." : suggestedSummary,
    aiSuggestedType: type,
  };
};

export const useEmailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      emails: [],
      selectedEmailId: null,
      emailAccounts: [
        { id: "acc-1", email: "junaid.buchal@mdlz.com", displayName: "Junaid Buchal", isActive: true, lastSyncedAt: new Date() },
        { id: "acc-2", email: "suitetooth@mdlz.com", displayName: "SuiteTooth", isActive: true, lastSyncedAt: new Date() },
      ],
      selectedMailbox: "junaid.buchal@mdlz.com",
      isLoading: false,
      error: null,
      isSyncing: false,

      setEmails: (emails) => set({ emails }),
      
      addEmail: (emailData) => {
        const email: Email = {
          ...emailData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          emails: [email, ...state.emails],
        }));
        return email;
      },

      updateEmail: (id, updates) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, ...updates, updatedAt: new Date() }
              : email
          ),
        }));
      },

      deleteEmail: (id) => {
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== id),
          selectedEmailId:
            state.selectedEmailId === id ? null : state.selectedEmailId,
        }));
      },

      selectEmail: (id) => {
        set({ selectedEmailId: id });
        // Auto mark as read when selected
        if (id) {
          const email = get().emails.find(e => e.id === id);
          if (email && !email.isRead) {
            get().markAsRead(id);
          }
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, isRead: true, status: email.status === "unread" ? "read" : email.status, updatedAt: new Date() }
              : email
          ),
        }));
      },

      markAsUnread: (id) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, isRead: false, status: "unread", updatedAt: new Date() }
              : email
          ),
        }));
      },

      archiveEmail: (id) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, status: "archived", updatedAt: new Date() }
              : email
          ),
        }));
      },

      ignoreEmail: (id) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, status: "ignored", updatedAt: new Date() }
              : email
          ),
        }));
      },

      analyzeEmail: async (id) => {
        const email = get().emails.find(e => e.id === id);
        if (!email) return;
        
        // Simulate AI processing delay
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const aiResults = analyzeEmailWithAI(email);
        get().updateEmail(id, aiResults);
        
        set({ isLoading: false });
      },

      convertToTicket: (emailId) => {
        const email = get().emails.find(e => e.id === emailId);
        if (!email) {
          return { ticketData: null, emailId };
        }
        
        // Generate ticket data from email (using AI suggestions if available)
        const ticketData = {
          type: (email.aiSuggestedType || "task") as any,
          title: email.aiSuggestedTitle || email.subject.replace(/^(re:|fw:|fwd:)\s*/gi, "").replace(/^\[external\]\s*:\s*/gi, "").trim(),
          summary: email.aiSuggestedSummary || email.bodyPreview,
          emailSubject: email.subject,
          emailConversation: email.body,
          emailFrom: email.from,
          emailTo: email.to.join(", "),
          emailCc: email.cc.join(", "),
          source: "email" as const,
          dateRequested: email.receivedAt,
          requestorEmail: email.from,
          requestorName: email.fromName || email.from.split("@")[0].replace(".", " "),
          priority: email.aiSuggestedPriority || (email.importance === "high" ? "high" : "medium") as any,
          category: (email.aiSuggestedCategory || "Other") as any,
          application: email.aiSuggestedApplication as any,
        };
        
        return { ticketData, emailId };
      },

      markAsConverted: (emailId, ticketId, ticketNumber) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId
              ? { 
                  ...email, 
                  status: "converted" as EmailStatus, 
                  convertedToTicketId: ticketId,
                  ticketNumber: ticketNumber,
                  updatedAt: new Date() 
                }
              : email
          ),
        }));
      },

      setSelectedMailbox: (mailbox) => set({ selectedMailbox: mailbox }),

      getEmailsByMailbox: (mailbox) => {
        return get().emails.filter(email => 
          email.mailbox === mailbox || 
          email.to.includes(mailbox) || 
          email.cc.includes(mailbox)
        );
      },

      syncEmails: async () => {
        set({ isSyncing: true });
        // In production, this would call Microsoft Graph API
        // For now, just simulate a sync delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        set({ isSyncing: false });
      },

      initializeSampleData: () => {
        const currentEmails = get().emails;
        if (currentEmails.length === 0) {
          const sampleEmails = generateSampleEmails();
          set({ emails: sampleEmails });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "email-storage",
    }
  )
);

export default useEmailStore;
