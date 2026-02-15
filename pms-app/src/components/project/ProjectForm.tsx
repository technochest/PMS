"use client";

import React, { useState } from "react";
import { useAdminStore } from "@/lib/adminStore";
import {
  Project,
  CreateProjectInput,
  Priority,
  ProjectStatus,
  QueueLevel,
} from "@/lib/types";
import {
  X,
  FolderKanban,
  Calendar,
  DollarSign,
  User,
  Building2,
  Briefcase,
  Tag,
  ListOrdered,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface ProjectFormProps {
  project?: Project | null;
  onSave: (data: CreateProjectInput) => void;
  onClose: () => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
];

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const queueOptions: QueueLevel[] = [0, 1, 2, 3, 4];

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

export function ProjectForm({ project, onSave, onClose }: ProjectFormProps) {
  const { entities, departments, categories, users } = useAdminStore();

  const [formData, setFormData] = useState<CreateProjectInput>({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "planning",
    priority: project?.priority || "medium",
    queue: project?.queue || 0,
    startDate: project?.startDate || new Date(),
    endDate: project?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    businessRequirementDate: project?.businessRequirementDate || undefined,
    budget: project?.budget || 0,
    color: project?.color || "#3B82F6",
    entityId: project?.entityId || undefined,
    departmentId: project?.departmentId || undefined,
    categoryId: project?.categoryId || undefined,
    projectLeadId: project?.projectLeadId || undefined,
  });

  const [activeSection, setActiveSection] = useState<"basic" | "dates" | "organization" | "team">("basic");

  // Filter departments based on selected entity
  const filteredDepartments = formData.entityId
    ? departments.filter((d) => d.entityId === formData.entityId || !d.entityId)
    : departments;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd");
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: FolderKanban },
    { id: "dates", label: "Dates & Budget", icon: Calendar },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "team", label: "Team", icon: User },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + "20" }}
            >
              <FolderKanban className="w-5 h-5" style={{ color: formData.color }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {project ? "Edit Project" : "Create New Project"}
              </h2>
              <p className="text-sm text-gray-500">
                Fill in the project details below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b bg-gray-50 flex-shrink-0">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info Section */}
            {activeSection === "basic" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe the project objectives and scope"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ProjectStatus })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: option.value })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.priority === option.value
                              ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <ListOrdered className="w-4 h-4 inline mr-1" />
                      Queue
                    </label>
                    <div className="flex gap-2">
                      {queueOptions.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setFormData({ ...formData, queue: q })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.queue === q
                              ? "bg-blue-100 text-blue-700 ring-2 ring-offset-1 ring-blue-500"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Color
                    </label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-lg transition-transform ${
                            formData.color === color
                              ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dates & Budget Section */}
            {activeSection === "dates" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(formData.startDate)}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: new Date(e.target.value) })
                      }
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Projected End Date *
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(formData.endDate)}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: new Date(e.target.value) })
                      }
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Business Requirement Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.businessRequirementDate)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessRequirementDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The date when business requirements should be finalized
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.budget || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="100"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organization Section */}
            {activeSection === "organization" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Entity
                  </label>
                  <select
                    value={formData.entityId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entityId: e.target.value || undefined,
                        departmentId: undefined, // Reset department when entity changes
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Entity</option>
                    {entities
                      .filter((e) => e.isActive)
                      .map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      ))}
                  </select>
                  {entities.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No entities configured. Add entities in Settings.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Department
                  </label>
                  <select
                    value={formData.departmentId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {filteredDepartments
                      .filter((d) => d.isActive)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories
                      .filter((c) => c.isActive)
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              categoryId:
                                formData.categoryId === category.id ? undefined : category.id,
                            })
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            formData.categoryId === category.id
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate">{category.name}</span>
                        </button>
                      ))}
                  </div>
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No categories configured. Categories are pre-configured in Settings.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Team Section */}
            {activeSection === "team" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Project Lead
                  </label>
                  <select
                    value={formData.projectLeadId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, projectLeadId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project Lead</option>
                    {users
                      .filter((u) => u.isActive)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                  </select>
                  {users.length <= 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Add more users in User Administration to assign as project leads.
                    </p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                  <p className="text-sm text-gray-500">
                    Team members can be assigned after creating the project through the Resource Management section.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 flex-shrink-0">
            <div className="text-sm text-gray-500">
              {activeSection !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = sections.findIndex((s) => s.id === activeSection);
                    if (idx > 0) setActiveSection(sections[idx - 1].id as any);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {activeSection !== "team" ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = sections.findIndex((s) => s.id === activeSection);
                    if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id as any);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {project ? "Save Changes" : "Create Project"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
