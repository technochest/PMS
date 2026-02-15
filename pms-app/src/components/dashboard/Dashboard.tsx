"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardHeader, CardContent, Badge, ProgressBar } from "@/components/ui";
import { Project, Task, Milestone, BudgetItem } from "@/lib/types";
import { formatCurrency, formatPercent, isOverdue, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
} from "lucide-react";

interface DashboardProps {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  budgetItems: BudgetItem[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function Dashboard({
  project,
  tasks,
  milestones,
  budgetItems,
}: DashboardProps) {
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const overdueTasks = tasks.filter(
    (t) => isOverdue(t.endDate) && t.status !== "done"
  ).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const upcomingMilestones = milestones.filter(
    (m) => !m.completed && new Date(m.dueDate) >= new Date()
  ).length;

  const totalBudget = project.budget;
  const spentBudget = budgetItems.reduce((sum, item) => sum + item.actual, 0);
  const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);

  // Task status distribution for pie chart
  const taskStatusData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "todo").length, color: "#6B7280" },
    { name: "In Progress", value: inProgressTasks, color: "#3B82F6" },
    { name: "Review", value: tasks.filter((t) => t.status === "review").length, color: "#8B5CF6" },
    { name: "Done", value: completedTasks, color: "#10B981" },
  ].filter((d) => d.value > 0);

  // Priority distribution
  const priorityData = [
    { name: "Critical", value: tasks.filter((t) => t.priority === "critical").length, color: "#EF4444" },
    { name: "High", value: tasks.filter((t) => t.priority === "high").length, color: "#F97316" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length, color: "#F59E0B" },
    { name: "Low", value: tasks.filter((t) => t.priority === "low").length, color: "#10B981" },
  ].filter((d) => d.value > 0);

  // Budget breakdown
  const budgetByCategory = budgetItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.actual;
    return acc;
  }, {} as Record<string, number>);

  const budgetChartData = Object.entries(budgetByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Determine project health
  const getProjectHealth = () => {
    if (overdueTasks > totalTasks * 0.2 || budgetUtilization > 100) {
      return { status: "critical", color: "text-red-600", bg: "bg-red-100" };
    }
    if (overdueTasks > 0 || budgetUtilization > 80) {
      return { status: "at-risk", color: "text-yellow-600", bg: "bg-yellow-100" };
    }
    return { status: "on-track", color: "text-green-600", bg: "bg-green-100" };
  };

  const health = getProjectHealth();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercent(completionRate)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <ProgressBar value={completionRate} size="sm" className="mt-3" />
          <p className="text-xs text-gray-500 mt-2">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </Card>

        {/* Overdue Tasks */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{overdueTasks}</p>
            </div>
            <div className={`p-3 rounded-lg ${overdueTasks > 0 ? "bg-red-100" : "bg-gray-100"}`}>
              <AlertTriangle className={`w-6 h-6 ${overdueTasks > 0 ? "text-red-600" : "text-gray-400"}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {overdueTasks > 0 ? (
              <span className="text-xs text-red-600 font-medium">
                Requires attention
              </span>
            ) : (
              <span className="text-xs text-green-600 font-medium">
                All tasks on schedule
              </span>
            )}
          </div>
        </Card>

        {/* Budget Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(spentBudget)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${budgetUtilization > 80 ? "bg-yellow-100" : "bg-blue-100"}`}>
              <DollarSign className={`w-6 h-6 ${budgetUtilization > 80 ? "text-yellow-600" : "text-blue-600"}`} />
            </div>
          </div>
          <ProgressBar value={budgetUtilization} size="sm" className="mt-3" />
          <p className="text-xs text-gray-500 mt-2">
            of {formatCurrency(totalBudget)} total budget
          </p>
        </Card>

        {/* Project Health */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Project Health</p>
              <p className={`text-2xl font-bold capitalize ${health.color}`}>
                {health.status.replace("-", " ")}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${health.bg}`}>
              <Activity className={`w-6 h-6 ${health.color}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {upcomingMilestones} upcoming milestones
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Task Status Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Tasks by Priority</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget and Hours Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget by Category */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Budget by Category</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {budgetChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No budget data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hours Summary */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Hours Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Estimated Hours</span>
                  <span className="font-medium">{totalEstimatedHours}h</span>
                </div>
                <ProgressBar value={100} size="md" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Actual Hours</span>
                  <span className="font-medium">{totalActualHours}h</span>
                </div>
                <ProgressBar
                  value={totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0}
                  size="md"
                />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Variance</span>
                  <span
                    className={`font-medium ${
                      totalActualHours <= totalEstimatedHours
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {totalActualHours <= totalEstimatedHours ? (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        {totalEstimatedHours - totalActualHours}h under
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {totalActualHours - totalEstimatedHours}h over
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones Timeline */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Milestones Timeline</h3>
        </CardHeader>
        <CardContent>
          {milestones.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {milestones
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                  )
                  .map((milestone) => {
                    const isPast = new Date(milestone.dueDate) < new Date();
                    const isOverdueMilestone = isPast && !milestone.completed;

                    return (
                      <div key={milestone.id} className="relative pl-10">
                        <div
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                            milestone.completed
                              ? "bg-green-500 border-green-500"
                              : isOverdueMilestone
                              ? "bg-red-500 border-red-500"
                              : "bg-white border-gray-300"
                          }`}
                        />
                        <div
                          className={`p-3 rounded-lg border ${
                            milestone.completed
                              ? "bg-green-50 border-green-200"
                              : isOverdueMilestone
                              ? "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {milestone.name}
                            </span>
                            <span
                              className={`text-sm ${
                                milestone.completed
                                  ? "text-green-600"
                                  : isOverdueMilestone
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatDate(milestone.dueDate)}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No milestones defined
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
