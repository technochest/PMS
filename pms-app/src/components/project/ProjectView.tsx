"use client";

import React, { useState } from "react";
import { Project, Task, Milestone, Resource, BudgetItem, TaskStatus } from "@/lib/types";
import { Tabs, Button, Badge, ProgressBar, Card } from "@/components/ui";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { GanttChart } from "@/components/gantt/GanttChart";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskForm, TaskDetail } from "@/components/tasks/TaskForm";
import { MilestoneManagement } from "@/components/milestones/MilestoneManagement";
import { ResourceManagement } from "@/components/resources/ResourceManagement";
import { BudgetManagement } from "@/components/budget/BudgetManagement";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { formatDate, getStatusColor, getPriorityColor, calculateProjectProgress } from "@/lib/utils";
import {
  LayoutDashboard,
  GanttChartSquare,
  Kanban,
  ListTodo,
  Diamond,
  Users,
  DollarSign,
  Calendar,
  Target,
  Clock,
  Settings,
  MessageSquare,
} from "lucide-react";

type TabId = "dashboard" | "gantt" | "kanban" | "tasks" | "milestones" | "resources" | "budget" | "comments";

interface ProjectViewProps {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  resources: Resource[];
  budgetItems: BudgetItem[];
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddTask: (data: any) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onAddMilestone: (data: any) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
  onCompleteMilestone: (id: string) => void;
  onAddResource: (data: any) => void;
  onUpdateResource: (id: string, updates: Partial<Resource>) => void;
  onDeleteResource: (id: string) => void;
  onAddBudgetItem: (data: any) => void;
  onUpdateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteBudgetItem: (id: string) => void;
}

const tabs = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "gantt" as TabId, label: "Gantt Chart", icon: <GanttChartSquare className="w-4 h-4" /> },
  { id: "kanban" as TabId, label: "Kanban", icon: <Kanban className="w-4 h-4" /> },
  { id: "tasks" as TabId, label: "Tasks", icon: <ListTodo className="w-4 h-4" /> },
  { id: "milestones" as TabId, label: "Milestones", icon: <Diamond className="w-4 h-4" /> },
  { id: "resources" as TabId, label: "Resources", icon: <Users className="w-4 h-4" /> },
  { id: "budget" as TabId, label: "Budget", icon: <DollarSign className="w-4 h-4" /> },
  { id: "comments" as TabId, label: "Comments", icon: <MessageSquare className="w-4 h-4" /> },
];

export function ProjectView({
  project,
  tasks,
  milestones,
  resources,
  budgetItems,
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onCompleteMilestone,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onAddBudgetItem,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
}: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus>("todo");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const projectProgress = calculateProjectProgress(tasks);

  const handleAddTask = (status: TaskStatus) => {
    setTaskFormStatus(status);
    setIsTaskFormOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            project={project}
            tasks={tasks}
            milestones={milestones}
            budgetItems={budgetItems}
          />
        );

      case "gantt":
        return (
          <GanttChart
            tasks={tasks}
            milestones={milestones}
            projectStartDate={new Date(project.startDate)}
            projectEndDate={new Date(project.endDate)}
            onTaskClick={handleTaskClick}
          />
        );

      case "kanban":
        return (
          <KanbanBoard
            tasks={tasks}
            onTaskMove={onMoveTask}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
          />
        );

      case "tasks":
        return (
          <TaskListView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onAddTask={() => setIsTaskFormOpen(true)}
          />
        );

      case "milestones":
        return (
          <MilestoneManagement
            milestones={milestones}
            projectId={project.id}
            onAddMilestone={onAddMilestone}
            onUpdateMilestone={onUpdateMilestone}
            onDeleteMilestone={onDeleteMilestone}
            onCompleteMilestone={onCompleteMilestone}
          />
        );

      case "resources":
        return (
          <ResourceManagement
            resources={resources}
            allocations={[]}
            tasks={tasks}
            onAddResource={onAddResource}
            onUpdateResource={onUpdateResource}
            onDeleteResource={onDeleteResource}
          />
        );

      case "budget":
        return (
          <BudgetManagement
            budgetItems={budgetItems}
            totalBudget={project.budget}
            onAddItem={onAddBudgetItem}
            onUpdateItem={onUpdateBudgetItem}
            onDeleteItem={onDeleteBudgetItem}
          />
        );

      case "comments":
        return (
          <div className="p-6">
            <CommentsSection
              entityType="project"
              entityId={project.id}
              title="Project Comments & Notes"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${getPriorityColor(
                  project.priority
                )}`}
              >
                {project.priority}
              </span>
            </div>

            {project.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>
            )}

            <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {tasks.length} Tasks
              </span>
              <span className="flex items-center gap-1">
                <Diamond className="w-4 h-4" />
                {milestones.length} Milestones
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <span className="text-sm text-gray-500">Overall Progress</span>
              <p className="text-2xl font-bold text-gray-900">{projectProgress}%</p>
            </div>
            <div className="w-48">
              <ProgressBar value={projectProgress} size="md" />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      </div>

      {/* Tab Content */}
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {renderTabContent()}
      </main>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={onAddTask}
        projectId={project.id}
        initialStatus={taskFormStatus}
      />

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={(updates) => {
            onUpdateTask(selectedTask.id, updates);
            setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          onDelete={() => {
            onDeleteTask(selectedTask.id);
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

// Task List View Component
interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

function TaskListView({ tasks, onTaskClick, onAddTask }: TaskListViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">All Tasks</h2>
        <Button onClick={onAddTask} leftIcon={<ListTodo className="w-4 h-4" />}>
          Add Task
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Task</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{task.name}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(task.endDate)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <ProgressBar value={task.progress} size="sm" />
                      </div>
                      <span className="text-sm text-gray-500">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.actualHours}/{task.estimatedHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ListTodo className="w-12 h-12 mx-auto mb-4" />
              <p>No tasks yet</p>
              <Button className="mt-4" onClick={onAddTask}>
                Create First Task
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ProjectView;
