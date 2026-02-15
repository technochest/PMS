"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Brain,
  Mail,
  AlertTriangle,
  CheckCircle,
  Link2,
  ChevronDown,
  ChevronRight,
  Ticket,
  Loader2,
  RefreshCw,
  Tag,
  ArrowRight,
  Plus,
  X,
  Ban,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import { useAdminStore } from "@/lib/adminStore";
import { useEmailStore } from "@/lib/emailStore";
import { cn } from "@/lib/utils";

interface EmailEntity {
  sender: string;
  senderDomain: string;
  keywords: string[];
  productMentions: string[];
  orderNumbers: string[];
  issueType: string | null;
  urgency: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
}

interface AnalyzedEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  receivedAt: string;
  entities: EmailEntity;
}

interface MatchingTicket {
  ticket: {
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    category: string | null;
  };
  similarityScore: number;
  matchReasons: string[];
  confidence: "low" | "medium" | "high";
  isDuplicate: boolean;
}

interface EmailGroup {
  id: string;
  primaryEmail: AnalyzedEmail;
  relatedEmails: AnalyzedEmail[];
  suggestedTicketTitle: string;
  suggestedCategory: string;
  suggestedPriority: string;
  commonKeywords: string[];
  participants: string[];
  dateRange: { earliest: string; latest: string };
  matchingTickets: MatchingTicket[];
  recommendation: "skip" | "link" | "create";
  recommendationReason: string;
}

interface TicketStats {
  total: number;
  open: number;
  closed: number;
  analyzed: number;
}

interface AnalysisStats {
  totalEmails: number;
  totalTickets: number;
  totalGroups: number;
  potentialDuplicates: number;
  emailsWithDuplicates: number;
  emailsToLink: number;
  emailsToCreate: number;
}

interface AnalysisResult {
  success: boolean;
  groups: EmailGroup[];
  ticketStats: TicketStats;
  stats: AnalysisStats;
  message?: string;
}

const urgencyColors = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const recommendationStyles = {
  skip: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: Ban },
  link: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: Link2 },
  create: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: Plus },
};

const sentimentIcons = {
  positive: "😊",
  neutral: "😐",
  negative: "😟",
  frustrated: "😤",
};

