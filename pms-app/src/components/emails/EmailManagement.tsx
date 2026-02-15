"use client";

import React, { useState, useEffect } from "react";
import { useEmailStore } from "@/lib/emailStore";
import { useTicketStore } from "@/lib/ticketStore";
import {
  Email,
  EmailStatus,
  Priority,
  CreateTicketInput,
} from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Mail,
  Search,
  RefreshCw,
  ChevronRight,
  Paperclip,
  Star,
  Archive,
  Trash2,
  Tag,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Ticket,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Loader2,
  Brain,
  Inbox,
} from "lucide-react";
import { EmailAnalysis } from "./EmailAnalysis";

type TabType = "all" | "unread" | "converted" | "archived";
type ViewType = "inbox" | "analysis";

const statusColors: Record<EmailStatus, string> = {
  unread: "bg-blue-100 text-blue-700",
  read: "bg-gray-100 text-gray-600",
  converted: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
  ignored: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600",
};

export function EmailManagement() {
  const {
    emails,
    selectedEmailId,
    emailAccounts,
    selectedMailbox,
    isLoading,
    isSyncing,
    selectEmail,
    markAsRead,
    markAsUnread,
    archiveEmail,
    ignoreEmail,
    analyzeEmail,
    convertToTicket,
    markAsConverted,
    setSelectedMailbox,
    getEmailsByMailbox,
    syncEmails,
    initializeSampleData,
  } = useEmailStore();

  const { addTicket } = useTicketStore();

  const [activeView, setActiveView] = useState<ViewType>("inbox");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingEmail, setConvertingEmail] = useState<Email | null>(null);
  const [ticketFormData, setTicketFormData] = useState<CreateTicketInput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize sample data on mount
  useEffect(() => {
    initializeSampleData();
  }, [initializeSampleData]);

  // Get emails for current mailbox
  const mailboxEmails = getEmailsByMailbox(selectedMailbox);

  // Filter emails
  const filteredEmails = mailboxEmails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.bodyPreview.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unread" && email.status === "unread") ||
      (activeTab === "converted" && email.status === "converted") ||
      (activeTab === "archived" && email.status === "archived");

    return matchesSearch && matchesTab;
  });

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const tabCounts = {
    all: mailboxEmails.length,
    unread: mailboxEmails.filter((e) => e.status === "unread").length,
    converted: mailboxEmails.filter((e) => e.status === "converted").length,
    archived: mailboxEmails.filter((e) => e.status === "archived").length,
  };

  const handleAnalyzeAndConvert = async (email: Email) => {
    setConvertingEmail(email);
    setIsAnalyzing(true);

    // Run AI analysis if not already done
    if (!email.aiAnalyzed) {
      await analyzeEmail(email.id);
    }

    // Get the updated email after analysis
    const updatedEmail = useEmailStore.getState().emails.find(e => e.id === email.id);
    if (!updatedEmail) return;

    // Generate ticket data from email
    const { ticketData } = convertToTicket(updatedEmail.id);
    setTicketFormData(ticketData);
    setIsAnalyzing(false);
    setShowConvertModal(true);
  };

  const handleCreateTicket = () => {
    if (!ticketFormData || !convertingEmail) return;

    // Create the ticket
    const ticket = addTicket(ticketFormData);

    // Mark email as converted
    markAsConverted(convertingEmail.id, ticket.id, ticket.ticketNumber);

    // Close modal
    setShowConvertModal(false);
    setConvertingEmail(null);
    setTicketFormData(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* View Switcher Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Emails</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("inbox")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeView === "inbox"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Inbox className="w-4 h-4" />
            Inbox
          </button>
          <button
            onClick={() => setActiveView("analysis")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeView === "analysis"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Brain className="w-4 h-4" />
            AI Analysis
          </button>
        </div>
      </div>

      {/* Conditional Content based on view */}
      {activeView === "analysis" ? (
        <div className="flex-1 overflow-hidden">
          <EmailAnalysis />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Email List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Mailbox</span>
            <button
              onClick={syncEmails}
              disabled={isSyncing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isSyncing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          </div>

          {/* Mailbox Selector */}
          <div className="mb-4">
            <select
              value={selectedMailbox}
              onChange={(e) => setSelectedMailbox(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {emailAccounts.map((account) => (
                <option key={account.id} value={account.email}>
                  {account.displayName} ({account.email})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {(["all", "unread", "converted", "archived"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-2 py-2 text-xs font-medium border-b-2 transition-colors capitalize",
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
              <span className="ml-1 text-gray-400">({tabCounts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No emails found</p>
              <p className="text-sm mt-1">Try syncing or changing filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => selectEmail(email.id)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    selectedEmailId === email.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent",
                    !email.isRead && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!email.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm truncate",
                          !email.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {email.fromName || email.from}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm truncate",
                        !email.isRead ? "font-medium text-gray-900" : "text-gray-700"
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {email.bodyPreview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {formatDate(email.receivedAt)}
                      </span>
                      {email.hasAttachments && (
                        <Paperclip className="w-3 h-3 text-gray-400" />
                      )}
                      {email.importance === "high" && (
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                  {email.status === "converted" && email.ticketNumber && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        #{email.ticketNumber}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Email Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedEmail ? (
          <div className="h-full flex flex-col">
            {/* Email Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded capitalize",
                      statusColors[selectedEmail.status]
                    )}>
                      {selectedEmail.status}
                    </span>
                    {selectedEmail.importance === "high" && (
                      <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">
                        High Priority
                      </span>
                    )}
                    {selectedEmail.aiAnalyzed && (
                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Analyzed
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedEmail.subject}</h1>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEmail.status !== "converted" && (
                    <button
                      onClick={() => handleAnalyzeAndConvert(selectedEmail)}
                      disabled={isAnalyzing}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        isAnalyzing
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Convert to Ticket
                        </>
                      )}
                    </button>
                  )}
                  {selectedEmail.status === "converted" && selectedEmail.ticketNumber && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Ticket #{selectedEmail.ticketNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Sender/Recipient Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-12">From:</span>
                  <span className="font-medium text-gray-900">
                    {selectedEmail.fromName || selectedEmail.from}
                  </span>
                  <span className="text-gray-500">&lt;{selectedEmail.from}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-12">To:</span>
                  <span className="text-gray-700">{selectedEmail.to.join(", ")}</span>
                </div>
                {selectedEmail.cc.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-12">CC:</span>
                    <span className="text-gray-700">{selectedEmail.cc.join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-12">Date:</span>
                  <span className="text-gray-700">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Attachments */}
              {selectedEmail.hasAttachments && selectedEmail.attachments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Attachments ({selectedEmail.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span>{att.name}</span>
                        <span className="text-gray-400 text-xs">
                          ({Math.round(att.size / 1024)}KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                {selectedEmail.isRead ? (
                  <button
                    onClick={() => markAsUnread(selectedEmail.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                    Mark Unread
                  </button>
                ) : (
                  <button
                    onClick={() => markAsRead(selectedEmail.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => archiveEmail(selectedEmail.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <button
                  onClick={() => ignoreEmail(selectedEmail.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Ignore
                </button>
              </div>
            </div>

            {/* AI Analysis Results */}
            {selectedEmail.aiAnalyzed && (
              <div className="p-4 bg-purple-50 border-b border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">AI Analysis</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {selectedEmail.aiSuggestedCategory && (
                    <div>
                      <span className="text-purple-600 text-xs">Category</span>
                      <p className="font-medium text-gray-900">{selectedEmail.aiSuggestedCategory}</p>
                    </div>
                  )}
                  {selectedEmail.aiSuggestedApplication && (
                    <div>
                      <span className="text-purple-600 text-xs">Application</span>
                      <p className="font-medium text-gray-900">{selectedEmail.aiSuggestedApplication}</p>
                    </div>
                  )}
                  {selectedEmail.aiSuggestedPriority && (
                    <div>
                      <span className="text-purple-600 text-xs">Priority</span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded capitalize inline-block",
                        priorityColors[selectedEmail.aiSuggestedPriority]
                      )}>
                        {selectedEmail.aiSuggestedPriority}
                      </span>
                    </div>
                  )}
                  {selectedEmail.aiSuggestedType && (
                    <div>
                      <span className="text-purple-600 text-xs">Type</span>
                      <p className="font-medium text-gray-900 capitalize">{selectedEmail.aiSuggestedType}</p>
                    </div>
                  )}
                </div>
                {selectedEmail.aiSuggestedTitle && (
                  <div className="mt-3">
                    <span className="text-purple-600 text-xs">Suggested Title</span>
                    <p className="font-medium text-gray-900">{selectedEmail.aiSuggestedTitle}</p>
                  </div>
                )}
              </div>
            )}

            {/* Email Body */}
            <div className="flex-1 p-6 bg-white overflow-y-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                {selectedEmail.body}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">
                Select an email to view
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Choose from the email list on the left
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Convert to Ticket Modal */}
      {showConvertModal && ticketFormData && convertingEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Convert to Ticket</h2>
                    <p className="text-sm text-gray-500">AI has pre-filled the ticket information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    setConvertingEmail(null);
                    setTicketFormData(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Title
                  </label>
                  <input
                    type="text"
                    value={ticketFormData.title}
                    onChange={(e) =>
                      setTicketFormData({ ...ticketFormData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={ticketFormData.type}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="task">Task</option>
                      <option value="issue">Issue</option>
                      <option value="request">Request</option>
                      <option value="inquiry">Inquiry</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={ticketFormData.priority}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, priority: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Category & Application */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={ticketFormData.category}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Integration">Integration</option>
                      <option value="Reporting">Reporting</option>
                      <option value="System">System</option>
                      <option value="Access">Access</option>
                      <option value="Human Error">Human Error</option>
                      <option value="System Error">System Error</option>
                      <option value="EDI">EDI</option>
                      <option value="Inventory">Inventory</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application
                    </label>
                    <select
                      value={ticketFormData.application || ""}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, application: e.target.value as any || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Application</option>
                      <option value="NetSuite">NetSuite</option>
                      <option value="Tipalti">Tipalti</option>
                      <option value="Celigo">Celigo</option>
                      <option value="Shopify">Shopify</option>
                      <option value="PaceJet">PaceJet</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Zest">Zest</option>
                      <option value="BlackLine">BlackLine</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <textarea
                    value={ticketFormData.summary}
                    onChange={(e) =>
                      setTicketFormData({ ...ticketFormData, summary: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Requestor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requestor Name
                    </label>
                    <input
                      type="text"
                      value={ticketFormData.requestorName}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, requestorName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requestor Email
                    </label>
                    <input
                      type="email"
                      value={ticketFormData.requestorEmail}
                      onChange={(e) =>
                        setTicketFormData({ ...ticketFormData, requestorEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email Info (read-only) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Original Email</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="text-gray-500">Subject:</span> {convertingEmail.subject}</p>
                    <p><span className="text-gray-500">From:</span> {convertingEmail.from}</p>
                    <p><span className="text-gray-500">Received:</span> {new Date(convertingEmail.receivedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertingEmail(null);
                  setTicketFormData(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Ticket className="w-4 h-4" />
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}

export default EmailManagement;
