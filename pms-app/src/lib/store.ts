import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  Project,
  Task,
  Milestone,
  Resource,
  BudgetItem,
  Risk,
  Note,
  ProjectStatus,
  TaskStatus,
  Priority,
  CreateProjectInput,
  CreateTaskInput,
  CreateMilestoneInput,
  CreateResourceInput,
  Comment,
  CreateCommentInput,
  CommentEntityType,
} from "./types";

interface ProjectStore {
  // State
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  resources: Resource[];
  budgetItems: BudgetItem[];
  risks: Risk[];
  notes: Note[];
  comments: Comment[];
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;

  // Project Actions
  setProjects: (projects: Project[]) => void;
  addProject: (input: CreateProjectInput) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;

  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (input: CreateTaskInput) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  reorderTasks: (projectId: string, taskIds: string[]) => void;
  selectTask: (id: string | null) => void;

  // Milestone Actions
  setMilestones: (milestones: Milestone[]) => void;
  addMilestone: (input: CreateMilestoneInput) => Milestone;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  completeMilestone: (id: string) => void;

  // Resource Actions
  setResources: (resources: Resource[]) => void;
  addResource: (input: CreateResourceInput) => Resource;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  // Budget Actions
  setBudgetItems: (items: BudgetItem[]) => void;
  addBudgetItem: (projectId: string, item: Omit<BudgetItem, "id" | "createdAt" | "updatedAt" | "projectId">) => void;
  updateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;

  // Risk Actions
  setRisks: (risks: Risk[]) => void;
  addRisk: (projectId: string, risk: Omit<Risk, "id" | "createdAt" | "updatedAt" | "projectId">) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;

  // Note Actions
  setNotes: (notes: Note[]) => void;
  addNote: (projectId: string, note: Omit<Note, "id" | "createdAt" | "updatedAt" | "projectId">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Comment Actions
  setComments: (comments: Comment[]) => void;
  addComment: (input: CreateCommentInput, authorId: string) => Comment;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  getEntityComments: (entityType: CommentEntityType, entityId: string) => Comment[];

  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getProjectTasks: (projectId: string) => Task[];
  getProjectMilestones: (projectId: string) => Milestone[];
  getTasksByStatus: (projectId: string, status: TaskStatus) => Task[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
  // Initial State
  projects: [],
  tasks: [],
  milestones: [],
  resources: [],
  budgetItems: [],
  risks: [],
  notes: [],
  comments: [],
  selectedProjectId: null,
  selectedTaskId: null,
  isLoading: false,
  error: null,

  // Project Actions
  setProjects: (projects) => set({ projects }),
  
  addProject: (input) => {
    const now = new Date();
    const project: Project = {
      id: uuidv4(),
      name: input.name,
      description: input.description || null,
      status: input.status || "planning",
      priority: input.priority || "medium",
      queue: input.queue || 0,
      startDate: input.startDate,
      endDate: input.endDate,
      businessRequirementDate: input.businessRequirementDate || null,
      budget: input.budget || 0,
      spentBudget: 0,
      color: input.color || "#3B82F6",
      createdAt: now,
      updatedAt: now,
      tasks: [],
      milestones: [],
      resources: [],
      budgetItems: [],
      risks: [],
      notes: [],
      entityId: input.entityId || null,
      departmentId: input.departmentId || null,
      categoryId: input.categoryId || null,
      projectLeadId: input.projectLeadId || null,
      createdById: null,
      entity: null,
      department: null,
      category: null,
      projectLead: null,
      createdBy: null,
      projectNotes: [],
      applications: [],
      integrations: [],
      attachments: [],
      chatMessages: [],
    };
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
      milestones: state.milestones.filter((m) => m.projectId !== id),
      budgetItems: state.budgetItems.filter((b) => b.projectId !== id),
      risks: state.risks.filter((r) => r.projectId !== id),
      notes: state.notes.filter((n) => n.projectId !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }));
  },

  selectProject: (id) => set({ selectedProjectId: id, selectedTaskId: null }),

  // Task Actions
  setTasks: (tasks) => set({ tasks }),