export function EmailAnalysis() {
  const { currentUser } = useAdminStore();
  const { emails, initializeSampleData } = useEmailStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<EmailGroup | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
  });

  // Initialize sample data on mount if not already done
  useEffect(() => {
    initializeSampleData();
  }, [initializeSampleData]);

  const analyzeEmails = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Transform store emails to format expected by the API
      const emailsForAnalysis = emails.map(email => ({
        id: email.id,
        subject: email.subject,
        body: email.body,
        bodyPreview: email.bodyPreview,
        fromEmail: email.from,
        fromName: email.fromName || null,
        toEmails: JSON.stringify(email.to),
        ccEmails: JSON.stringify(email.cc || []),
        receivedAt: email.receivedAt,
        sentAt: email.sentAt || email.receivedAt,
        status: email.status,
        isRead: email.isRead,
        importance: email.importance || "normal",
        hasAttachments: email.hasAttachments || false,
      }));

      const response = await fetch("/api/emails/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: currentUser?.id,
          emails: emailsForAnalysis, // Pass emails from store
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentUser, emails]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };


  const openCreateTicket = (group: EmailGroup) => {
    setSelectedGroup(group);
    setTicketForm({
      title: group.suggestedTicketTitle,
      description: group.primaryEmail.entities.issueType 
        ? `Issue Type: ${group.primaryEmail.entities.issueType}\n\nFrom: ${group.primaryEmail.from}\nSubject: ${group.primaryEmail.subject}\n\nRelated Emails: ${group.relatedEmails.length}`
        : `From: ${group.primaryEmail.from}\nSubject: ${group.primaryEmail.subject}\n\nRelated Emails: ${group.relatedEmails.length}`,
      priority: group.suggestedPriority,
      category: group.suggestedCategory,
    });
    setShowCreateTicket(true);
  };

  const linkToExistingTicket = async (group: EmailGroup, ticketId: string) => {
    if (!currentUser) return;
    
    try {
      const relatedIds = group.relatedEmails.map((e) => e.id);
      
      const response = await fetch("/api/emails/link-ticket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmailId: group.primaryEmail.id,
          relatedEmailIds: relatedIds,
          existingTicketId: ticketId,
          userId: currentUser.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to link to ticket");
      }
      
      // Refresh analysis to show updated status
      await analyzeEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link to ticket");
    }
  };

  const createTicketFromGroup = async () => {
    if (!selectedGroup || !currentUser) return;

    setIsCreatingTicket(true);
    try {
      const relatedIds = selectedGroup.relatedEmails.map((e) => e.id);

      const response = await fetch("/api/emails/link-ticket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmailId: selectedGroup.primaryEmail.id,
          relatedEmailIds: relatedIds,
          title: ticketForm.title,
          description: ticketForm.description,
          priority: ticketForm.priority,
          category: ticketForm.category,
          userId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      // Refresh analysis to show updated status
      setShowCreateTicket(false);
      setSelectedGroup(null);
      await analyzeEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Email Analysis
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered detection of related emails and potential duplicates
              </p>
            </div>
          </div>
          <button
            onClick={analyzeEmails}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Analyze Emails
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {result && (
        <div className="space-y-4">
          {/* Email & Ticket Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.stats.totalEmails}
                  </p>
                  <p className="text-sm text-gray-500">Emails Analyzed</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Ticket className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.ticketStats?.total || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tickets ({result.ticketStats?.open || 0} open)
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.stats.emailsWithDuplicates || 0}
                  </p>
                  <p className="text-sm text-gray-500">Duplicate Issues</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.stats.emailsToCreate || 0}
                  </p>
                  <p className="text-sm text-gray-500">New Tickets Needed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Summary</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.stats.emailsWithDuplicates || 0} emails already have open tickets (skip)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.stats.emailsToLink || 0} emails can be linked to existing tickets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.stats.emailsToCreate || 0} emails need new tickets
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Groups */}
      {result && result.groups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Related Email Groups
          </h3>
          
          {result.groups.map((group) => {
            const recStyle = recommendationStyles[group.recommendation] || recommendationStyles.create;
            const RecIcon = recStyle.icon;
            
            return (
            <div
              key={group.id}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden",
                group.recommendation === "skip" ? "border-red-200 dark:border-red-800" :
                group.recommendation === "link" ? "border-yellow-200 dark:border-yellow-800" :
                "border-gray-200 dark:border-gray-700"
              )}
            >
              {/* Group Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {group.suggestedTicketTitle}
                        </h4>
                        {group.relatedEmails.length > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs rounded-full">
                            {group.relatedEmails.length + 1} related emails
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        From: {group.participants.slice(0, 3).join(", ")}
                        {group.participants.length > 3 && ` +${group.participants.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Recommendation Badge */}
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs rounded-full border",
                      recStyle.bg, recStyle.text
                    )}>
                      <RecIcon className="w-3 h-3" />
                      {group.recommendation === "skip" ? "Duplicate" : 
                       group.recommendation === "link" ? "Link" : "Create"}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${urgencyColors[group.primaryEmail.entities.urgency]}`}>
                      {group.primaryEmail.entities.urgency}
                    </span>
                    <span className="text-xl">
                      {sentimentIcons[group.primaryEmail.entities.sentiment]}
                    </span>
                    {group.recommendation === "create" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateTicket(group);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Ticket
                      </button>
                    )}
                    {group.recommendation === "link" && group.matchingTickets?.[0] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          linkToExistingTicket(group, group.matchingTickets[0].ticket.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Link2 className="w-4 h-4" />
                        Link to {group.matchingTickets[0].ticket.ticketNumber}
                      </button>
                    )}
                    {group.recommendation === "skip" && group.matchingTickets?.[0] && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg">
                        <Ticket className="w-4 h-4" />
                        {group.matchingTickets[0].ticket.ticketNumber}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Recommendation Reason */}
                {group.recommendationReason && (
                  <div className={cn("mt-2 ml-8 text-sm", recStyle.text)}>
                    <ArrowRight className="w-3 h-3 inline mr-1" />
                    {group.recommendationReason}
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Matching Tickets Section */}
                  {group.matchingTickets && group.matchingTickets.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <h5 className="font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        Matching Tickets Found
                      </h5>
                      <div className="space-y-2">
                        {group.matchingTickets.slice(0, 3).map((match) => (
                          <div key={match.ticket.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-purple-600">{match.ticket.ticketNumber}</span>
                                <span className={cn(
                                  "px-1.5 py-0.5 text-xs rounded",
                                  match.isDuplicate ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {match.isDuplicate ? "DUPLICATE" : `${match.similarityScore}% match`}
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.5 text-xs rounded",
                                  match.ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                )}>
                                  {match.ticket.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{match.ticket.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{match.matchReasons.join(" • ")}</p>
                            </div>
                            {!match.isDuplicate && (
                              <button
                                onClick={() => linkToExistingTicket(group, match.ticket.id)}
                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                Link
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Keywords */}
                  {group.commonKeywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {group.commonKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Primary Email */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Primary</span>
                      <span className="text-sm text-gray-500">{formatDate(group.primaryEmail.receivedAt)}</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {group.primaryEmail.subject}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From: {group.primaryEmail.from}
                    </p>
                    {group.primaryEmail.entities.issueType && (
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        Detected Issue: {group.primaryEmail.entities.issueType}
                      </p>
                    )}
                  </div>

                  {/* Related Emails */}
                  {group.relatedEmails.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Related Emails:
                      </p>
                      {group.relatedEmails.map((email) => (
                        <div
                          key={email.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {email.subject}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                From: {email.from} • {formatDate(email.receivedAt)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${urgencyColors[email.entities.urgency]}`}>
                              {email.entities.urgency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Existing Tickets */}
                  {group.matchingTickets && group.matchingTickets.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Potentially Related Tickets:
                      </p>
                      <div className="space-y-2">
                        {group.matchingTickets.map((match) => (
                          <div
                            key={match.ticket.id}
                            className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {match.ticket.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {match.ticket.status} • {match.ticket.priority}
                              </p>
                            </div>
                            <button
                              onClick={() => linkToExistingTicket(group, match.ticket.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Link2 className="w-4 h-4" />
                              Link
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* No Results */}
      {result && result.groups.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Duplicates Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {result.message || "Your emails appear to be unique with no potential duplicates detected."}
          </p>
        </div>
      )}

      {/* Initial State */}
      {!result && !isAnalyzing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Brain className="w-12 h-12 text-purple-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Analyze
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click &quot;Analyze Emails&quot; to detect related messages and prevent duplicate tickets.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 max-w-md mx-auto text-left">
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" />
              Detects emails about the same issue from different senders
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" />
              Groups related emails by topic and keywords
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" />
              Suggests existing tickets to link emails to
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" />
              Creates single tickets from multiple related emails
            </li>
          </ul>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicket && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Ticket from Emails
              </h3>
              <button
                onClick={() => setShowCreateTicket(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-sm">
                <p className="text-purple-700 dark:text-purple-300">
                  This will create a ticket and link {selectedGroup.relatedEmails.length + 1} email(s) to it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="support">Support</option>
                    <option value="printing-issue">Printing Issue</option>
                    <option value="access-issue">Access Issue</option>
                    <option value="order-issue">Order Issue</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateTicket(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTicketFromGroup}
                disabled={isCreatingTicket}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isCreatingTicket ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
