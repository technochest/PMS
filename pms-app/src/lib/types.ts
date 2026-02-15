// Core type definitions for the Project Management System

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "critical";
export type DependencyType = "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish";
export type RiskStatus = "open" | "mitigating" | "resolved" | "closed";
export type RiskLevel = "low" | "medium" | "high";
export type BudgetCategory = "labor" | "materials" | "equipment" | "software" | "travel" | "other";
export type QueueLevel = 0 | 1 | 2 | 3 | 4;
export type ActionStatus = "pending" | "in-progress" | "completed";
export type ImpactLevel = "low" | "medium" | "high" | "critical";
export type IntegrationDirection = "inbound" | "outbound" | "bidirectional";

// Category constants
export const PROJECT_CATEGORIES = [
  "NetSuite",
  "MRP",
  "Reporting",
  "Specs",
  "TMS",
  "Harmonization",
  "EDI",
  "Cost Reduction",
  "Creative",
  "D&A",
  "Ecomm",
  "3PL"
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

// ============================================
// USER MANAGEMENT & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: UserRole[];
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string; // JSON array of permissions
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  users?: UserRole[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  user?: User;
  role?: Role;
}

export interface Session {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userId: string;
  user?: User;
}

// Permission types
export type Permission =
  | "admin:all"
  | "users:read"
  | "users:write"
  | "users:delete"
  | "roles:read"
  | "roles:write"
  | "roles:delete"
  | "projects:read"
  | "projects:write"
  | "projects:delete"
  | "tasks:read"
  | "tasks:write"
  | "tasks:delete"
  | "entities:read"
  | "entities:write"
  | "entities:delete"
  | "departments:read"
  | "departments:write"
  | "departments:delete"
  | "categories:read"
  | "categories:write"
  | "categories:delete";

// ============================================
// ORGANIZATIONAL STRUCTURE
// ============================================

export interface Entity {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
  departments?: Department[];
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  entityId?: string | null;
  entity?: Entity | null;
  projects?: Project[];
}

export interface Category {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
}

export interface Application {
  id: string;
  name: string;
  description?: string | null;
  vendor?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  projects?: ProjectApplication[];
}

export interface Integration {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  projects?: ProjectIntegration[];
}

// ============================================
// PROJECTS (ENHANCED)
// ============================================

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: Priority;
  queue: QueueLevel;
  startDate: Date;
  endDate: Date;
  businessRequirementDate?: Date | null;
  budget: number;
  spentBudget: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  // Organization
  entityId?: string | null;
  entity?: Entity | null;
  departmentId?: string | null;
  department?: Department | null;
  categoryId?: string | null;
  category?: Category | null;
  // Users
  projectLeadId?: string | null;
  projectLead?: User | null;
  createdById?: string | null;
  createdBy?: User | null;
  // Related data
  tasks?: Task[];
  milestones?: Milestone[];
  resources?: ResourceAllocation[];
  budgetItems?: BudgetItem[];
  risks?: Risk[];
  notes?: Note[];
  projectNotes?: ProjectNote[];
  applications?: ProjectApplication[];
  integrations?: ProjectIntegration[];
  attachments?: Attachment[];
  chatMessages?: ChatMessage[];
}

export interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate: Date;
  endDate: Date;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
  parentId?: string | null;
  parent?: Task | null;
  subtasks?: Task[];
  milestoneId?: string | null;
  milestone?: Milestone | null;
  assigneeId?: string | null;
  assignee?: Resource | null;
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  timeEntries?: TimeEntry[];
  comments?: Comment[];
  tags?: TaskTag[];
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  dependencyTaskId: string;
  type: DependencyType;
  lagDays: number;
  dependentTask?: Task;
  dependencyTask?: Task;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
  tasks?: Task[];
}

export interface Resource {
  id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
  avatar?: string | null;
  department?: string | null;
  skills?: string | null;
  availability: number;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  allocations?: ResourceAllocation[];
  timeEntries?: TimeEntry[];
}

export interface ResourceAllocation {
  id: string;
  startDate: Date;
  endDate: Date;
  hoursPerDay: number;
  allocation: number;
  projectId: string;
  project?: Project;
  resourceId: string;
  resource?: Resource;
}

export interface BudgetItem {
  id: string;
  name: string;
  category: BudgetCategory;
  planned: number;
  actual: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
}

export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description?: string | null;
  billable: boolean;
  createdAt: Date;
  taskId: string;
  task?: Task;
  resourceId: string;
  resource?: Resource;
}

// Note: The Comment interface has been moved to the UNIFIED COMMENT SYSTEM section below

export interface Tag {
  id: string;
  name: string;
  color: string;
  tasks?: TaskTag[];
}

