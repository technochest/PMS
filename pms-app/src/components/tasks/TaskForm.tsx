"use client";

import React, { useState } from "react";
import { Task, TaskStatus, Priority, CreateTaskInput } from "@/lib/types";
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Badge,
  ProgressBar,
  Avatar,
} from "@/components/ui";
import {
  formatDate,
  formatDateTime,
  getPriorityColor,
  getStatusColor,
  isOverdue,
} from "@/lib/utils";
import {
  X,
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  Link2,
  Trash2,
  Edit,
} from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  projectId: string;
  initialStatus?: TaskStatus;
  existingTask?: Task;
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  initialStatus = "todo",
  existingTask,
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: existingTask?.name || "",
    description: existingTask?.description || "",
    status: existingTask?.status || initialStatus,
    priority: existingTask?.priority || "medium",
    startDate: existingTask
      ? new Date(existingTask.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    endDate: existingTask
      ? new Date(existingTask.endDate).toISOString().split("T")[0]
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
    estimatedHours: existingTask?.estimatedHours?.toString() || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      newErrors.name = "Task name is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      newErrors.endDate = "End date must be after start date";
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
      status: formData.status as TaskStatus,
      priority: formData.priority as Priority,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      estimatedHours: formData.estimatedHours
        ? parseFloat(formData.estimatedHours)
        : undefined,
      projectId,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingTask ? "Edit Task" : "Create New Task"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter task name"
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the task..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />

          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
            required
          />

          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
            required
          />
        </div>

        <Input
          label="Estimated Hours"
          name="estimatedHours"
          type="number"
          value={formData.estimatedHours}
          onChange={handleChange}
          placeholder="e.g., 8"
          min="0"
          step="0.5"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {existingTask ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface TaskDetailProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

export function TaskDetail({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(task.progress);
  const overdue = isOverdue(task.endDate) && task.status !== "done";

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
                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status.replace("-", " ")}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
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
          {/* Task Name */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{task.name}</h2>
            {task.description && (
              <p className="mt-2 text-gray-600">{task.description}</p>
            )}
          </div>

          {/* Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <ProgressBar value={progress} size="md" />
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setProgress(value);
              }}
              onMouseUp={() => {
                onUpdate({ progress });
              }}
              className="w-full mt-3"
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                Start Date
              </div>
              <p className="font-medium text-gray-900">
                {formatDate(task.startDate)}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                overdue ? "bg-red-50" : "bg-gray-50"
              }`}
            >
              <div
                className={`flex items-center gap-2 text-sm mb-1 ${
                  overdue ? "text-red-600" : "text-gray-500"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Due Date
              </div>
              <p
                className={`font-medium ${
                  overdue ? "text-red-700" : "text-gray-900"
                }`}
              >
                {formatDate(task.endDate)}
                {overdue && " (Overdue)"}
              </p>
            </div>

            {/* Hours */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                Estimated
              </div>
              <p className="font-medium text-gray-900">
                {task.estimatedHours || 0} hours
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                Actual
              </div>
              <p className="font-medium text-gray-900">
                {task.actualHours || 0} hours
              </p>
            </div>
          </div>

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Avatar name={task.assignee.name} />
              <div>
                <p className="font-medium text-gray-900">{task.assignee.name}</p>
                <p className="text-sm text-gray-500">{task.assignee.role}</p>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200">
            <CommentsSection entityType="task" entityId={task.id} />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            <p>Created: {formatDateTime(task.createdAt)}</p>
            <p>Updated: {formatDateTime(task.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskForm;
