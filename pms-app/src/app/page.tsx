"use client";

import React, { useState, useEffect, useCallback } from "react";
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

const chartTraderQaTasks = [
  {
    name: "CTP-001 Planner should allow chart placement and deploy-only submit flow",
    description:
      "Implemented planner placement with Ctrl+Left Click and kept Deploy as submit action. Test: Enable Planner, Ctrl+Left Click sets Entry/Stop/Target lines, drag lines, click Deploy to submit.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-002 Planner entry constraints by trade direction",
    description:
      "Added directional guard: Long entry must be <= current price; Short entry must be >= current price. Test: Long bias above market rejects/below accepts, inverse for Short.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-003 Planner should not force Stop Limit",
    description:
      "Deploy path changed to use Limit entry at planned price. Test: verify Deploy sends Limit order at planned price when planner entry is away from market.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-004 ATM chart-click and one-click orders no Initialize Pending",
    description:
      "ATM entry flow changed to submit entry first then call StartAtmStrategy. Test: Buy/Sell via chart click and one-click with ATM template and verify no Initialize Pending stall.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-005 Apply ATM with empty manual stop and target",
    description:
      "Added fallback to ATM-derived default stop/target distances when manual fields are empty. Test: open position, ATM selected, empty manual fields, click Apply ATM.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-006 Remaining OCO leg cancels when position closes",
    description:
      "Repaired OCO monitor and added protective-order cancellation when flat. Test: open with stop+target, close manually, verify remaining leg cancels.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-007 Risk and reward zones update immediately after fill",
    description:
      "Added throttled OnMarketData refresh so zones update immediately after fills. Test: fill position and verify zones appear without waiting for bar close.",
    status: "todo",
    priority: "medium",
  },
  {
    name: "CTP-008 Stocks exit pricing for Price and Currency",
    description:
      "Cleaned exit-price conversion: Price uses absolute values, Currency converts from position average using point value. Test both stock scenarios.",
    status: "todo",
    priority: "high",
  },
  {
    name: "CTP-009 Release packaging rebuild and output validation",
    description:
      "Ran full release pipeline and validated Basic/Essential/Professional final ZIP outputs. Test package timestamps and NinjaTrader import with latest ZIP.",
    status: "done",
    priority: "medium",
  },
  {
    name: "CTP-010 Apply ATM for ATM and non-ATM workflows",
    description:
      "Restored fallback behavior so Apply ATM attempts template attach then creates non-ATM protective orders when needed. Test ATM success, ATM fail fallback, and no-template with manual values.",
    status: "todo",
    priority: "high",
  },
];

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
    setProjects,
    setTasks,
    setMilestones,
    setResources,
    setBudgetItems,
    addProject: addProjectLocal,
    updateProject: updateProjectLocal,
    deleteProject: deleteProjectLocal,
    addTask: addTaskLocal,
    updateTask: updateTaskLocal,
    deleteTask: deleteTaskLocal,
    moveTask: moveTaskLocal,
    addMilestone: addMilestoneLocal,
    updateMilestone: updateMilestoneLocal,
    deleteMilestone: deleteMilestoneLocal,
    completeMilestone: completeMilestoneLocal,
    addResource: addResourceLocal,
    updateResource: updateResourceLocal,
    deleteResource: deleteResourceLocal,
    addBudgetItem: addBudgetItemLocal,
    updateBudgetItem: updateBudgetItemLocal,
    deleteBudgetItem: deleteBudgetItemLocal,
  } = useProjectStore();

  const { isAuthenticated, currentUser, logout, initializeDefaults } = useAdminStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>("home");

  const hydrateFromDatabase = useCallback(async () => {
    const [projectsResponse, resourcesResponse] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/resources"),
    ]);

    if (!projectsResponse.ok) {
      throw new Error("Failed to load projects");
    }

    const projectsPayload = await projectsResponse.json();
    const dbProjects = Array.isArray(projectsPayload?.projects)
      ? projectsPayload.projects
      : [];

    const mappedProjects = dbProjects.map((project: any) => ({
      ...project,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      businessRequirementDate: project.businessRequirementDate
        ? new Date(project.businessRequirementDate)
        : null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }));

    const mappedTasks = dbProjects.flatMap((project: any) =>
      (project.tasks || []).map((task: any) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }))
    );

    const mappedMilestones = dbProjects.flatMap((project: any) =>
      (project.milestones || []).map((milestone: any) => ({
        ...milestone,
        dueDate: new Date(milestone.dueDate),
        completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
        createdAt: new Date(milestone.createdAt),
        updatedAt: new Date(milestone.updatedAt),
      }))
    );

    const mappedBudgetItems = dbProjects.flatMap((project: any) =>
      (project.budgetItems || []).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
    );

    let mappedResources: any[] = [];
    if (resourcesResponse.ok) {
      const resourcesPayload = await resourcesResponse.json();
      mappedResources = Array.isArray(resourcesPayload?.resources)
        ? resourcesPayload.resources.map((resource: any) => ({
            ...resource,
            createdAt: new Date(resource.createdAt),
            updatedAt: new Date(resource.updatedAt),
          }))
        : [];
    }

    setProjects(mappedProjects);
    setTasks(mappedTasks);
    setMilestones(mappedMilestones);
    setBudgetItems(mappedBudgetItems);
    setResources(mappedResources);

    if (mappedProjects.length > 0) {
      selectProject(mappedProjects[0].id);
    } else {
      selectProject(null);
    }
  }, [selectProject, setBudgetItems, setMilestones, setProjects, setResources, setTasks]);

  const seedChartTraderProject = useCallback(async () => {
    const createProjectResponse = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "ChartTrader Launch",
        description:
          "Plan, test, and launch ChartTrader on the website with clear test and launch milestones.",
        status: "active",
        priority: "high",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 35000,
        color: "#0EA5E9",
      }),
    });

    if (!createProjectResponse.ok) {
      throw new Error("Failed to create ChartTrader launch project");
    }

    const { project } = await createProjectResponse.json();
    const projectId = project.id;

    const milestonesToCreate = [
      {
        name: "Milestone 1: Launch plan approved",
        description: "Scope, owners, launch date target, and success criteria are confirmed.",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        color: "#10B981",
      },
      {
        name: "Milestone 2: Website content and purchase flow ready",
        description: "Product page, media assets, checkout, and license delivery flow are validated.",
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        color: "#3B82F6",
      },
      {
        name: "Milestone 3: QA sign-off",
        description: "Testing complete with blockers resolved and launch recommendation documented.",
        dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
        color: "#8B5CF6",
      },
      {
        name: "Milestone 4: Production launch",
        description: "ChartTrader is live on the website with monitoring and support coverage in place.",
        dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
        color: "#F59E0B",
      },
    ];

    const milestoneResponses = await Promise.all(
      milestonesToCreate.map((milestone) =>
        fetch("/api/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...milestone, projectId }),
        })
      )
    );

    const createdMilestones = await Promise.all(
      milestoneResponses.map(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to create milestone during project seed");
        }
        const payload = await response.json();
        return payload.milestone;
      })
    );

    const qaMilestone =
      createdMilestones.find((milestone: any) => milestone.name.includes("Milestone 3")) ||
      createdMilestones[2];

    if (qaMilestone?.id) {
      await Promise.all(
        chartTraderQaTasks.map((task) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...task,
              progress: task.status === "done" ? 100 : 0,
              estimatedHours: 2,
              projectId,
              milestoneId: qaMilestone.id,
              startDate: new Date().toISOString(),
              endDate: new Date(qaMilestone.dueDate).toISOString(),
            }),
          })
        )
      );
    }

    await hydrateFromDatabase();
  }, [hydrateFromDatabase]);

  const ensureChartTraderQaTasks = useCallback(async () => {
    const state = useProjectStore.getState();
    const chartTraderProject = state.projects.find((project) => project.name === "ChartTrader Launch");

    if (!chartTraderProject) {
      return;
    }

    const qaMilestone = state.milestones.find(
      (milestone) =>
        milestone.projectId === chartTraderProject.id &&
        milestone.name.includes("Milestone 3")
    );

    if (!qaMilestone) {
      return;
    }

    const existingTaskNames = new Set(
      state.tasks
        .filter(
          (task) =>
            task.projectId === chartTraderProject.id &&
            task.milestoneId === qaMilestone.id
        )
        .map((task) => task.name)
    );

    const tasksToCreate = chartTraderQaTasks.filter(
      (task) => !existingTaskNames.has(task.name)
    );

    if (tasksToCreate.length === 0) {
      return;
    }

    await Promise.all(
      tasksToCreate.map((task) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...task,
            progress: task.status === "done" ? 100 : 0,
            estimatedHours: 2,
            projectId: chartTraderProject.id,
            milestoneId: qaMilestone.id,
            startDate: new Date().toISOString(),
            endDate: new Date(qaMilestone.dueDate).toISOString(),
          }),
        })
      )
    );

    await hydrateFromDatabase();
  }, [hydrateFromDatabase]);

  const createProject = useCallback(
    async (input: any) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          startDate: input.startDate ? new Date(input.startDate).toISOString() : undefined,
          endDate: input.endDate ? new Date(input.endDate).toISOString() : undefined,
          businessRequirementDate: input.businessRequirementDate
            ? new Date(input.businessRequirementDate).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const project = payload.project;
      selectProject(project.id);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, selectProject]
  );

  const handleUpdateProject = useCallback(
    async (id: string, updates: any) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          startDate: updates.startDate
            ? new Date(updates.startDate).toISOString()
            : undefined,
          endDate: updates.endDate ? new Date(updates.endDate).toISOString() : undefined,
          businessRequirementDate: updates.businessRequirementDate
            ? new Date(updates.businessRequirementDate).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        return;
      }

      updateProjectLocal(id, updates);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, updateProjectLocal]
  );

  const handleDeleteProject = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      deleteProjectLocal(id);
      await hydrateFromDatabase();
    },
    [deleteProjectLocal, hydrateFromDatabase]
  );

  const handleAddTask = useCallback(
    async (input: any) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          startDate: new Date(input.startDate).toISOString(),
          endDate: new Date(input.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        return;
      }

      await hydrateFromDatabase();
    },
    [hydrateFromDatabase]
  );

  const handleUpdateTask = useCallback(
    async (id: string, updates: any) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          startDate: updates.startDate
            ? new Date(updates.startDate).toISOString()
            : undefined,
          endDate: updates.endDate ? new Date(updates.endDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        return;
      }

      updateTaskLocal(id, updates);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, updateTaskLocal]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      deleteTaskLocal(id);
      await hydrateFromDatabase();
    },
    [deleteTaskLocal, hydrateFromDatabase]
  );

  const handleMoveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      await handleUpdateTask(taskId, {
        status: newStatus,
        progress: newStatus === "done" ? 100 : newStatus === "in-progress" ? 50 : 0,
      });
    },
    [handleUpdateTask]
  );

  const handleAddMilestone = useCallback(
    async (input: any) => {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          dueDate: new Date(input.dueDate).toISOString(),
        }),
      });

      if (!response.ok) {
        return;
      }

      await hydrateFromDatabase();
    },
    [hydrateFromDatabase]
  );

  const handleUpdateMilestone = useCallback(
    async (id: string, updates: any) => {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined,
          completedAt: updates.completedAt
            ? new Date(updates.completedAt).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        return;
      }

      updateMilestoneLocal(id, updates);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, updateMilestoneLocal]
  );

  const handleDeleteMilestone = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/milestones/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      deleteMilestoneLocal(id);
      await hydrateFromDatabase();
    },
    [deleteMilestoneLocal, hydrateFromDatabase]
  );

  const handleCompleteMilestone = useCallback(
    async (id: string) => {
      await handleUpdateMilestone(id, {
        completed: true,
        completedAt: new Date(),
      });
    },
    [handleUpdateMilestone]
  );

  const handleAddResource = useCallback(
    async (input: any) => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          skills: input.skills ? JSON.stringify(input.skills) : null,
        }),
      });

      if (!response.ok) {
        return;
      }

      await hydrateFromDatabase();
    },
    [hydrateFromDatabase]
  );

  const handleUpdateResource = useCallback(
    async (id: string, updates: any) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          skills: Array.isArray(updates.skills)
            ? JSON.stringify(updates.skills)
            : updates.skills,
        }),
      });

      if (!response.ok) {
        return;
      }

      updateResourceLocal(id, updates);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, updateResourceLocal]
  );

  const handleDeleteResource = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/resources/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      deleteResourceLocal(id);
      await hydrateFromDatabase();
    },
    [deleteResourceLocal, hydrateFromDatabase]
  );

  const handleAddBudgetItem = useCallback(
    async (projectId: string, input: any) => {
      const response = await fetch("/api/budget-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          projectId,
        }),
      });

      if (!response.ok) {
        return;
      }

      addBudgetItemLocal(projectId, input);
      await hydrateFromDatabase();
    },
    [addBudgetItemLocal, hydrateFromDatabase]
  );

  const handleUpdateBudgetItem = useCallback(
    async (id: string, updates: any) => {
      const response = await fetch(`/api/budget-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        return;
      }

      updateBudgetItemLocal(id, updates);
      await hydrateFromDatabase();
    },
    [hydrateFromDatabase, updateBudgetItemLocal]
  );

  const handleDeleteBudgetItem = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/budget-items/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      deleteBudgetItemLocal(id);
      await hydrateFromDatabase();
    },
    [deleteBudgetItemLocal, hydrateFromDatabase]
  );

  // Initialize admin store defaults
  useEffect(() => {
    initializeDefaults();
  }, []);

  // Initialize with demo data if empty (only after authenticated)
  useEffect(() => {
    if (!isAuthenticated || isInitialized) {
      return;
    }

    const run = async () => {
      try {
        await hydrateFromDatabase();
        if (useProjectStore.getState().projects.length === 0) {
          await seedChartTraderProject();
        }
        await ensureChartTraderQaTasks();
      } catch (error) {
        console.error("Project initialization error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    run();
  }, [ensureChartTraderQaTasks, hydrateFromDatabase, isAuthenticated, isInitialized, seedChartTraderProject]);

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
            onUpdateProject={(updates) => handleUpdateProject(selectedProject.id, updates)}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
            onAddMilestone={handleAddMilestone}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onCompleteMilestone={handleCompleteMilestone}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
            onAddBudgetItem={(data) => handleAddBudgetItem(selectedProject.id, data)}
            onUpdateBudgetItem={handleUpdateBudgetItem}
            onDeleteBudgetItem={handleDeleteBudgetItem}
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
                    createProject({
                      name: "New Project",
                      description: "Project description",
                      startDate: new Date(),
                      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
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
          onAddProject={createProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
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
