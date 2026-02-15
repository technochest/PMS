"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/adminStore";
import {
  Upload,
  Download,
  Mail,
  Ticket,
  FolderKanban,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  ArrowLeft,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

type ImportType = "emails" | "tickets" | "projects";
type EmailImportMode = "upload" | "path";

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

// CSV Templates
const EMAIL_TEMPLATE = `from,to,subject,body,date,isRead
john.doe@company.com,jane.smith@company.com,Project Update,Hello Jane - Just wanted to update you on the project status.,2026-02-10T10:30:00Z,false
support@vendor.com,team@company.com,Invoice #12345,Please find attached the invoice for January services.,2026-02-09T14:15:00Z,true
client@external.com,sales@company.com,Meeting Request,Can we schedule a call to discuss the proposal?,2026-02-08T09:00:00Z,false`;

const TICKET_TEMPLATE = `title,description,priority,status,category,assignedTo,reportedBy,dueDate
Login page not working,Users are unable to login after the latest update. Error 500 appears.,high,open,bug,john.doe@company.com,support@company.com,2026-02-15
Add dark mode feature,Request to implement dark mode for better accessibility.,medium,backlog,feature,jane.smith@company.com,client@external.com,2026-03-01
Update documentation,The API documentation needs to be updated with new endpoints.,low,in-progress,documentation,dev@company.com,pm@company.com,2026-02-20`;

const PROJECT_TEMPLATE = `name,description,status,priority,startDate,endDate,budget,color
Website Redesign,Complete redesign of the company website with modern UI/UX.,active,high,2026-02-01,2026-05-01,75000,#3B82F6
Mobile App Development,Build native iOS and Android apps for our platform.,planning,medium,2026-03-01,2026-08-01,120000,#10B981
Data Migration,Migrate legacy database to new cloud infrastructure.,active,high,2026-02-15,2026-04-15,50000,#F59E0B`;

export function ImportsPage() {
  const { currentUser } = useAdminStore();
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailImportMode, setEmailImportMode] = useState<EmailImportMode>("path");
  const [pstFilePath, setPstFilePath] = useState("");

  const importTypes = [
    {
      id: "emails" as ImportType,
      name: "Email Import",
      description: "Import emails from PST, CSV, or .eml files from Outlook",
      icon: <Mail className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      features: [".pst files (Outlook archive)", ".eml files (single emails)", "CSV with email data"],
    },
    {
      id: "tickets" as ImportType,
      name: "Ticket Import",
      description: "Import support tickets, bug reports, and feature requests",
      icon: <Ticket className="w-8 h-8" />,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
      features: ["Jira export compatibility", "Custom field mapping", "Priority & status sync"],
    },
    {
      id: "projects" as ImportType,
      name: "Project Import",
      description: "Import projects with tasks, milestones, and resources",
      icon: <FolderKanban className="w-8 h-8" />,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
      features: ["Project structure", "Task dependencies", "Budget & timeline"],
    },
  ];

  const getTemplate = (type: ImportType): string => {
    switch (type) {
      case "emails":
        return EMAIL_TEMPLATE;
      case "tickets":
        return TICKET_TEMPLATE;
      case "projects":
        return PROJECT_TEMPLATE;
    }
  };

  const downloadTemplate = (type: ImportType) => {
    const template = getTemplate(type);
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!selectedType || !currentUser?.id) return;

    setUploading(true);
    setResult(null);

    try {
      const fileName = file.name.toLowerCase();

      // Handle PST files separately (for emails only)
      if (fileName.endsWith(".pst") && selectedType === "emails") {
        // Check file size (500MB limit)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
          setResult({
            success: false,
            imported: 0,
            errors: [`PST file is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 500MB.`],
          });
          setUploading(false);
          return;
        }

        console.log(`Uploading PST file: ${file.name}, size: ${file.size} bytes`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", currentUser.id);
        formData.append("maxEmails", "500"); // Limit for performance

        try {
          const response = await fetch("/api/emails/import-pst", {
            method: "POST",
            body: formData,
          });

          const responseText = await response.text();
          console.log("PST import response:", responseText);

          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            setResult({
              success: false,
              imported: 0,
              errors: [`Server error: ${responseText.substring(0, 200)}`],
            });
            setUploading(false);
            return;
          }

          if (response.ok) {
            setResult({
              success: true,
              imported: data.imported,
              errors: data.errors || [],
            });
          } else {
            setResult({
              success: false,
              imported: 0,
              errors: [data.error || data.details || "PST import failed"],
            });
          }
        } catch (fetchError) {
          console.error("PST fetch error:", fetchError);
          setResult({
            success: false,
            imported: 0,
            errors: [`Upload failed: ${fetchError instanceof Error ? fetchError.message : "Network error"}`],
          });
        }
        setUploading(false);
        return;
      }

      const text = await file.text();
      
      // Parse CSV
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        setResult({
          success: false,
          imported: 0,
          errors: ["File must have at least a header row and one data row"],
        });
        setUploading(false);
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const records: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const record: Record<string, string> = {};
          headers.forEach((h, idx) => {
            record[h] = values[idx];
          });
          records.push(record);
        }
      }

      // Call appropriate API based on type
      let response;
      if (selectedType === "emails") {
        response = await fetch("/api/emails/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "csv",
            data: records,
            userId: currentUser.id,
          }),
        });
      } else if (selectedType === "tickets") {
        response = await fetch("/api/tickets/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records,
            userId: currentUser.id,
          }),
        });
      } else if (selectedType === "projects") {
        response = await fetch("/api/projects/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records,
            userId: currentUser.id,
          }),
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          imported: data.imported || records.length,
          errors: data.errors || [],
        });
      } else {
        const error = response ? await response.json() : { error: "Unknown error" };
        setResult({
          success: false,
          imported: 0,
          errors: [error.error || "Import failed"],
        });
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        errors: ["Failed to process file. Please check the format and try again."],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Simple CSV line parser that handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // If a type is selected, show the import interface
  if (selectedType) {
    const typeConfig = importTypes.find(t => t.id === selectedType)!;

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        {/* Header */}
        <div className={cn("bg-gradient-to-r px-6 py-8", typeConfig.color)}>
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => {
                setSelectedType(null);
                setResult(null);
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Import Options
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white">
                {typeConfig.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{typeConfig.name}</h1>
                <p className="text-white/80">{typeConfig.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedType === "emails" ? "Import PST File" : "Upload File"}
              </h2>
              
              {/* Mode tabs for email import */}
              {selectedType === "emails" && (
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setEmailImportMode("path")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      emailImportMode === "path"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Enter Path (Recommended)
                  </button>
                  <button
                    onClick={() => setEmailImportMode("upload")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      emailImportMode === "upload"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Drag & Drop
                  </button>
                </div>
              )}

              {/* Path-based import for emails */}
              {selectedType === "emails" && emailImportMode === "path" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PST File Path
                    </label>
                    <input
                      type="text"
                      value={pstFilePath}
                      onChange={(e) => setPstFilePath(e.target.value)}
                      placeholder="C:\Users\bjuna\OneDrive\Documents\Junaid.Buchal@mdlz.com.pst"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Paste the full path to your PST file. This is faster for large files.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!pstFilePath || !currentUser?.id) return;
                      setUploading(true);
                      setResult(null);
                      try {
                        const response = await fetch("/api/emails/import-pst-path", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            filePath: pstFilePath,
                            userId: currentUser.id,
                            maxEmails: 500,
                          }),
                        });
                        const data = await response.json();
                        if (response.ok) {
                          setResult({
                            success: true,
                            imported: data.imported,
                            errors: data.errors || [],
                          });
                        } else {
                          setResult({
                            success: false,
                            imported: 0,
                            errors: [data.error || "Import failed"],
                          });
                        }
                      } catch (err) {
                        setResult({
                          success: false,
                          imported: 0,
                          errors: ["Failed to connect to server"],
                        });
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading || !pstFilePath}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors",
                      uploading || !pstFilePath
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Import Emails from PST
                      </>
                    )}
                  </button>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>How to find your PST path:</strong><br />
                      1. Open File Explorer<br />
                      2. Navigate to your PST file<br />
                      3. Hold Shift + Right-click the file<br />
                      4. Select "Copy as path"<br />
                      5. Paste here (remove quotes if any)
                    </p>
                  </div>
                </div>
              )}

              {/* Drag & drop upload (for non-email or upload mode) */}
              {(selectedType !== "emails" || emailImportMode === "upload") && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                )}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-900">Processing...</p>
                    <p className="text-sm text-gray-500">Please wait while we import your data</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      {selectedType === "emails" ? "Drop your EML or CSV file here" : "Drop your CSV file here"}
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse
                    </p>
                    {selectedType === "emails" && (
                      <p className="text-xs text-amber-600 mt-2">
                        For large PST files, use "Enter Path" tab instead
                      </p>
                    )}
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedType === "emails" ? ".csv,.eml" : ".csv"}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              )}

              {/* Result Display */}
              {result && (
                <div className={cn(
                  "mt-4 p-4 rounded-lg",
                  result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        result.success ? "text-green-900" : "text-red-900"
                      )}>
                        {result.success
                          ? `Successfully imported ${result.imported} ${selectedType}`
                          : "Import failed"}
                      </p>
                      {result.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {result.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Template Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Template</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedType}_import_template.csv</p>
                    <p className="text-sm text-gray-500">CSV Template File</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadTemplate(selectedType)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Template Preview</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre">
                    {getTemplate(selectedType)}
                  </pre>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tips</p>
                    <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li>Keep the header row intact</li>
                      <li>Use quotes for values containing commas</li>
                      <li>Dates should be in ISO format (YYYY-MM-DD)</li>
                      <li>Save as UTF-8 encoded CSV</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main import selection view
  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Data Import</h1>
          <p className="text-white/80 text-lg">
            Import your data from external sources using CSV files or templates
          </p>
          
          <div className="flex gap-6 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <p className="text-white/70 text-sm">Import Types</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <p className="text-white/70 text-sm">Formats Supported</p>
              <p className="text-2xl font-bold text-white">CSV, EML</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Options */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Choose Import Type</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {importTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "bg-white rounded-xl border p-6 text-left transition-all hover:shadow-lg hover:scale-[1.02] group",
                type.borderColor
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                type.bgColor,
                type.iconColor
              )}>
                {type.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{type.description}</p>
              <ul className="space-y-2">
                {type.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
                Start Import
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Templates</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">
              Download CSV templates to prepare your data for import. Each template includes sample data and all required fields.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => downloadTemplate("emails")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Email Template
              </button>
              <button
                onClick={() => downloadTemplate("tickets")}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Ticket Template
              </button>
              <button
                onClick={() => downloadTemplate("projects")}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Project Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
