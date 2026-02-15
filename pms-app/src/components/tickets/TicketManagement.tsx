"use client";

import React, { useState } from "react";
import { useTicketStore } from "@/lib/ticketStore";
import {
  Ticket,
  CreateTicketInput,
  TicketStatus,
  TicketCategory,
  TicketApplication,
  TicketIntegration,
  Priority,
  TicketType,
  TicketSource,
  TICKET_CATEGORIES,
  TICKET_APPLICATIONS,
  TICKET_INTEGRATIONS,
} from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  User,
  Calendar,
  Tag,
  Building,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  Pause,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Paperclip,
} from "lucide-react";

type TabType = "all" | "open" | "in-progress" | "resolved" | "closed";

const statusColors: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  waiting: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  open: <Circle className="w-3 h-3" />,
  "in-progress": <Clock className="w-3 h-3" />,
  waiting: <Pause className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  closed: <CheckCircle className="w-3 h-3" />,
};

const priorityColors: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600",
};

export function TicketManagement() {
  const {
    tickets,
    selectedTicketId,
    addTicket,
    updateTicket,
    deleteTicket,
    selectTicket,
  } = useTicketStore();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toString().includes(searchTerm) ||
      ticket.requestorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.emailSubject?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "open" && ticket.status === "open") ||
      (activeTab === "in-progress" && ticket.status === "in-progress") ||
      (activeTab === "resolved" && ticket.status === "resolved") ||
      (activeTab === "closed" && ticket.status === "closed");

    return matchesSearch && matchesTab;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const tabCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    "in-progress": tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Panel - Ticket List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
            <button
              onClick={() => {
                setEditingTicket(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {(["all", "open", "in-progress", "resolved", "closed"] as TabType[]).map(
            (tab) => (
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
                {tab === "in-progress" ? "Active" : tab}
                <span className="ml-1 text-gray-400">({tabCounts[tab]})</span>
              </button>
            )
          )}
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No tickets found</p>
              <p className="text-sm mt-1">Create a new ticket to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    selectedTicketId === ticket.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">
                          #{ticket.ticketNumber}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs rounded capitalize flex items-center gap-1",
                            statusColors[ticket.status]
                          )}
                        >
                          {statusIcons[ticket.status]}
                          {ticket.status.replace("-", " ")}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">
                        {ticket.title}
                      </p>
                      {ticket.requestorName && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.requestorName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs rounded capitalize",
                          priorityColors[ticket.priority]
                        )}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(ticket.dateRequested)}
                      </span>
                    </div>
                  </div>
                  {ticket.category && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {ticket.category}
                      </span>
                      {ticket.application && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                          {ticket.application}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Ticket Details or Form */}
      <div className="flex-1 overflow-y-auto">
        {showForm ? (
          <TicketForm
            ticket={editingTicket}
            onSave={(data) => {
              if (editingTicket) {
                updateTicket(editingTicket.id, data as Partial<Ticket>);
              } else {
                addTicket(data as CreateTicketInput);
              }
              setShowForm(false);
              setEditingTicket(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingTicket(null);
            }}
          />
        ) : selectedTicket ? (
          <TicketDetails
            ticket={selectedTicket}
            onEdit={() => {
              setEditingTicket(selectedTicket);
              setShowForm(true);
            }}
            onDelete={() => {
              deleteTicket(selectedTicket.id);
              selectTicket(null);
            }}
            onStatusChange={(status) => updateTicket(selectedTicket.id, { status })}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">
                Select a ticket to view details
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Or create a new ticket to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Ticket Details Component
function TicketDetails({
  ticket,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  ticket: Ticket;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TicketStatus) => void;
}) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{ticket.ticketNumber}
            </span>
            <span
              className={cn(
                "px-2 py-1 text-sm rounded capitalize flex items-center gap-1",
                statusColors[ticket.status]
              )}
            >
              {statusIcons[ticket.status]}
              {ticket.status.replace("-", " ")}
            </span>
            <span
              className={cn(
                "px-2 py-1 text-sm rounded capitalize",
                priorityColors[ticket.priority]
              )}
            >
              {ticket.priority}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Change */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Change Status
        </label>
        <div className="flex gap-2 flex-wrap">
          {(["open", "in-progress", "waiting", "resolved", "closed"] as TicketStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize",
                  ticket.status === status
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {status.replace("-", " ")}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Summary */}
          {ticket.summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {ticket.summary}
              </p>
            </div>
          )}

          {/* Email Info */}
          {ticket.emailSubject && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Subject:</span>
                  <p className="text-gray-900">{ticket.emailSubject}</p>
                </div>
                {ticket.emailFrom && (
                  <div>
                    <span className="text-gray-500">From:</span>
                    <p className="text-gray-900">{ticket.emailFrom}</p>
                  </div>
                )}
                {ticket.emailTo && (
                  <div>
                    <span className="text-gray-500">To:</span>
                    <p className="text-gray-900">{ticket.emailTo}</p>
                  </div>
                )}
                {ticket.emailCc && (
                  <div>
                    <span className="text-gray-500">CC:</span>
                    <p className="text-gray-900">{ticket.emailCc}</p>
                  </div>
                )}
              </div>
              {ticket.emailConversation && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Conversation:</span>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {ticket.emailConversation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Root Cause */}
          {ticket.rootCause && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Root Cause
              </h3>
              <p className="text-gray-600 text-sm">{ticket.rootCause}</p>
            </div>
          )}

          {/* Notes */}
          {ticket.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {ticket.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900 capitalize">{ticket.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="text-gray-900 capitalize">{ticket.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{ticket.category}</dd>
              </div>
              {ticket.application && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Application</dt>
                  <dd className="text-gray-900">{ticket.application}</dd>
                </div>
              )}
              {ticket.integration && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Integration</dt>
                  <dd className="text-gray-900">{ticket.integration}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Queue</dt>
                <dd className="text-gray-900">{ticket.queue}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Progress</dt>
                <dd className="text-gray-900">{ticket.percentComplete}%</dd>
              </div>
            </dl>
          </div>

          {/* People Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              People
            </h3>
            <dl className="space-y-3 text-sm">
              {ticket.requestorName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Requestor</dt>
                  <dd className="text-gray-900">{ticket.requestorName}</dd>
                </div>
              )}
              {ticket.requestorEmail && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-blue-600">{ticket.requestorEmail}</dd>
                </div>
              )}
              {ticket.requestorManager && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Manager</dt>
                  <dd className="text-gray-900">{ticket.requestorManager}</dd>
                </div>
              )}
              {ticket.contractors && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Contractors</dt>
                  <dd className="text-gray-900">{ticket.contractors}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Organization Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Organization
            </h3>
            <dl className="space-y-3 text-sm">
              {ticket.ventureName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Venture</dt>
                  <dd className="text-gray-900">{ticket.ventureName}</dd>
                </div>
              )}
              {ticket.department && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Department</dt>
                  <dd className="text-gray-900">{ticket.department}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dates Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dates
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Requested</dt>
                <dd className="text-gray-900">{formatDate(ticket.dateRequested)}</dd>
              </div>
              {ticket.startDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Started</dt>
                  <dd className="text-gray-900">{formatDate(ticket.startDate)}</dd>
                </div>
              )}
              {ticket.expectedEndDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Expected End</dt>
                  <dd className="text-gray-900">{formatDate(ticket.expectedEndDate)}</dd>
                </div>
              )}
              {ticket.endDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Completed</dt>
                  <dd className="text-gray-900">{formatDate(ticket.endDate)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ticket Form Component
function TicketForm({
  ticket,
  onSave,
  onCancel,
}: {
  ticket: Ticket | null;
  onSave: (data: CreateTicketInput | Partial<Ticket>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CreateTicketInput>({
    type: ticket?.type || "task",
    title: ticket?.title || "",
    summary: ticket?.summary || "",
    rootCause: ticket?.rootCause || "",
    emailSubject: ticket?.emailSubject || "",
    emailConversation: ticket?.emailConversation || "",
    emailFrom: ticket?.emailFrom || "",
    emailTo: ticket?.emailTo || "",
    emailCc: ticket?.emailCc || "",
    source: ticket?.source || "manual",
    dateRequested: ticket?.dateRequested || new Date(),
    expectedEndDate: ticket?.expectedEndDate || undefined,
    startDate: ticket?.startDate || undefined,
    ventureName: ticket?.ventureName || "",
    department: ticket?.department || "",
    requestorName: ticket?.requestorName || "",
    requestorEmail: ticket?.requestorEmail || "",
    requestorManager: ticket?.requestorManager || "",
    contractors: ticket?.contractors || "",
    priority: ticket?.priority || "medium",
    queue: ticket?.queue || 1,
    category: ticket?.category || "Other",
    application: ticket?.application || undefined,
    integration: ticket?.integration || undefined,
    notes: ticket?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {ticket ? "Edit Ticket" : "Create New Ticket"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ticket title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as TicketType })
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
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value as TicketSource })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="chat">Chat</option>
                <option value="integration">Integration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Queue
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.queue}
                onChange={(e) =>
                  setFormData({ ...formData, queue: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ticket summary"
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Classification</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as TicketCategory,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application
              </label>
              <select
                value={formData.application || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    application: (e.target.value as TicketApplication) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Application</option>
                {TICKET_APPLICATIONS.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration
              </label>
              <select
                value={formData.integration || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    integration: (e.target.value as TicketIntegration) || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Integration</option>
                {TICKET_INTEGRATIONS.map((int) => (
                  <option key={int} value={int}>
                    {int}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* People */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">People & Organization</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requestor Name
              </label>
              <input
                type="text"
                value={formData.requestorName}
                onChange={(e) =>
                  setFormData({ ...formData, requestorName: e.target.value })
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
                value={formData.requestorEmail}
                onChange={(e) =>
                  setFormData({ ...formData, requestorEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <input
                type="text"
                value={formData.requestorManager}
                onChange={(e) =>
                  setFormData({ ...formData, requestorManager: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contractors
              </label>
              <input
                type="text"
                value={formData.contractors}
                onChange={(e) =>
                  setFormData({ ...formData, contractors: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venture / Company
              </label>
              <input
                type="text"
                value={formData.ventureName}
                onChange={(e) =>
                  setFormData({ ...formData, ventureName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Email Details (if from email)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={formData.emailSubject}
                onChange={(e) =>
                  setFormData({ ...formData, emailSubject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="email"
                value={formData.emailFrom}
                onChange={(e) =>
                  setFormData({ ...formData, emailFrom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                value={formData.emailTo}
                onChange={(e) =>
                  setFormData({ ...formData, emailTo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CC
              </label>
              <input
                type="text"
                value={formData.emailCc}
                onChange={(e) =>
                  setFormData({ ...formData, emailCc: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Separate multiple emails with commas"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Conversation
              </label>
              <textarea
                value={formData.emailConversation}
                onChange={(e) =>
                  setFormData({ ...formData, emailConversation: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste email thread here"
              />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Root Cause
              </label>
              <textarea
                value={formData.rootCause}
                onChange={(e) =>
                  setFormData({ ...formData, rootCause: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {ticket ? "Update Ticket" : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TicketManagement;