export interface TaskTag {
  taskId: string;
  tagId: string;
  task?: Task;
  tag?: Tag;
}

export interface Risk {
  id: string;
  title: string;
  description?: string | null;
  probability: RiskLevel;
  impact: RiskLevel;
  status: RiskStatus;
  mitigation?: string | null;
  owner?: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
}

// ============================================
// PROJECT ENHANCED FEATURES
// ============================================

export interface ProjectNote {
  id: string;
  content: string;
  isActionItem: boolean;
  actionDueDate?: Date | null;
  actionStatus?: ActionStatus | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
  authorId: string;
  author?: User;
}

export interface ProjectApplication {
  projectId: string;
  applicationId: string;
  impactLevel?: ImpactLevel | null;
  notes?: string | null;
  createdAt: Date;
  project?: Project;
  application?: Application;
}

export interface ProjectIntegration {
  projectId: string;
  integrationId: string;
  direction?: IntegrationDirection | null;
  notes?: string | null;
  createdAt: Date;
  project?: Project;
  integration?: Integration;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string | null;
  createdAt: Date;
  projectId: string;
  project?: Project;
  uploadedById: string;
  uploadedBy?: User;
}

export interface ChatMessage {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: Project;
  authorId: string;
  author?: User;
  parentId?: string | null;
  parent?: ChatMessage | null;
  replies?: ChatMessage[];
}

export interface ProjectComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  authorId: string;
  author?: User;
}

// Gantt Chart specific types
export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  color: string;
  type: "task" | "milestone" | "project";
  parentId?: string;
  collapsed?: boolean;
}

export interface GanttViewOptions {
  viewMode: "day" | "week" | "month" | "quarter" | "year";
  showDependencies: boolean;
  showProgress: boolean;
  showMilestones: boolean;
  showToday: boolean;
}

// Dashboard Analytics types
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  upcomingMilestones: number;
  budgetUtilization: number;
  resourceUtilization: number;
  projectHealth: "good" | "at-risk" | "critical";
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: "task-start" | "task-end" | "milestone" | "deadline";
  projectId: string;
  taskId?: string;
  milestoneId?: string;
}

// Form input types
export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  queue?: QueueLevel;
  startDate: Date;
  endDate: Date;
  businessRequirementDate?: Date;
  budget?: number;
  color?: string;
  entityId?: string;
  departmentId?: string;
  categoryId?: string;
  projectLeadId?: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  startDate: Date;
  endDate: Date;
  estimatedHours?: number;
  projectId: string;
  parentId?: string;
  milestoneId?: string;
  assigneeId?: string;
}

export interface CreateMilestoneInput {
  name: string;
  description?: string;
  dueDate: Date;
  color?: string;
  projectId: string;
}

export interface CreateResourceInput {
  name: string;
  email: string;
  role: string;
  hourlyRate?: number;
  department?: string;
  skills?: string[];
  availability?: number;
}

// ============================================
// USER & ADMIN INPUT TYPES
// ============================================

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface CreateEntityInput {
  name: string;
  code?: string;
  description?: string;
}

export interface CreateDepartmentInput {
  name: string;
  code?: string;
  description?: string;
  entityId?: string;
}

export interface CreateCategoryInput {
  name: string;
  code?: string;
  description?: string;
  color?: string;
}

export interface CreateApplicationInput {
  name: string;
  description?: string;
  vendor?: string;
}

export interface CreateIntegrationInput {
  name: string;
  type?: string;
  description?: string;
}

export interface CreateProjectNoteInput {
  content: string;
  isActionItem?: boolean;
  actionDueDate?: Date;
  projectId: string;
}

export interface CreateChatMessageInput {
  content: string;
  projectId: string;
  parentId?: string;
}

export interface CreateAttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  projectId: string;
}

// ============================================
// UNIFIED COMMENT SYSTEM
// ============================================

export type CommentEntityType = "project" | "task" | "milestone";

