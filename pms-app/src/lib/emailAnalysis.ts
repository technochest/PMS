/**
 * Email Analysis Service
 * 
 * Uses AI to analyze emails and detect related/duplicate issues
 * to prevent duplicate ticket creation.
 */

// Key entities extracted from an email
export interface EmailEntities {
  sender: string;
  senderDomain: string;
  recipients: string[];
  subject: string;
  keywords: string[];
  productMentions: string[];
  orderNumbers: string[];
  issueType: string | null;
  urgency: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
}

// Key entities extracted from a ticket
export interface TicketEntities {
  keywords: string[];
  productMentions: string[];
  referenceNumbers: string[];
  issueType: string | null;
  category: string | null;
}

// Analyzed ticket for comparison
export interface AnalyzedTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: Date;
  entities: TicketEntities;
}

// Match between email and existing ticket
export interface EmailTicketMatch {
  ticket: AnalyzedTicket;
  similarityScore: number;
  matchReasons: string[];
  confidence: "low" | "medium" | "high";
  isDuplicate: boolean;
}

// Similarity result between two emails
export interface EmailSimilarity {
  score: number; // 0-100
  reasons: string[];
  isLikelyRelated: boolean;
  confidence: "low" | "medium" | "high";
}

// Group of related emails
export interface EmailGroup {
  id: string;
  primaryEmail: AnalyzedEmail;
  relatedEmails: AnalyzedEmail[];
  suggestedTicketTitle: string;
  suggestedCategory: string;
  suggestedPriority: string;
  commonKeywords: string[];
  participants: string[];
  dateRange: { earliest: Date; latest: Date };
}

// Analyzed email with extracted entities
export interface AnalyzedEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  receivedAt: Date;
  entities: EmailEntities;
  existingTicketId?: string;
  groupId?: string;
}

/**
 * Extract keywords from text using simple NLP
 */
function extractKeywords(text: string): string[] {
  // Handle null/undefined text
  if (!text) return [];
  
  // Common stop words to filter out
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "this", "that",
    "these", "those", "i", "you", "he", "she", "it", "we", "they", "what",
    "which", "who", "when", "where", "why", "how", "all", "each", "every",
    "both", "few", "more", "most", "other", "some", "such", "no", "not",
    "only", "same", "so", "than", "too", "very", "just", "also", "now",
    "here", "there", "our", "your", "my", "his", "her", "its", "their",
    "if", "then", "because", "while", "although", "however", "please",
    "thanks", "thank", "regards", "hi", "hello", "dear", "best", "sincerely"
  ]);

  // Extract words, filter, and count
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Count word frequency
  const wordCounts = new Map<string, number>();
  words.forEach(w => wordCounts.set(w, (wordCounts.get(w) || 0) + 1));

  // Return top keywords by frequency
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Extract order numbers, ticket IDs, and reference numbers
 */
function extractReferences(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    /\b(ORD|ORDER|PO|SO)[-#]?\s*(\d{4,})\b/gi,
    /\b(TKT|TICKET|CASE|INC)[-#]?\s*(\d{4,})\b/gi,
    /\b(REF|REFERENCE)[-#]?\s*([A-Z0-9]{5,})\b/gi,
    /\b([A-Z]{2,4}-\d{4,})\b/g,
    /\b(\d{6,10})\b/g, // Generic order numbers
  ];

  const references: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      references.push(...matches.map(m => m.toUpperCase()));
    }
  });

  return [...new Set(references)];
}

/**
 * Extract product/system mentions
 */
function extractProductMentions(text: string): string[] {
  if (!text) return [];
  
  // Common product/system keywords - could be customized per organization
  const productPatterns = [
    /\b(pacjet|packjet|pack-jet)\b/gi,
    /\b(printer|printing|print)\b/gi,
    /\b(invoice|invoicing)\b/gi,
    /\b(shipping|shipment|delivery)\b/gi,
    /\b(order|orders)\b/gi,
    /\b(label|labels|labeling)\b/gi,
    /\b(scanner|scanning)\b/gi,
    /\b(system|application|app|software)\b/gi,
    /\b(database|db)\b/gi,
    /\b(network|internet|connection)\b/gi,
    /\b(login|password|access|permission)\b/gi,
    /\b(error|issue|problem|bug|crash)\b/gi,
  ];

  const mentions: string[] = [];
  productPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      mentions.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return [...new Set(mentions)];
}

