"use client";

import React, { useState } from "react";
import { Milestone, CreateMilestoneInput } from "@/lib/types";
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Modal,
  EmptyState,
} from "@/components/ui";
import { formatDate, formatDateTime, isOverdue, cn } from "@/lib/utils";
import {
  Plus,
  Diamond,
  Calendar,
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  Flag,
  X,
  MessageSquare,
} from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";

interface MilestoneManagementProps {
  milestones: Milestone[];
  projectId: string;
  onAddMilestone: (data: CreateMilestoneInput) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
  onCompleteMilestone: (id: string) => void;
}

const colorOptions = [
  "#10B981", // green
  "#3B82F6", // blue
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
];

export function MilestoneManagement({
  milestones,
  projectId,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onCompleteMilestone,
}: MilestoneManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const upcomingMilestones = sortedMilestones.filter(
    (m) => !m.completed && new Date(m.dueDate) >= new Date()
  );
  const overdueMilestones = sortedMilestones.filter(
    (m) => !m.completed && isOverdue(m.dueDate)
  );
  const completedMilestones = sortedMilestones.filter((m) => m.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track key project deliverables and deadlines
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Milestone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingMilestones.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overdueMilestones.length > 0 ? "bg-red-100" : "bg-gray-100"}`}>
              <Flag className={`w-5 h-5 ${overdueMilestones.length > 0 ? "text-red-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdueMilestones.length}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedMilestones.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Milestones Timeline */}
      {milestones.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {sortedMilestones.map((milestone) => {
                  const overdue = !milestone.completed && isOverdue(milestone.dueDate);

                  return (
                    <div key={milestone.id} className="relative pl-16">
                      {/* Diamond Icon */}
                      <div
                        className={cn(
                          "absolute left-4 w-5 h-5 transform rotate-45 border-2",
                          milestone.completed
                            ? "bg-green-500 border-green-500"
                            : overdue
                            ? "bg-red-500 border-red-500"
                            : "bg-white border-gray-300"
                        )}
                        style={{
                          backgroundColor: milestone.completed
                            ? "#10B981"
                            : overdue
                            ? "#EF4444"
                            : "white",
                          borderColor: milestone.completed
                            ? "#10B981"
                            : overdue
                            ? "#EF4444"
                            : milestone.color,
                        }}
                      />

                      {/* Milestone Card */}
                      <div
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer",
                          milestone.completed
                            ? "bg-green-50 border-green-200"
                            : overdue
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-gray-200"
                        )}
                        onClick={() => setSelectedMilestone(milestone)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className={cn(
                                  "font-semibold",
                                  milestone.completed && "line-through text-gray-500"
                                )}
                              >
                                {milestone.name}
                              </h3>
                              {milestone.completed && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {overdue && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  Overdue
                                </span>
                              )}
                            </div>

                            {milestone.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {milestone.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Due: {formatDate(milestone.dueDate)}
                              </span>
                              {milestone.completedAt && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Completed: {formatDate(milestone.completedAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            {!milestone.completed && (
                              <button
                                onClick={() => onCompleteMilestone(milestone.id)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Mark as complete"
                              >
                                <Circle className="w-5 h-5 text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingMilestone(milestone)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => onDeleteMilestone(milestone.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Diamond className="w-12 h-12" />}
          title="No milestones defined"
          description="Add milestones to track key project deliverables"
          action={
            <Button onClick={() => setIsFormOpen(true)}>Add First Milestone</Button>
          }
        />
      )}

      {/* Milestone Form Modal */}
      <MilestoneForm
        isOpen={isFormOpen || !!editingMilestone}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMilestone(null);
        }}
        onSubmit={(data) => {
          if (editingMilestone) {
            onUpdateMilestone(editingMilestone.id, data as Partial<Milestone>);
          } else {
            onAddMilestone({ ...data, projectId });
          }
          setIsFormOpen(false);
          setEditingMilestone(null);
        }}
        projectId={projectId}
        existingMilestone={editingMilestone || undefined}
      />

      {/* Milestone Detail Panel */}
      {selectedMilestone && (
        <MilestoneDetail
          milestone={selectedMilestone}
          isOpen={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onComplete={() => {
            onCompleteMilestone(selectedMilestone.id);
            setSelectedMilestone(null);
          }}
          onEdit={() => {
            setEditingMilestone(selectedMilestone);
            setSelectedMilestone(null);
          }}
          onDelete={() => {
            onDeleteMilestone(selectedMilestone.id);
            setSelectedMilestone(null);
          }}
        />
      )}
    </div>
  );
}

interface MilestoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMilestoneInput) => void;
  projectId: string;
  existingMilestone?: Milestone;
}

function MilestoneForm({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  existingMilestone,
}: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    name: existingMilestone?.name || "",
    description: existingMilestone?.description || "",
    dueDate: existingMilestone
      ? new Date(existingMilestone.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
    color: existingMilestone?.color || "#10B981",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Milestone name is required";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: formData.name,
      description: formData.description || undefined,
      dueDate: new Date(formData.dueDate),
      color: formData.color,
      projectId,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingMilestone ? "Edit Milestone" : "Add Milestone"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Milestone Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Phase 1 Complete"
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe this milestone..."
          rows={2}
        />

        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          error={errors.dueDate}
          required
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform hover:scale-110",
                  formData.color === color && "ring-2 ring-offset-2 ring-gray-400"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {existingMilestone ? "Update Milestone" : "Add Milestone"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface MilestoneDetailProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MilestoneDetail({
  milestone,
  isOpen,
  onClose,
  onComplete,
  onEdit,
  onDelete,
}: MilestoneDetailProps) {
  const overdue = !milestone.completed && isOverdue(milestone.dueDate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="relative ml-auto w-full max-w-xl bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full border",
                  milestone.completed
                    ? "bg-green-100 text-green-700 border-green-300"
                    : overdue
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-blue-100 text-blue-700 border-blue-300"
                )}
              >
                {milestone.completed ? "Completed" : overdue ? "Overdue" : "Upcoming"}
              </span>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: milestone.color }}
              />
            </div>
            <div className="flex items-center gap-2">
              {!milestone.completed && (
                <button
                  onClick={onComplete}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="Mark as complete"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </button>
              )}
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Milestone Name */}
          <div>
            <div className="flex items-center gap-2">
              <Diamond
                className="w-6 h-6"
                style={{ color: milestone.color }}
              />
              <h2 className={cn(
                "text-xl font-semibold text-gray-900",
                milestone.completed && "line-through text-gray-500"
              )}>
                {milestone.name}
              </h2>
            </div>
            {milestone.description && (
              <p className="mt-2 text-gray-600">{milestone.description}</p>
            )}
          </div>

          {/* Due Date */}
          <div className={cn(
            "rounded-lg p-4",
            milestone.completed
              ? "bg-green-50"
              : overdue
              ? "bg-red-50"
              : "bg-gray-50"
          )}>
            <div className={cn(
              "flex items-center gap-2 text-sm mb-1",
              milestone.completed
                ? "text-green-600"
                : overdue
                ? "text-red-600"
                : "text-gray-500"
            )}>
              <Calendar className="w-4 h-4" />
              Due Date
            </div>
            <p className={cn(
              "font-medium",
              milestone.completed
                ? "text-green-700"
                : overdue
                ? "text-red-700"
                : "text-gray-900"
            )}>
              {formatDate(milestone.dueDate)}
              {overdue && " (Overdue)"}
            </p>
          </div>

          {/* Completion Info */}
          {milestone.completedAt && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
              <p className="font-medium text-green-700">
                {formatDate(milestone.completedAt)}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200">
            <CommentsSection entityType="milestone" entityId={milestone.id} />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            <p>Created: {formatDateTime(milestone.createdAt)}</p>
            <p>Updated: {formatDateTime(milestone.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MilestoneManagement;
