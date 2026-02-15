"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Comment, CommentEntityType, User, CreateCommentAttachmentInput } from "@/lib/types";
import { useProjectStore } from "@/lib/store";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Paperclip,
  X,
  FileText,
  Image,
  File,
  Download,
  AtSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CommentsSectionProps {
  entityType: CommentEntityType;
  entityId: string;
  title?: string;
}

export function CommentsSection({ entityType, entityId, title = "Comments" }: CommentsSectionProps) {
  const { comments, addComment, updateComment, deleteComment, getEntityComments } = useProjectStore();
  const { currentUser, users } = useAdminStore();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [attachments, setAttachments] = useState<CreateCommentAttachmentInput[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get comments for this entity
  const entityComments = getEntityComments(entityType, entityId);

  // Organize comments into threads (top-level and replies)
  const topLevelComments = entityComments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => entityComments.filter(c => c.parentId === parentId);

  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  // Handle @mention detection
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(position);

    // Detect @mention
    const textBeforeCursor = value.substring(0, position);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === " ")) {
      const searchText = textBeforeCursor.substring(atIndex + 1);
      if (!searchText.includes(" ")) {
        setMentionSearch(searchText.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  // Filter users for mention dropdown
  const filteredUsers = users.filter(u => 
    u.isActive && 
    (u.firstName.toLowerCase().includes(mentionSearch) ||
     u.lastName.toLowerCase().includes(mentionSearch) ||
     u.email.toLowerCase().includes(mentionSearch))
  );

  // Insert mention
  const insertMention = (user: User) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = newComment.substring(cursorPosition);
    
    const mention = `@${user.firstName} ${user.lastName}`;
    const newText = textBeforeCursor.substring(0, atIndex) + mention + " " + textAfterCursor;
    
    setNewComment(newText);
    setMentionedUsers([...mentionedUsers, user.id]);
    setShowMentionDropdown(false);
    textareaRef.current?.focus();
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        setAttachments(prev => [...prev, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit comment
  const handleSubmit = () => {
    if (!newComment.trim() && attachments.length === 0) return;
    if (!currentUser) return;

    addComment({
      content: newComment,
      entityType,
      entityId,
      parentId: replyingTo || undefined,
      mentionedUserIds: mentionedUsers,
      attachments,
    }, currentUser.id);

    setNewComment("");
    setReplyingTo(null);
    setAttachments([]);
    setMentionedUsers([]);
  };

  // Update comment
  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateComment(id, editContent);
    setEditingId(null);
    setEditContent("");
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Render mentions in content
  const renderContent = (content: string) => {
    // Simple @mention highlighting
    const parts = content.split(/(@[\w\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({entityComments.length})</span>
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to add one!</p>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              getUserById={getUserById}
              currentUserId={currentUser?.id}
              onReply={(id) => setReplyingTo(id)}
              onEdit={(id, content) => {
                setEditingId(id);
                setEditContent(content);
              }}
              onDelete={deleteComment}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              onSaveEdit={handleUpdate}
              onCancelEdit={() => {
                setEditingId(null);
                setEditContent("");
              }}
              renderContent={renderContent}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
            />
          ))
        )}
      </div>

      {/* New Comment Input */}
      <div className="p-4 border-t border-gray-200">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
            <Reply className="w-4 h-4" />
            <span>Replying to comment</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Write a comment... Use @ to mention users"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          {/* @Mention Dropdown */}
          {showMentionDropdown && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filteredUsers.slice(0, 5).map(user => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {getFileIcon(att.fileType)}
                <span className="truncate max-w-[150px]">{att.fileName}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              Attach
            </button>
            <button
              onClick={() => {
                setNewComment(newComment + "@");
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <AtSign className="w-4 h-4" />
              Mention
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() && attachments.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  getUserById: (id: string) => User | undefined;
  currentUserId?: string;
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  renderContent: (content: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (fileType: string) => React.ReactNode;
}

function CommentItem({
  comment,
  replies,
  getUserById,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  editingId,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  renderContent,
  formatFileSize,
  getFileIcon,
}: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const author = getUserById(comment.authorId);
  const isOwner = currentUserId === comment.authorId;
  const isEditing = editingId === comment.id;

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {author?.firstName?.[0] || "U"}{author?.lastName?.[0] || ""}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {author?.firstName} {author?.lastName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => onSaveEdit(comment.id)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-gray-700 whitespace-pre-wrap">
              {renderContent(comment.content)}
            </p>
          )}

          {/* Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  download={att.fileName}
                  className="flex items-center gap-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  {getFileIcon(att.fileType)}
                  <span className="truncate max-w-[150px]">{att.fileName}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(att.fileSize)})</span>
                  <Download className="w-3 h-3 text-gray-400" />
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>

            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => onEdit(comment.id, comment.content)}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this comment?")) {
                      onDelete(comment.id);
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-600 flex items-center gap-1 mb-2"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide replies ({replies.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show replies ({replies.length})
                  </>
                )}
              </button>

              {showReplies && (
                <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                  {replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      replies={[]} // No nested replies for now
                      getUserById={getUserById}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      editingId={editingId}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      renderContent={renderContent}
                      formatFileSize={formatFileSize}
                      getFileIcon={getFileIcon}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