/**
 * Detect issue type from email content
 */
function detectIssueType(text: string, subject: string): string | null {
  const combined = `${subject || ""} ${text || ""}`.toLowerCase();

  const issuePatterns: [RegExp, string][] = [
    [/\b(not working|doesn't work|won't start|stopped|broken|down)\b/i, "System Outage"],
    [/\b(error|exception|failed|failure|crash)\b/i, "Error/Bug"],
    [/\b(slow|performance|timeout|taking long)\b/i, "Performance Issue"],
    [/\b(print|printer|printing|label)\b/i, "Printing Issue"],
    [/\b(login|password|access|permission|denied)\b/i, "Access Issue"],
    [/\b(request|need|want|please add|feature)\b/i, "Feature Request"],
    [/\b(how to|how do|help with|question about)\b/i, "How-To Question"],
    [/\b(order|shipment|delivery|tracking)\b/i, "Order Issue"],
    [/\b(invoice|billing|payment|charge)\b/i, "Billing Issue"],
    [/\b(data|report|missing|incorrect)\b/i, "Data Issue"],
  ];

  for (const [pattern, issueType] of issuePatterns) {
    if (pattern.test(combined)) {
      return issueType;
    }
  }

  return null;
}

/**
 * Detect urgency level from email
 */
function detectUrgency(text: string, subject: string): "low" | "medium" | "high" | "critical" {
  const combined = `${subject || ""} ${text || ""}`.toLowerCase();

  if (/\b(urgent|asap|immediately|critical|emergency|down|outage)\b/i.test(combined)) {
    return "critical";
  }
  if (/\b(high priority|important|need today|by eod|end of day)\b/i.test(combined)) {
    return "high";
  }
  if (/\b(soon|when you can|this week)\b/i.test(combined)) {
    return "medium";
  }
  return "low";
}

/**
 * Detect sentiment from email
 */
function detectSentiment(text: string): "positive" | "neutral" | "negative" | "frustrated" {
  if (!text) return "neutral";
  const lowerText = text.toLowerCase();

  const frustratedPatterns = /\b(frustrated|angry|unacceptable|terrible|worst|fed up|sick of|tired of|!!+)\b/i;
  const negativePatterns = /\b(problem|issue|wrong|incorrect|failed|error|bad|poor|disappointed)\b/i;
  const positivePatterns = /\b(thank|great|excellent|perfect|wonderful|appreciate|helpful|good job)\b/i;

  if (frustratedPatterns.test(lowerText)) return "frustrated";
  if (negativePatterns.test(lowerText) && !positivePatterns.test(lowerText)) return "negative";
  if (positivePatterns.test(lowerText)) return "positive";
  return "neutral";
}

/**
 * Extract all entities from an email
 */
export function analyzeEmail(email: {
  id: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  receivedAt: Date;
}): AnalyzedEmail {
  const subject = email.subject || "";
  const body = email.body || "";
  const from = email.from || "";
  const to = email.to || [];
  
  const fullText = `${subject} ${body}`;
  const senderDomain = from.includes("@") ? from.split("@")[1] : "";

  const entities: EmailEntities = {
    sender: from,
    senderDomain,
    recipients: to,
    subject: subject,
    keywords: extractKeywords(fullText),
    productMentions: extractProductMentions(fullText),
    orderNumbers: extractReferences(fullText),
    issueType: detectIssueType(body, subject),
    urgency: detectUrgency(body, subject),
    sentiment: detectSentiment(body),
  };

  return {
    id: email.id,
    subject: subject,
    from: from,
    to: to,
    body: body,
    receivedAt: email.receivedAt,
    entities,
  };
}

