"use client";

import React, { useState, useEffect } from "react";
import { useProjectStore } from "@/lib/store";
import { useAdminStore } from "@/lib/adminStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { ProjectView } from "@/components/project/ProjectView";
import { LoginPage } from "@/components/auth/LoginPage";
import { UserManagement } from "@/components/admin/UserManagement";
import { SettingsManagement } from "@/components/admin/SettingsManagement";
import { TicketManagement } from "@/components/tickets/TicketManagement";
import { EmailManagement } from "@/components/emails/EmailManagement";
import { Marketplace } from "@/components/marketplace/Marketplace";
import { ImportsPage } from "@/components/imports/ImportsPage";
import { EmptyState, Button } from "@/components/ui";
import { FolderKanban, Plus, Rocket } from "lucide-react";
import { Task, TaskStatus } from "@/lib/types";

// View types for navigation
export type AppView = "home" | "emails" | "tickets" | "myProjects" | "myWorkflows" | "users" | "settings" | "marketplace" | "imports";

// Demo data for initial experience
const createDemoData = (addProject: any, addTask: any, addMilestone: any, addResource: any, addBudgetItem: any) => {
  // Add demo project
  const project = addProject({
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX, improved performance, and mobile responsiveness.",
    status: "active",
    priority: "high",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    budget: 75000,
    color: "#3B82F6",
  });

  // Add demo tasks
  const task1 = addTask({
    name: "Research & Planning",
    description: "Conduct user research, competitor analysis, and create project plan",
    status: "done",
    priority: "high",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedHours: 40,
    projectId: project.id,
  });

  const task2 = addTask({
    name: "Wireframe Design",
    description: "Create wireframes for all major pages and user flows",
    status: "in-progress",
    priority: "high",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    estimatedHours: 32,
    projectId: project.id,
  });

  const task3 = addTask({
    name: "Visual Design",
    description: "Create high-fidelity mockups and design system",
    status: "todo",
    priority: "medium",
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    estimatedHours: 60,
    projectId: project.id,
  });

  const task4 = addTask({
    name: "Frontend Development",
    description: "Build React components and implement designs",
    status: "todo",
    priority: "medium",
    startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
    estimatedHours: 120,
    projectId: project.id,
  });

  const task5 = addTask({
    name: "Backend Integration",
    description: "Connect frontend with APIs and database",
    status: "todo",
    priority: "medium",
    startDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
    estimatedHours: 80,
    projectId: project.id,
  });

  const task6 = addTask({
    name: "Testing & QA",
    description: "Comprehensive testing across devices and browsers",
    status: "todo",
    priority: "high",
    startDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
    estimatedHours: 40,
    projectId: project.id,
  });

  // Update first task progress
  const store = useProjectStore.getState();
  store.updateTask(task1.id, { progress: 100, actualHours: 38 });
  store.updateTask(task2.id, { progress: 60, actualHours: 20 });

  // Add demo milestones
  addMilestone({
    name: "Design Approval",
    description: "Get stakeholder approval on final designs",
    dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    color: "#10B981",
    projectId: project.id,
  });

  addMilestone({
    name: "Beta Launch",
    description: "Launch beta version for internal testing",
    dueDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
    color: "#8B5CF6",
    projectId: project.id,
  });

  addMilestone({
    name: "Production Launch",
    description: "Full production deployment",
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    color: "#F59E0B",
    projectId: project.id,
  });

  // Add demo resources
  addResource({
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Project Manager",
    hourlyRate: 85,
    department: "Management",
    skills: ["Project Management", "Agile", "Communication"],
    availability: 100,
  });

  addResource({
    name: "Mike Chen",
    email: "mike@company.com",
    role: "UX Designer",
    hourlyRate: 75,
    department: "Design",
    skills: ["Figma", "User Research", "Prototyping"],
    availability: 100,
  });

  addResource({
    name: "Emily Davis",
    email: "emily@company.com",
    role: "Frontend Developer",
    hourlyRate: 90,
    department: "Engineering",
    skills: ["React", "TypeScript", "CSS"],
    availability: 80,
  });

  addResource({
    name: "Alex Thompson",
    email: "alex@company.com",
    role: "Backend Developer",
    hourlyRate: 95,
    department: "Engineering",
    skills: ["Node.js", "PostgreSQL", "API Design"],
    availability: 100,
  });

  // Add demo budget items
  addBudgetItem(project.id, {
    name: "Design Team",
    category: "labor",
    planned: 25000,
    actual: 8500,
    notes: "UX/UI design and prototyping",
  });

  addBudgetItem(project.id, {
    name: "Development Team",
    category: "labor",
    planned: 40000,
    actual: 5000,
    notes: "Frontend and backend development",
  });

  addBudgetItem(project.id, {
    name: "Design Tools",
    category: "software",
    planned: 2000,
    actual: 1800,
    notes: "Figma, Adobe CC subscriptions",
  });

  addBudgetItem(project.id, {
    name: "Hosting & Infrastructure",
    category: "software",
    planned: 5000,
    actual: 1200,
    notes: "AWS, Vercel hosting",
  });

  addBudgetItem(project.id, {
    name: "Testing Devices",
    category: "equipment",
    planned: 3000,
    actual: 2800,
    notes: "Mobile devices for testing",
  });

  return project.id;
};