  addTask: (input) => {
    const now = new Date();
    const tasks = get().tasks;
    const maxOrder = tasks.filter((t) => t.projectId === input.projectId).length;
    
    const task: Task = {
      id: uuidv4(),
      name: input.name,
      description: input.description || null,
      status: input.status || "todo",
      priority: input.priority || "medium",
      startDate: input.startDate,
      endDate: input.endDate,
      progress: 0,
      estimatedHours: input.estimatedHours || 0,
      actualHours: 0,
      order: maxOrder,
      createdAt: now,
      updatedAt: now,
      projectId: input.projectId,
      parentId: input.parentId || null,
      milestoneId: input.milestoneId || null,
      assigneeId: input.assigneeId || null,
    };
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id && t.parentId !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }));
  },

  moveTask: (taskId, newStatus) => {
    const progress = newStatus === "done" ? 100 : newStatus === "in-progress" ? 50 : 0;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, progress, updatedAt: new Date() }
          : t
      ),
    }));
  },

  reorderTasks: (projectId, taskIds) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.projectId === projectId) {
          const newOrder = taskIds.indexOf(t.id);
          return newOrder !== -1 ? { ...t, order: newOrder } : t;
        }
        return t;
      }),
    }));
  },

  selectTask: (id) => set({ selectedTaskId: id }),

  // Milestone Actions
  setMilestones: (milestones) => set({ milestones }),

  addMilestone: (input) => {
    const now = new Date();
    const milestone: Milestone = {
      id: uuidv4(),
      name: input.name,
      description: input.description || null,
      dueDate: input.dueDate,
      completed: false,
      completedAt: null,
      color: input.color || "#10B981",
      createdAt: now,
      updatedAt: now,
      projectId: input.projectId,
    };
    set((state) => ({ milestones: [...state.milestones, milestone] }));
    return milestone;
  },

  updateMilestone: (id, updates) => {
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
      ),
    }));
  },

  deleteMilestone: (id) => {
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
      tasks: state.tasks.map((t) =>
        t.milestoneId === id ? { ...t, milestoneId: null } : t
      ),
    }));
  },

  completeMilestone: (id) => {
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id
          ? { ...m, completed: true, completedAt: new Date(), updatedAt: new Date() }
          : m
      ),
    }));
  },

  // Resource Actions
  setResources: (resources) => set({ resources }),

  addResource: (input) => {
    const now = new Date();
    const resource: Resource = {
      id: uuidv4(),
      name: input.name,
      email: input.email,
      role: input.role,
      hourlyRate: input.hourlyRate || 0,
      avatar: null,
      department: input.department || null,
      skills: input.skills ? JSON.stringify(input.skills) : null,
      availability: input.availability || 100,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ resources: [...state.resources, resource] }));
    return resource;
  },

  updateResource: (id, updates) => {
    set((state) => ({
      resources: state.resources.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));
  },

  deleteResource: (id) => {
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== id),
      tasks: state.tasks.map((t) =>
        t.assigneeId === id ? { ...t, assigneeId: null } : t
      ),
    }));
  },

  // Budget Actions
  setBudgetItems: (items) => set({ budgetItems: items }),

  addBudgetItem: (projectId, item) => {
    const now = new Date();
    const budgetItem: BudgetItem = {
      id: uuidv4(),
      ...item,
      projectId,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ budgetItems: [...state.budgetItems, budgetItem] }));
  },

  updateBudgetItem: (id, updates) => {
    set((state) => ({
      budgetItems: state.budgetItems.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
      ),
    }));
  },

  deleteBudgetItem: (id) => {
    set((state) => ({
      budgetItems: state.budgetItems.filter((b) => b.id !== id),
    }));
  },

  // Risk Actions
  setRisks: (risks) => set({ risks }),

  addRisk: (projectId, risk) => {
    const now = new Date();
    const newRisk: Risk = {
      id: uuidv4(),
      ...risk,
      projectId,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ risks: [...state.risks, newRisk] }));
  },

  updateRisk: (id, updates) => {
    set((state) => ({
      risks: state.risks.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));
  },

  deleteRisk: (id) => {
    set((state) => ({
      risks: state.risks.filter((r) => r.id !== id),
    }));
  },

  // Note Actions
  setNotes: (notes) => set({ notes }),

  addNote: (projectId, note) => {
    const now = new Date();
    const newNote: Note = {
      id: uuidv4(),
      ...note,
      projectId,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ notes: [...state.notes, newNote] }));
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      ),
    }));
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  // Comment Actions
  setComments: (comments) => set({ comments }),

  addComment: (input, authorId) => {
    const now = new Date();
    const comment: Comment = {
      id: uuidv4(),
      content: input.content,
      entityType: input.entityType,
      entityId: input.entityId,
      authorId,
      parentId: input.parentId || null,
      replies: [],
      mentions: input.mentionedUserIds?.map(userId => ({
        id: uuidv4(),
        commentId: "",
        userId,
        createdAt: now,
      })) || [],
      attachments: input.attachments?.map(att => ({
        id: uuidv4(),
        commentId: "",
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        fileUrl: att.fileUrl,
        createdAt: now,
      })) || [],
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    };
    // Set the commentId on mentions and attachments
    comment.mentions = comment.mentions?.map(m => ({ ...m, commentId: comment.id }));
    comment.attachments = comment.attachments?.map(a => ({ ...a, commentId: comment.id }));

    set((state) => ({ comments: [...state.comments, comment] }));
    return comment;
  },

  updateComment: (id, content) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id
          ? { ...c, content, isEdited: true, updatedAt: new Date() }
          : c
      ),
    }));
  },

  deleteComment: (id) => {
    set((state) => ({
      // Delete the comment and all its replies
      comments: state.comments.filter(
        (c) => c.id !== id && c.parentId !== id
      ),
    }));
  },

  getEntityComments: (entityType, entityId) => {
    return get().comments.filter(
      (c) => c.entityType === entityType && c.entityId === entityId
    );
  },

  // Utility Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getProjectTasks: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId);
  },

  getProjectMilestones: (projectId) => {
    return get().milestones.filter((m) => m.projectId === projectId);
  },

  getTasksByStatus: (projectId, status) => {
    return get()
      .tasks.filter((t) => t.projectId === projectId && t.status === status)
      .sort((a, b) => a.order - b.order);
  },
}),
    {
      name: "pms-project-store",
      partialize: (state) => ({
        projects: state.projects,
        tasks: state.tasks,
        milestones: state.milestones,
        resources: state.resources,
        budgetItems: state.budgetItems,
        risks: state.risks,
        notes: state.notes,
        comments: state.comments,
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
);