/**
 * Calculate similarity score between two emails
 */
export function calculateEmailSimilarity(
  email1: AnalyzedEmail,
  email2: AnalyzedEmail
): EmailSimilarity {
  const reasons: string[] = [];
  let score = 0;

  // Same sender domain (might be same organization)
  if (email1.entities.senderDomain === email2.entities.senderDomain) {
    score += 15;
    reasons.push("Same sender domain");
  }

  // Same sender
  if (email1.entities.sender === email2.entities.sender) {
    score += 20;
    reasons.push("Same sender");
  }

  // Shared order numbers (strong indicator)
  const sharedOrders = email1.entities.orderNumbers.filter(o => 
    email2.entities.orderNumbers.includes(o)
  );
  if (sharedOrders.length > 0) {
    score += 40;
    reasons.push(`Same order reference: ${sharedOrders.join(", ")}`);
  }

  // Keyword overlap
  const keywords1 = new Set(email1.entities.keywords);
  const keywords2 = new Set(email2.entities.keywords);
  const sharedKeywords = [...keywords1].filter(k => keywords2.has(k));
  const keywordOverlap = sharedKeywords.length / Math.max(keywords1.size, keywords2.size, 1);
  if (keywordOverlap > 0.3) {
    score += Math.round(keywordOverlap * 25);
    reasons.push(`${Math.round(keywordOverlap * 100)}% keyword overlap`);
  }

  // Product mentions overlap
  const products1 = new Set(email1.entities.productMentions);
  const products2 = new Set(email2.entities.productMentions);
  const sharedProducts = [...products1].filter(p => products2.has(p));
  if (sharedProducts.length > 0) {
    score += sharedProducts.length * 10;
    reasons.push(`Same products: ${sharedProducts.join(", ")}`);
  }

  // Same issue type
  if (email1.entities.issueType && email1.entities.issueType === email2.entities.issueType) {
    score += 15;
    reasons.push(`Same issue type: ${email1.entities.issueType}`);
  }

  // Time proximity (within 7 days)
  const daysDiff = Math.abs(
    (email1.receivedAt.getTime() - email2.receivedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 7) {
    score += Math.round((7 - daysDiff) * 2);
    reasons.push(`Within ${Math.round(daysDiff)} days`);
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine confidence
  let confidence: "low" | "medium" | "high" = "low";
  if (score >= 70) confidence = "high";
  else if (score >= 45) confidence = "medium";

  return {
    score,
    reasons,
    isLikelyRelated: score >= 50,
    confidence,
  };
}

/**
 * Group related emails together
 */
export function groupRelatedEmails(emails: AnalyzedEmail[]): EmailGroup[] {
  if (emails.length === 0) return [];

  const groups: EmailGroup[] = [];
  const assigned = new Set<string>();

  // Sort by date (oldest first)
  const sorted = [...emails].sort(
    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
  );

  for (const email of sorted) {
    if (assigned.has(email.id)) continue;

    // Find all related emails
    const related: AnalyzedEmail[] = [];
    for (const other of sorted) {
      if (other.id === email.id || assigned.has(other.id)) continue;
      
      const similarity = calculateEmailSimilarity(email, other);
      if (similarity.isLikelyRelated) {
        related.push(other);
        assigned.add(other.id);
      }
    }

    // Create group
    assigned.add(email.id);
    const allEmails = [email, ...related];
    
    // Extract common info
    const allKeywords = allEmails.flatMap(e => e.entities.keywords);
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach(k => keywordCounts.set(k, (keywordCounts.get(k) || 0) + 1));
    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const participants = [...new Set(allEmails.map(e => e.entities.sender))];
    const dates = allEmails.map(e => e.receivedAt);

    // Suggest ticket info based on primary email
    const issueType = email.entities.issueType || "General Issue";
    const products = (email.entities.productMentions || []).slice(0, 2).join(" ");
    const suggestedTitle = products 
      ? `${issueType} - ${products}`
      : issueType;

    groups.push({
      id: `group-${Date.now()}-${groups.length}`,
      primaryEmail: email,
      relatedEmails: related,
      suggestedTicketTitle: suggestedTitle,
      suggestedCategory: (issueType || "general").toLowerCase().replace(/\s+/g, "-"),
      suggestedPriority: email.entities.urgency === "critical" ? "high" 
        : email.entities.urgency === "high" ? "high" 
        : "medium",
      commonKeywords,
      participants,
      dateRange: {
        earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
        latest: new Date(Math.max(...dates.map(d => d.getTime()))),
      },
    });
  }

  return groups;
}

/**
 * Find potential duplicate tickets based on email analysis
 */
export function findPotentialDuplicates(
  newEmail: AnalyzedEmail,
  existingEmails: AnalyzedEmail[]
): { email: AnalyzedEmail; similarity: EmailSimilarity }[] {
  const potentialDuplicates: { email: AnalyzedEmail; similarity: EmailSimilarity }[] = [];

  for (const existing of existingEmails) {
    const similarity = calculateEmailSimilarity(newEmail, existing);
    if (similarity.isLikelyRelated) {
      potentialDuplicates.push({ email: existing, similarity });
    }
  }

  // Sort by similarity score descending
  return potentialDuplicates.sort((a, b) => b.similarity.score - a.similarity.score);
}

/**
 * Analyze a ticket and extract entities for comparison
 */
export function analyzeTicket(ticket: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  createdAt: Date;
}): AnalyzedTicket {
  const fullText = `${ticket.title || ""} ${ticket.description || ""}`;
  
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description || "",
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdAt: ticket.createdAt,
    entities: {
      keywords: extractKeywords(fullText),
      productMentions: extractProductMentions(fullText),
      referenceNumbers: extractReferences(fullText),
      issueType: detectIssueType(fullText, ticket.title),
      category: ticket.category,
    },
  };
}