export default function Home() {
  const {
    projects,
    tasks,
    milestones,
    resources,
    budgetItems,
    selectedProjectId,
    selectProject,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
    addResource,
    updateResource,
    deleteResource,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
  } = useProjectStore();

  const { isAuthenticated, currentUser, logout, initializeDefaults } = useAdminStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>("home");

  // Initialize admin store defaults
  useEffect(() => {
    initializeDefaults();
  }, []);

  // Initialize with demo data if empty (only after authenticated)
  useEffect(() => {
    if (!isInitialized && projects.length === 0 && isAuthenticated) {
      const projectId = createDemoData(
        addProject,
        addTask,
        addMilestone,
        addResource,
        addBudgetItem
      );
      selectProject(projectId);
      setIsInitialized(true);
    } else if (!isInitialized && isAuthenticated) {
      setIsInitialized(true);
    }
  }, [isInitialized, projects.length, isAuthenticated]);

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);
  const projectMilestones = milestones.filter((m) => m.projectId === selectedProjectId);
  const projectBudgetItems = budgetItems.filter((b) => b.projectId === selectedProjectId);

  // Render the current view content
  const renderMainContent = () => {
    switch (currentView) {
      case "users":
        return <UserManagement />;
      case "settings":
        return <SettingsManagement />;
      case "tickets":
        return <TicketManagement />;
      case "emails":
        return <EmailManagement />;
      case "marketplace":
        return <Marketplace />;
      case "imports":
        return <ImportsPage />;
      case "home":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <EmptyState
              icon={<Rocket className="w-16 h-16" />}
              title="Welcome to Work Management Hub"
              description="Your central hub for managing projects, tasks, and workflows. Select an option from the sidebar to get started."
              action={
                <Button
                  size="lg"
                  onClick={() => setCurrentView("myProjects")}
                  leftIcon={<FolderKanban className="w-5 h-5" />}
                >
                  View My Projects
                </Button>
              }
            />
          </div>
        );
      case "myWorkflows":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Workflows</h1>
              <p className="text-gray-500 mb-6">Create and manage automated workflows for your projects and tasks.</p>
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">No workflows yet</p>
                <p className="text-sm">Workflows help automate repetitive tasks and processes.</p>
                <Button className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Workflow
                </Button>
              </div>
            </div>
          </div>
        );
      case "myProjects":
      default:
        return selectedProject ? (
          <ProjectView
            project={selectedProject}
            tasks={projectTasks}
            milestones={projectMilestones}
            resources={resources}
            budgetItems={projectBudgetItems}
            onUpdateProject={(updates) => updateProject(selectedProject.id, updates)}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onMoveTask={moveTask}
            onAddMilestone={addMilestone}
            onUpdateMilestone={updateMilestone}
            onDeleteMilestone={deleteMilestone}
            onCompleteMilestone={completeMilestone}
            onAddResource={addResource}
            onUpdateResource={updateResource}
            onDeleteResource={deleteResource}
            onAddBudgetItem={(data) => addBudgetItem(selectedProject.id, data)}
            onUpdateBudgetItem={updateBudgetItem}
            onDeleteBudgetItem={deleteBudgetItem}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <EmptyState
              icon={<FolderKanban className="w-16 h-16" />}
              title="Select a Project"
              description="Choose a project from the sidebar or create a new one to get started"
              action={
                <Button
                  size="lg"
                  onClick={() => {
                    const project = addProject({
                      name: "New Project",
                      description: "Project description",
                      startDate: new Date(),
                      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                    selectProject(project.id);
                  }}
                  leftIcon={<Plus className="w-5 h-5" />}
                >
                  Create New Project
                </Button>
              }
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Top Header */}
      <TopHeader
        currentUser={currentUser}
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={logout}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Always visible */}
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            selectProject(id);
            setCurrentView("myProjects");
          }}
          onAddProject={addProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          tasks={tasks.map((t) => ({ projectId: t.projectId, status: t.status }))}
          currentView={currentView}
          onChangeView={setCurrentView}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
