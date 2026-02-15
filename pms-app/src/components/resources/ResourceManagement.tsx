"use client";

import React, { useState } from "react";
import { Resource, ResourceAllocation, Task, CreateResourceInput } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Modal,
  Avatar,
  ProgressBar,
  Badge,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Mail,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Edit,
  Trash2,
  Search,
  Filter,
} from "lucide-react";

interface ResourceManagementProps {
  resources: Resource[];
  allocations: ResourceAllocation[];
  tasks: Task[];
  onAddResource: (data: CreateResourceInput) => void;
  onUpdateResource: (id: string, updates: Partial<Resource>) => void;
  onDeleteResource: (id: string) => void;
}

export function ResourceManagement({
  resources,
  allocations,
  tasks,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}: ResourceManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResourceWorkload = (resourceId: string) => {
    const assignedTasks = tasks.filter((t) => t.assigneeId === resourceId);
    const activeTasks = assignedTasks.filter((t) => t.status !== "done");
    const totalHours = activeTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    return { activeTasks: activeTasks.length, totalHours };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Resources</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage team members and their allocations
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Resource Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const workload = getResourceWorkload(resource.id);
            const skills = resource.skills ? JSON.parse(resource.skills) : [];

            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={resource.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-gray-500">{resource.role}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{resource.email}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedResource(resource)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => onDeleteResource(resource.id)}
                        className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Briefcase className="w-3.5 h-3.5" />
                        Active Tasks
                      </div>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {workload.activeTasks}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        Hours
                      </div>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {workload.totalHours}h
                      </p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Availability</span>
                      <span className="font-medium">{resource.availability}%</span>
                    </div>
                    <ProgressBar value={resource.availability} size="sm" />
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="default">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 3 && (
                        <Badge variant="default">+{skills.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  {/* Hourly Rate */}
                  {resource.hourlyRate > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(resource.hourlyRate)}/hr
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No resources found"
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "Add team members to manage resources and allocations"
          }
          action={
            !searchTerm && (
              <Button onClick={() => setIsFormOpen(true)}>Add First Resource</Button>
            )
          }
        />
      )}

      {/* Resource Form Modal */}
      <ResourceForm
        isOpen={isFormOpen || !!selectedResource}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedResource(null);
        }}
        onSubmit={(data) => {
          if (selectedResource) {
            onUpdateResource(selectedResource.id, data as Partial<Resource>);
          } else {
            onAddResource(data);
          }
          setIsFormOpen(false);
          setSelectedResource(null);
        }}
        existingResource={selectedResource || undefined}
      />
    </div>
  );
}

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateResourceInput) => void;
  existingResource?: Resource;
}

function ResourceForm({
  isOpen,
  onClose,
  onSubmit,
  existingResource,
}: ResourceFormProps) {
  const [formData, setFormData] = useState({
    name: existingResource?.name || "",
    email: existingResource?.email || "",
    role: existingResource?.role || "",
    hourlyRate: existingResource?.hourlyRate?.toString() || "",
    department: existingResource?.department || "",
    skills: existingResource?.skills
      ? JSON.parse(existingResource.skills).join(", ")
      : "",
    availability: existingResource?.availability?.toString() || "100",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      department: formData.department || undefined,
      skills: formData.skills
        ? formData.skills.split(",").map((s: string) => s.trim())
        : undefined,
      availability: formData.availability
        ? parseFloat(formData.availability)
        : undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingResource ? "Edit Resource" : "Add New Resource"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            error={errors.role}
            placeholder="e.g., Developer, Designer"
            required
          />

          <Input
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g., Engineering"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hourly Rate ($)"
            name="hourlyRate"
            type="number"
            value={formData.hourlyRate}
            onChange={handleChange}
            placeholder="e.g., 75"
            min="0"
            step="0.01"
          />

          <Input
            label="Availability (%)"
            name="availability"
            type="number"
            value={formData.availability}
            onChange={handleChange}
            placeholder="100"
            min="0"
            max="100"
          />
        </div>

        <Input
          label="Skills (comma-separated)"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          placeholder="e.g., React, TypeScript, Node.js"
          helperText="Enter skills separated by commas"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {existingResource ? "Update Resource" : "Add Resource"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ResourceManagement;
