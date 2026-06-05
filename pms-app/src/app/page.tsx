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
    name: "ChartTrader Launch",
    description: "Plan, test, and launch the ChartTrader product on the website with clear milestones for QA, content readiness, and go-live.",
    status: "active",
    priority: "high",
    startDate: new Date(),
    endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    budget: 35000,
    color: "#0EA5E9",
  });

  // Add demo tasks
  const task1 = addTask({
    name: "Define launch scope and success criteria",
    description: "Document launch checklist, acceptance criteria, owners, and target launch window.",
    status: "done",
    priority: "high",
    startDate: new Date(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    estimatedHours: 12,
    projectId: project.id,
  });

  const task2 = addTask({
    name: "Website product page content and assets",
    description: "Prepare product copy, screenshots, video snippets, FAQs, pricing, and CTA flow.",
    status: "in-progress",
    priority: "high",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    estimatedHours: 30,
    projectId: project.id,
  });

  const task3 = addTask({
    name: "Install and onboarding flow validation",
    description: "Validate purchasing, delivery, license activation, and onboarding instructions end to end.",
    status: "todo",
    priority: "high",
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    estimatedHours: 36,
    projectId: project.id,
  });

  const task4 = addTask({
    name: "Cross-environment QA testing",
    description: "Run regression and compatibility testing across Windows/NinjaTrader versions and user account states.",
    status: "todo",
    priority: "high",
    startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    estimatedHours: 70,
    projectId: project.id,
  });

  const task5 = addTask({
    name: "Support and launch readiness",
    description: "Finalize docs, release notes, support playbook, and rollback plan before production launch.",
    status: "todo",
    priority: "medium",
    startDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    estimatedHours: 28,
    projectId: project.id,
  });

  const task6 = addTask({
    name: "Launch campaign and post-launch monitoring",
    description: "Coordinate launch announcement and monitor onboarding, activation, and support volume for the first week.",
    status: "todo",
    priority: "high",
    startDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    estimatedHours: 24,
    projectId: project.id,
  });

  // Update first task progress
  const store = useProjectStore.getState();
  store.updateTask(task1.id, { progress: 100, actualHours: 10 });
  store.updateTask(task2.id, { progress: 45, actualHours: 14 });

  // Add demo milestones
  addMilestone({
    name: "Milestone 1: Launch plan approved",
    description: "Scope, owners, launch date target, and success criteria are confirmed.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    color: "#10B981",
    projectId: project.id,
  });

  addMilestone({
    name: "Milestone 2: Website content and purchase flow ready",
    description: "Product page, media assets, checkout, and license delivery flow are validated.",
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    color: "#3B82F6",
    projectId: project.id,
  });

  addMilestone({
    name: "Milestone 3: QA sign-off",
    description: "Testing complete with blockers resolved and launch recommendation documented.",
    dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    color: "#8B5CF6",
    projectId: project.id,
  });

  addMilestone({
    name: "Milestone 4: Production launch",
    description: "ChartTrader is live on the website with monitoring and support coverage in place.",
    dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
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
    name: "QA and validation",
    category: "labor",
    planned: 12000,
    actual: 2200,
    notes: "Test case execution, bug triage, and acceptance validation",
  });

  addBudgetItem(project.id, {
    name: "Implementation and fixes",
    category: "labor",
    planned: 9000,
    actual: 1500,
    notes: "Engineering support for defects and launch blockers",
  });

  addBudgetItem(project.id, {
    name: "Content and media",
    category: "software",
    planned: 5000,
    actual: 800,
    notes: "Product videos, screenshots, and website asset preparation",
  });

  addBudgetItem(project.id, {
    name: "Commerce and launch tooling",
    category: "software",
    planned: 4000,
    actual: 600,
    notes: "Storefront, analytics, and post-launch monitoring tools",
  });

  addBudgetItem(project.id, {
    name: "Contingency reserve",
    category: "equipment",
    planned: 5000,
    actual: 0,
    notes: "Buffer for unexpected pre-launch or post-launch issues",
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
