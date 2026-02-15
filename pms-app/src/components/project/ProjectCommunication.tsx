"use client";

import React, { useState } from "react";
import { useAdminStore } from "@/lib/adminStore";
import { ProjectNote, ChatMessage, User } from "@/lib/types";
import {
  MessageSquare,
  FileText,
  Plus,
  Send,
  Check,
  Clock,
  AlertCircle,
  Reply,
  Trash2,
  CheckCircle,
  Circle,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface ProjectCommunicationProps {
  projectId: string;
  notes: ProjectNote[];
  messages: ChatMessage[];
  onAddNote: (note: Omit<ProjectNote, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  onAddMessage: (message: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteMessage: (id: string) => void;
}

type TabType = "notes" | "chat";

export function ProjectCommunication({
  projectId,
  notes,
  messages,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddMessage,
  onDeleteMessage,
}: ProjectCommunicationProps) {
  const { currentUser, users } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const getUserById = (userId: string): User | undefined => {
    return users.find((u) => u.id === userId);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow">
      {/* Header Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "notes"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Notes & Actions
          {notes.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {notes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "chat"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Communication
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "notes" ? (
          <NotesSection
            notes={notes}
            projectId={projectId}
            currentUser={currentUser}
            getUserById={getUserById}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            showForm={showNoteForm}
            setShowForm={setShowNoteForm}
          />
        ) : (
          <ChatSection
            messages={messages}
            projectId={projectId}
            currentUser={currentUser}
            getUserById={getUserById}
            onAddMessage={onAddMessage}
            onDeleteMessage={onDeleteMessage}
          />
        )}
      </div>
    </div>
  );
}

// Notes Section Component
function NotesSection({
  notes,
  projectId,
  currentUser,
  getUserById,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  showForm,
  setShowForm,
}: {
  notes: ProjectNote[];
  projectId: string;
  currentUser: User | null;
  getUserById: (id: string) => User | undefined;
  onAddNote: (note: Omit<ProjectNote, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => void;
  onDeleteNote: (id: string) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}) {
  const [newNote, setNewNote] = useState({
    content: "",
    isActionItem: false,
    actionDueDate: "",
  });

  const [filter, setFilter] = useState<"all" | "notes" | "actions">("all");

  const filteredNotes = notes.filter((note) => {
    if (filter === "notes") return !note.isActionItem;
    if (filter === "actions") return note.isActionItem;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim() || !currentUser) return;

    onAddNote({
      content: newNote.content,
      isActionItem: newNote.isActionItem,
      actionDueDate: newNote.actionDueDate ? new Date(newNote.actionDueDate) : null,
      actionStatus: newNote.isActionItem ? "pending" : null,
      projectId,
      authorId: currentUser.id,
    });

    setNewNote({ content: "", isActionItem: false, actionDueDate: "" });
    setShowForm(false);
  };

  const toggleActionStatus = (note: ProjectNote) => {
    if (!note.isActionItem) return;
    const newStatus = note.actionStatus === "completed" ? "pending" : "completed";
    onUpdateNote(note.id, { actionStatus: newStatus });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter & Add */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex gap-2">
          {(["all", "notes", "actions"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b bg-gray-50">
          <textarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Write a note or action item..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newNote.isActionItem}
                  onChange={(e) =>
                    setNewNote({ ...newNote, isActionItem: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Action Item</span>
              </label>
              {newNote.isActionItem && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={newNote.actionDueDate}
                    onChange={(e) =>
                      setNewNote({ ...newNote, actionDueDate: e.target.value })
                    }
                    className="px-2 py-1 text-sm border rounded"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newNote.content.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <p>No {filter === "all" ? "notes" : filter} yet</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const author = getUserById(note.authorId);
            return (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.isActionItem
                    ? note.actionStatus === "completed"
                      ? "bg-green-50 border-green-200"
                      : "bg-amber-50 border-amber-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {note.isActionItem && (
                    <button
                      onClick={() => toggleActionStatus(note)}
                      className={`mt-0.5 flex-shrink-0 ${
                        note.actionStatus === "completed"
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {note.actionStatus === "completed" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        note.actionStatus === "completed"
                          ? "text-gray-500 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {note.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>
                        {author
                          ? `${author.firstName} ${author.lastName}`
                          : "Unknown"}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {note.isActionItem && note.actionDueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {format(new Date(note.actionDueDate), "MMM d")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Chat Section Component
function ChatSection({
  messages,
  projectId,
  currentUser,
  getUserById,
  onAddMessage,
  onDeleteMessage,
}: {
  messages: ChatMessage[];
  projectId: string;
  currentUser: User | null;
  getUserById: (id: string) => User | undefined;
  onAddMessage: (message: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteMessage: (id: string) => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    onAddMessage({
      content: newMessage,
      isRead: false,
      projectId,
      authorId: currentUser.id,
      parentId: replyingTo?.id || null,
    });

    setNewMessage("");
    setReplyingTo(null);
  };

  // Group messages - top-level and replies
  const topLevelMessages = messages.filter((m) => !m.parentId);
  const getReplies = (messageId: string) =>
    messages.filter((m) => m.parentId === messageId);

  return (
    <div className="h-full flex flex-col">
      {/* Messages List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {topLevelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          topLevelMessages.map((message) => {
            const author = getUserById(message.authorId);
            const replies = getReplies(message.id);
            const isOwnMessage = currentUser?.id === message.authorId;

            return (
              <div key={message.id} className="space-y-2">
                {/* Main Message */}
                <div
                  className={`flex gap-3 ${
                    isOwnMessage ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                      isOwnMessage
                        ? "bg-blue-500"
                        : "bg-gradient-to-br from-purple-500 to-purple-600"
                    }`}
                  >
                    {author ? author.firstName[0] + author.lastName[0] : "?"}
                  </div>
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                        isOwnMessage ? "justify-end" : ""
                      }`}
                    >
                      <span>
                        {author
                          ? `${author.firstName} ${author.lastName}`
                          : "Unknown"}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {!isOwnMessage && (
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="text-blue-600 hover:underline"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-11 space-y-2">
                    {replies.map((reply) => {
                      const replyAuthor = getUserById(reply.authorId);
                      const isOwnReply = currentUser?.id === reply.authorId;

                      return (
                        <div
                          key={reply.id}
                          className={`flex gap-2 ${
                            isOwnReply ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {replyAuthor
                              ? replyAuthor.firstName[0] + replyAuthor.lastName[0]
                              : "?"}
                          </div>
                          <div className="max-w-[60%]">
                            <div
                              className={`px-3 py-1.5 rounded-xl text-sm ${
                                isOwnReply
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {reply.content}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Reply className="w-4 h-4" />
            <span>
              Replying to{" "}
              {getUserById(replyingTo.authorId)?.firstName || "message"}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default ProjectCommunication;