export interface Comment {
  id: string;
  content: string;
  entityType: CommentEntityType;
  entityId: string;
  authorId: string;
  author?: User;
  parentId?: string | null;
  parent?: Comment;
  replies?: Comment[];
  mentions?: UserMention[];
  attachments?: CommentAttachment[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMention {
  id: string;
  commentId: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface CommentAttachment {
  id: string;
  commentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string; // Base64 or URL
  createdAt: Date;
}

export interface CreateCommentInput {
  content: string;
  entityType: CommentEntityType;
  entityId: string;
  parentId?: string;
  mentionedUserIds?: string[];
  attachments?: CreateCommentAttachmentInput[];
}

export interface CreateCommentAttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

// ============================================
// TICKETING SYSTEM
// ============================================

export type TicketStatus = "open" | "in-progress" | "waiting" | "resolved" | "closed";
export type TicketType = "task" | "issue" | "request" | "inquiry" | "update";
export type TicketPhase = "not-started" | "in-progress" | "review" | "complete";
export type TicketTracking = "on-track" | "off-track" | "at-risk";
export type TicketSource = "email" | "manual" | "integration" | "phone" | "chat";

export const TICKET_CATEGORIES = [
  "Integration",
  "Reporting",
  "System",
  "Access",
  "Human Error",
  "System Error",
  "EDI",
  "Inventory",
  "Other"
] as const;

export type TicketCategory = typeof TICKET_CATEGORIES[number];

export const TICKET_APPLICATIONS = [
  "NetSuite",
  "Tipalti",
  "Celigo",
  "Shopify",
  "PaceJet",
  "Amazon",
  "Zest",
  "BlackLine",
  "Other"
] as const;

export type TicketApplication = typeof TICKET_APPLICATIONS[number];

export const TICKET_INTEGRATIONS = [
  "Not Applicable",
  "Zest -> Shopify NetSuite",
  "Shopify -> NetSuite",
  "NetSuite PaceJet",
  "Amazon Vendor Central",
  "EDI",
  "ODBC",
  "Other"
] as const;

export type TicketIntegration = typeof TICKET_INTEGRATIONS[number];

export interface Ticket {
  id: string;
  ticketNumber: number;
  type: TicketType;
  title: string;
  summary?: string | null;
  rootCause?: string | null;
  
  // Email source info
  emailSubject?: string | null;
  emailConversation?: string | null;
  emailFrom?: string | null;
  emailTo?: string | null;
  emailCc?: string | null;
  source: TicketSource;
  
  // Dates
  dateRequested: Date;
  expectedEndDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  
  // Organization
  ventureName?: string | null;
  department?: string | null;
  
  // People
  requestorName?: string | null;
  requestorEmail?: string | null;
  requestorManager?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  leadId?: string | null;
  lead?: User | null;
  contractors?: string | null;
  
  // Status & Tracking
  status: TicketStatus;
  priority: Priority;
  queue: number;
  tracking: TicketTracking;
  phase: TicketPhase;
  percentComplete: number;
  
  // Classification
  category: TicketCategory;
  application?: TicketApplication | null;
  integration?: TicketIntegration | null;
  
  // Related project
  projectId?: string | null;
  project?: Project | null;
  
  // Additional info
  attachments?: string | null;
  notes?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketInput {
  type: TicketType;
  title: string;
  summary?: string;
  rootCause?: string;
  emailSubject?: string;
  emailConversation?: string;
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string;
  source?: TicketSource;
  dateRequested?: Date;
  expectedEndDate?: Date;
  startDate?: Date;
  ventureName?: string;
  department?: string;
  requestorName?: string;
  requestorEmail?: string;
  requestorManager?: string;
  assignedToId?: string;
  leadId?: string;
  contractors?: string;
  priority?: Priority;
  queue?: number;
  category?: TicketCategory;
  application?: TicketApplication;
  integration?: TicketIntegration;
  projectId?: string;
  notes?: string;
}

// ============================================
// EMAIL MANAGEMENT
// ============================================

export type EmailStatus = "unread" | "read" | "converted" | "archived" | "ignored";
export type EmailImportance = "low" | "normal" | "high";

export interface Email {
  id: string;
  messageId: string; // Exchange/Graph API message ID
  conversationId?: string | null;
  
  // Email content
  subject: string;
  body: string;
  bodyPreview: string;
  
  // Sender/Recipients
  from: string;
  fromName?: string | null;
  to: string[];
  cc: string[];
  bcc?: string[];
  replyTo?: string | null;
  
  // Status
  status: EmailStatus;
  importance: EmailImportance;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  
  // Dates
  receivedAt: Date;
  sentAt: Date;
  
  // Ticket conversion
  convertedToTicketId?: string | null;
  ticketNumber?: number | null;
  
  // AI Analysis
  aiAnalyzed: boolean;
  aiSuggestedCategory?: string | null;
  aiSuggestedApplication?: string | null;
  aiSuggestedPriority?: Priority | null;
  aiSuggestedTitle?: string | null;
  aiSuggestedSummary?: string | null;
  aiSuggestedType?: string | null;
  
  // Metadata
  mailbox: string; // e.g., "junaid.buchal@mdlz.com" or "suitetooth@mdlz.com"
  folder: string;
  isRead: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentId?: string | null;
}

export interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  lastSyncedAt?: Date | null;
}