/**
 * Find existing tickets that match an email (potential duplicates)
 */
export function findMatchingTickets(
  email: AnalyzedEmail,
  tickets: AnalyzedTicket[]
): EmailTicketMatch[] {
  const matches: EmailTicketMatch[] = [];

  for (const ticket of tickets) {
    const matchResult = calculateEmailTicketSimilarity(email, ticket);
    if (matchResult.similarityScore >= 30) {
      matches.push(matchResult);
    }
  }

  // Sort by similarity score descending
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Calculate similarity between an email and an existing ticket
 */
function calculateEmailTicketSimilarity(
  email: AnalyzedEmail,
  ticket: AnalyzedTicket
): EmailTicketMatch {
  let score = 0;
  const reasons: string[] = [];

  // 1. Check for matching reference/order numbers (strongest signal)
  const emailRefs = new Set(email.entities.orderNumbers.map(r => r.toUpperCase()));
  const ticketRefs = new Set(ticket.entities.referenceNumbers.map(r => r.toUpperCase()));
  const matchingRefs = [...emailRefs].filter(r => ticketRefs.has(r));
  
  if (matchingRefs.length > 0) {
    score += 50;
    reasons.push(`Matching reference: ${matchingRefs.join(", ")}`);
  }

  // 2. Check for matching product mentions
  const emailProducts = new Set(email.entities.productMentions.map(p => p.toLowerCase()));
  const ticketProducts = new Set(ticket.entities.productMentions.map(p => p.toLowerCase()));
  const matchingProducts = [...emailProducts].filter(p => ticketProducts.has(p));
  
  if (matchingProducts.length > 0) {
    score += 15 * Math.min(matchingProducts.length, 2);
    reasons.push(`Same product: ${matchingProducts.join(", ")}`);
  }

  // 3. Check keyword overlap
  const emailKeywords = new Set(email.entities.keywords);
  const ticketKeywords = new Set(ticket.entities.keywords);
  const matchingKeywords = [...emailKeywords].filter(k => ticketKeywords.has(k));
  const keywordOverlap = matchingKeywords.length / Math.max(emailKeywords.size, ticketKeywords.size, 1);
  
  if (keywordOverlap > 0.3) {
    score += Math.round(keywordOverlap * 25);
    reasons.push(`${matchingKeywords.length} matching keywords`);
  }

  // 4. Check if issue types match
  if (email.entities.issueType && ticket.entities.issueType) {
    const emailIssue = email.entities.issueType.toLowerCase();
    const ticketIssue = ticket.entities.issueType.toLowerCase();
    if (emailIssue === ticketIssue || emailIssue.includes(ticketIssue) || ticketIssue.includes(emailIssue)) {
      score += 15;
      reasons.push(`Same issue type: ${email.entities.issueType}`);
    }
  }

  // 5. Check sender email in ticket
  const senderInTicket = ticket.description.toLowerCase().includes(email.entities.sender.toLowerCase());
  if (senderInTicket) {
    score += 20;
    reasons.push("Sender mentioned in ticket");
  }

  // 6. Subject similarity
  const subjectWords = new Set(email.entities.subject.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const titleWords = new Set(ticket.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const titleOverlap = [...subjectWords].filter(w => titleWords.has(w)).length;
  if (titleOverlap >= 2) {
    score += 10;
    reasons.push("Similar subject/title");
  }

  // Determine confidence and duplicate status
  const confidence: "low" | "medium" | "high" = 
    score >= 70 ? "high" : score >= 45 ? "medium" : "low";
  
  // Consider it a duplicate if high confidence AND ticket is open/in-progress
  const isOpenTicket = ["open", "in-progress", "pending", "new"].includes(ticket.status.toLowerCase());
  const isDuplicate = score >= 60 && isOpenTicket;

  return {
    ticket,
    similarityScore: Math.min(score, 100),
    matchReasons: reasons,
    confidence,
    isDuplicate,
  };
}

/**
 * Analyze emails and tickets together to find duplicates and suggest actions
 */
export function crossAnalyzeEmailsAndTickets(
  emails: AnalyzedEmail[],
  tickets: AnalyzedTicket[]
): {
  emailsWithMatches: Array<{
    email: AnalyzedEmail;
    matchingTickets: EmailTicketMatch[];
    recommendation: "skip" | "link" | "create";
    recommendationReason: string;
  }>;
  stats: {
    totalEmails: number;
    emailsWithDuplicates: number;
    emailsToLink: number;
    emailsToCreate: number;
  };
} {
  const results: Array<{
    email: AnalyzedEmail;
    matchingTickets: EmailTicketMatch[];
    recommendation: "skip" | "link" | "create";
    recommendationReason: string;
  }> = [];

  let emailsWithDuplicates = 0;
  let emailsToLink = 0;
  let emailsToCreate = 0;

  for (const email of emails) {
    const matchingTickets = findMatchingTickets(email, tickets);
    const duplicateMatches = matchingTickets.filter(m => m.isDuplicate);
    const linkableMatches = matchingTickets.filter(m => !m.isDuplicate && m.confidence !== "low");

    let recommendation: "skip" | "link" | "create";
    let recommendationReason: string;

    if (duplicateMatches.length > 0) {
      recommendation = "skip";
      recommendationReason = `Duplicate of ticket #${duplicateMatches[0].ticket.id.slice(0, 8)}`;
      emailsWithDuplicates++;
    } else if (linkableMatches.length > 0) {
      recommendation = "link";
      recommendationReason = `Related to ticket #${linkableMatches[0].ticket.id.slice(0, 8)}`;
      emailsToLink++;
    } else {
      recommendation = "create";
      recommendationReason = "No matching tickets found - create new ticket";
      emailsToCreate++;
    }

    results.push({
      email,
      matchingTickets,
      recommendation,
      recommendationReason,
    });
  }

  return {
    emailsWithMatches: results,
    stats: {
      totalEmails: emails.length,
      emailsWithDuplicates,
      emailsToLink,
      emailsToCreate,
    },
  };
}
