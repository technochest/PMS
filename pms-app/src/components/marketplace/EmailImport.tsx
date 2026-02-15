"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  Table,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Mail,
  Trash2,
  ArrowLeft,
} from "lucide-react";

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

interface ManualEmail {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

interface EmailImportProps {
  userId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function EmailImport({ userId, onComplete, onBack }: EmailImportProps) {
  const [activeTab, setActiveTab] = useState<"eml" | "csv" | "manual">("eml");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualEmails, setManualEmails] = useState<ManualEmail[]>([]);
  const [editingEmail, setEditingEmail] = useState<ManualEmail | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((f) =>
      activeTab === "eml"
        ? f.name.endsWith(".eml") || f.name.endsWith(".msg")
        : f.name.endsWith(".csv")
    );

    if (activeTab === "eml") {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    } else if (activeTab === "csv" && validFiles.length > 0) {
      handleCSVImport(validFiles[0]);
    }
  }, [activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (activeTab === "eml") {
      setSelectedFiles((prev) => [...prev, ...files]);
    } else if (activeTab === "csv" && files.length > 0) {
      handleCSVImport(files[0]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Import EML files
  const handleEMLImport = async () => {
    if (selectedFiles.length === 0) return;
    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("type", "eml");
      formData.append("mailbox", "imported@local");
      selectedFiles.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/emails/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      if (data.success) {
        setSelectedFiles([]);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ["Failed to import emails"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Import CSV file
  const handleCSVImport = async (file: File) => {
    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("type", "csv");
      formData.append("file", file);
      formData.append("mailbox", "imported@local");

      const response = await fetch("/api/emails/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ["Failed to import CSV"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Import manual emails
  const handleManualImport = async () => {
    if (manualEmails.length === 0) return;
    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("type", "manual");
      formData.append("mailbox", "imported@local");
      formData.append(
        "emails",
        JSON.stringify(
          manualEmails.map((e) => ({
            from: e.from,
            fromName: e.fromName,
            to: e.to.split(/[,;]/).map((t) => t.trim()),
            subject: e.subject,
            body: e.body,
            date: e.date,
          }))
        )
      );

      const response = await fetch("/api/emails/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      if (data.success) {
        setManualEmails([]);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ["Failed to import emails"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const addManualEmail = () => {
    setEditingEmail({
      id: Date.now().toString(),
      from: "",
      fromName: "",
      to: "",
      subject: "",
      body: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const saveManualEmail = () => {
    if (!editingEmail || !editingEmail.from || !editingEmail.subject) return;
    setManualEmails((prev) => {
      const exists = prev.find((e) => e.id === editingEmail.id);
      if (exists) {
        return prev.map((e) => (e.id === editingEmail.id ? editingEmail : e));
      }
      return [...prev, editingEmail];
    });
    setEditingEmail(null);
  };

  const removeManualEmail = (id: string) => {
    setManualEmails((prev) => prev.filter((e) => e.id !== id));
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `subject,from,from_name,to,cc,body,date,importance
"Weekly Status Report","john.smith@company.com","John Smith","team@company.com","manager@company.com","Here is the weekly status report...","2026-02-10","normal"
"Project Update","jane.doe@company.com","Jane Doe","stakeholders@company.com","","The project is on track...","2026-02-11","high"`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Import Emails</h2>
            <p className="text-blue-100 text-sm">
              Upload your emails from Outlook without admin access
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("eml")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "eml"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          <FileText className="w-4 h-4" />
          EML Files
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "csv"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          <Table className="w-4 h-4" />
          CSV Import
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "manual"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          <Plus className="w-4 h-4" />
          Manual Entry
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Result Banner */}
        {result && (
          <div
            className={cn(
              "mb-6 p-4 rounded-lg flex items-start gap-3",
              result.success && result.imported > 0
                ? "bg-green-50 border border-green-200"
                : result.errors.length > 0
                ? "bg-red-50 border border-red-200"
                : "bg-yellow-50 border border-yellow-200"
            )}
          >
            {result.success && result.imported > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {result.success
                  ? `Imported ${result.imported} emails`
                  : "Import completed with issues"}
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-gray-600">
                  Skipped {result.skipped} duplicate(s)
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="text-sm text-red-600 mt-1 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
              {result.success && result.imported > 0 && (
                <button
                  onClick={onComplete}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View imported emails →
                </button>
              )}
            </div>
          </div>
        )}

        {/* EML Import */}
        {activeTab === "eml" && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-1">How to export from Outlook</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open Outlook Desktop or Outlook Web</li>
                <li>Select email(s) you want to export</li>
                <li>Drag and drop to a folder, or use File → Save As</li>
                <li>Save as .eml format</li>
                <li>Upload the .eml files here</li>
              </ol>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".eml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload
                className={cn(
                  "w-10 h-10 mx-auto mb-3",
                  dragActive ? "text-blue-500" : "text-gray-400"
                )}
              />
              <p className="font-medium text-gray-700">
                Drop .eml files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports multiple files at once
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleEMLImport}
                  disabled={isImporting}
                  className={cn(
                    "mt-4 w-full py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2",
                    isImporting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import {selectedFiles.length} File(s)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CSV Import */}
        {activeTab === "csv" && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-1">CSV Format</h3>
              <p className="text-sm text-blue-800 mb-2">
                Your CSV should have headers. Supported columns:
              </p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                subject, from, from_name, to, cc, body, date, importance
              </code>
              <button
                onClick={downloadTemplate}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <Download className="w-4 h-4" />
                Download template CSV
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => csvInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                isImporting && "pointer-events-none opacity-50"
              )}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isImporting ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto mb-3 text-blue-500 animate-spin" />
                  <p className="font-medium text-gray-700">Importing CSV...</p>
                </>
              ) : (
                <>
                  <Table
                    className={cn(
                      "w-10 h-10 mx-auto mb-3",
                      dragActive ? "text-blue-500" : "text-gray-400"
                    )}
                  />
                  <p className="font-medium text-gray-700">
                    Drop CSV file here or click to browse
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {activeTab === "manual" && (
          <div>
            {editingEmail ? (
              // Edit Form
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email *
                    </label>
                    <input
                      type="email"
                      value={editingEmail.from}
                      onChange={(e) =>
                        setEditingEmail({ ...editingEmail, from: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="sender@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={editingEmail.fromName}
                      onChange={(e) =>
                        setEditingEmail({ ...editingEmail, fromName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <input
                      type="text"
                      value={editingEmail.to}
                      onChange={(e) =>
                        setEditingEmail({ ...editingEmail, to: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editingEmail.date}
                      onChange={(e) =>
                        setEditingEmail({ ...editingEmail, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={editingEmail.subject}
                    onChange={(e) =>
                      setEditingEmail({ ...editingEmail, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body
                  </label>
                  <textarea
                    value={editingEmail.body}
                    onChange={(e) =>
                      setEditingEmail({ ...editingEmail, body: e.target.value })
                    }
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Email content..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingEmail(null)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveManualEmail}
                    disabled={!editingEmail.from || !editingEmail.subject}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-medium text-white transition-colors",
                      editingEmail.from && editingEmail.subject
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                    )}
                  >
                    Add Email
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Email List */}
                {manualEmails.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {manualEmails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-500">
                            From: {email.fromName || email.from}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingEmail(email)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeManualEmail(email.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={addManualEmail}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Email Manually
                </button>

                {manualEmails.length > 0 && (
                  <button
                    onClick={handleManualImport}
                    disabled={isImporting}
                    className={cn(
                      "mt-4 w-full py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2",
                      isImporting
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Import {manualEmails.length} Email(s)
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
