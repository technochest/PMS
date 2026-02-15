"use client";

import React, { useState } from "react";
import { Project, CreateProjectInput, ProjectStatus, Priority } from "@/lib/types";
import { Button, Input, Textarea, Select, Modal, ProgressBar, Badge } from "@/components/ui";
import { formatDate, getStatusColor, getPriorityColor, formatCurrency, cn } from "@/lib/utils";
import { ProjectForm as EnhancedProjectForm } from "@/components/project/ProjectForm";
import {
  Plus,
  FolderKanban,
  Calendar,
  DollarSign,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  Home,
  Ticket,
  GitBranch,
  Mail,
} from "lucide-react";
import { AppView } from "@/app/page";

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (data: CreateProjectInput) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  tasks: { projectId: string; status: string }[];
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  tasks,
  currentView,
  onChangeView,
}: SidebarProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const navItems = [
    { id: "home" as AppView, label: "Home", icon: Home },
    { id: "emails" as AppView, label: "Emails", icon: Mail },
    { id: "tickets" as AppView, label: "Tickets", icon: Ticket },
    { id: "myProjects" as AppView, label: "My Projects", icon: FolderKanban },
    { id: "myWorkflows" as AppView, label: "My Workflows", icon: GitBranch },
  ];

  return (
    <>
      <aside
        className={cn(
          "bg-gray-900 text-white flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* Header with collapse toggle */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Navigation
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight
                className={cn(
                  "w-5 h-5 transition-transform",
                  isCollapsed ? "" : "rotate-180"
                )}
              />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Primary Navigation Items */}
          <nav className="space-y-1 mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg transition-colors",
                    isCollapsed ? "p-3 justify-center" : "px-3 py-2.5",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Projects Section */}
          {!isCollapsed && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <button
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300"
                >
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isProjectsExpanded ? "rotate-90" : ""
                    )}
                  />
                  Projects
                </button>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {isProjectsExpanded && (
                <nav className="space-y-1">
                  {projects.map((project) => {
                    const progress = getProjectProgress(project.id);
                    const isSelected = selectedProjectId === project.id && currentView === "myProjects";

                    return (
                      <div
                        key={project.id}
                        className={cn(
                          "group rounded-lg transition-colors cursor-pointer",
                          isSelected
                            ? "bg-gray-700"
                            : "hover:bg-gray-800"
                        )}
                        onClick={() => {
                          onSelectProject(project.id);
                          onChangeView("myProjects");
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{project.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded capitalize",
                                    project.status === "active"
                                      ? "bg-green-900/50 text-green-400"
                                      : project.status === "completed"
                                      ? "bg-blue-900/50 text-blue-400"
                                      : "bg-gray-700 text-gray-400"
                                  )}
                                >
                                  {project.status}
                                </span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(project);
                                }}
                                className="p-1 hover:bg-gray-600 rounded"
                              >
                                <Settings className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: project.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {projects.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm mb-3">No projects yet</p>
                      <Button
                        size="sm"
                        onClick={() => setIsFormOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Create Project
                      </Button>
                    </div>
                  )}
                </nav>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-700">
            <Button
              className="w-full"
              onClick={() => setIsFormOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Project
            </Button>
          </div>
        )}
      </aside>

      {/* Enhanced Project Form Modal */}
      {(isFormOpen || editingProject) && (
        <EnhancedProjectForm
          project={editingProject}
          onSave={(data) => {
            if (editingProject) {
              onUpdateProject(editingProject.id, data as Partial<Project>);
            } else {
              onAddProject(data);
            }
            setIsFormOpen(false);
            setEditingProject(null);
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </>
  );
}

export default Sidebar;
