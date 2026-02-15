"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  format,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWeekend,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Milestone } from "@/lib/types";
import { ChevronDown, ChevronRight, Diamond, Calendar } from "lucide-react";

type ViewMode = "day" | "week" | "month";

interface GanttChartProps {
  tasks: Task[];
  milestones: Milestone[];
  projectStartDate: Date;
  projectEndDate: Date;
  onTaskClick?: (task: Task) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void;
}

interface GanttRow {
  id: string;
  name: string;
  type: "task" | "milestone";
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  parentId?: string | null;
  isExpanded?: boolean;
  level: number;
  data: Task | Milestone;
}

export function GanttChart({
  tasks,
  milestones,
  projectStartDate,
  projectEndDate,
  onTaskClick,
  onMilestoneClick,
  onTaskUpdate,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Calculate chart dimensions
  const cellWidth = viewMode === "day" ? 40 : viewMode === "week" ? 100 : 120;
  const rowHeight = 40;
  const headerHeight = 60;
  const taskListWidth = 280;

  // Generate time units based on view mode
  const timeUnits = useMemo(() => {
    const start = new Date(projectStartDate);
    start.setDate(start.getDate() - 7); // Add buffer
    const end = new Date(projectEndDate);
    end.setDate(end.getDate() + 14); // Add buffer

    if (viewMode === "day") {
      return eachDayOfInterval({ start, end });
    } else if (viewMode === "week") {
      return eachWeekOfInterval({ start, end });
    } else {
      return eachMonthOfInterval({ start, end });
    }
  }, [projectStartDate, projectEndDate, viewMode]);

  // Prepare rows data
  const rows = useMemo(() => {
    const result: GanttRow[] = [];

    // Add tasks
    const processTask = (task: Task, level: number) => {
      const hasChildren = tasks.some((t) => t.parentId === task.id);
      const isExpanded = expandedTasks.has(task.id);

      result.push({
        id: task.id,
        name: task.name,
        type: "task",
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        progress: task.progress,
        color: getTaskColor(task.status),
        parentId: task.parentId,
        isExpanded,
        level,
        data: task,
      });

      if (hasChildren && isExpanded) {
        tasks
          .filter((t) => t.parentId === task.id)
          .sort((a, b) => a.order - b.order)
          .forEach((child) => processTask(child, level + 1));
      }
    };

    // Process root tasks
    tasks
      .filter((t) => !t.parentId)
      .sort((a, b) => a.order - b.order)
      .forEach((task) => processTask(task, 0));

    // Add milestones
    milestones.forEach((milestone) => {
      result.push({
        id: milestone.id,
        name: milestone.name,
        type: "milestone",
        startDate: new Date(milestone.dueDate),
        endDate: new Date(milestone.dueDate),
        progress: milestone.completed ? 100 : 0,
        color: milestone.color,
        level: 0,
        data: milestone,
      });
    });

    return result;
  }, [tasks, milestones, expandedTasks]);

  // Calculate bar position and width
  const calculateBarPosition = (startDate: Date, endDate: Date) => {
    const chartStart = timeUnits[0];
    const startDiff = differenceInDays(startDate, chartStart);
    const duration = differenceInDays(endDate, startDate) + 1;

    let left = 0;
    let width = 0;

    if (viewMode === "day") {
      left = startDiff * cellWidth;
      width = duration * cellWidth;
    } else if (viewMode === "week") {
      left = (startDiff / 7) * cellWidth;
      width = (duration / 7) * cellWidth;
    } else {
      // Month view - approximate
      left = (startDiff / 30) * cellWidth;
      width = (duration / 30) * cellWidth;
    }

    return { left: Math.max(0, left), width: Math.max(cellWidth / 4, width) };
  };

  // Toggle task expansion
  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Scroll to today
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = timeUnits.findIndex((date) => isSameDay(date, today));
      if (todayIndex > 0) {
        const scrollPosition = todayIndex * cellWidth - 200;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [timeUnits, cellWidth]);

  const chartWidth = timeUnits.length * cellWidth;
  const chartHeight = rows.length * rowHeight;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gantt Chart
          </h3>
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {format(projectStartDate, "MMM d, yyyy")} -{" "}
          {format(projectEndDate, "MMM d, yyyy")}
        </div>
      </div>

      <div className="flex overflow-hidden">
        {/* Task List */}
        <div
          className="flex-shrink-0 border-r border-gray-200 bg-gray-50"
          style={{ width: taskListWidth }}
        >
          {/* Task List Header */}
          <div
            className="flex items-center px-4 font-medium text-sm text-gray-600 border-b border-gray-200 bg-gray-100"
            style={{ height: headerHeight }}
          >
            Task Name
          </div>

          {/* Task List Rows */}
          <div style={{ height: chartHeight }} className="overflow-hidden">
            {rows.map((row) => {
              const hasChildren =
                row.type === "task" &&
                tasks.some((t) => t.parentId === row.id);

              return (
                <div
                  key={row.id}
                  className={cn(
                    "flex items-center px-4 border-b border-gray-100 transition-colors",
                    hoveredRow === row.id && "bg-blue-50"
                  )}
                  style={{
                    height: rowHeight,
                    paddingLeft: `${16 + row.level * 20}px`,
                  }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => {
                    if (row.type === "task" && onTaskClick) {
                      onTaskClick(row.data as Task);
                    } else if (row.type === "milestone" && onMilestoneClick) {
                      onMilestoneClick(row.data as Milestone);
                    }
                  }}
                >
                  {row.type === "task" && hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(row.id);
                      }}
                      className="mr-1 p-0.5 hover:bg-gray-200 rounded"
                    >
                      {row.isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}
                  {row.type === "milestone" && (
                    <Diamond
                      className="w-4 h-4 mr-2 flex-shrink-0"
                      style={{ color: row.color }}
                    />
                  )}
                  <span className="truncate text-sm text-gray-900 cursor-pointer hover:text-blue-600">
                    {row.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div style={{ width: chartWidth, minWidth: "100%" }}>
            {/* Time Header */}
            <div
              className="flex border-b border-gray-200 bg-gray-100"
              style={{ height: headerHeight }}
            >
              {timeUnits.map((date, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-200 text-xs",
                    isSameDay(date, today) && "bg-blue-100"
                  )}
                  style={{ width: cellWidth }}
                >
                  {viewMode === "day" && (
                    <>
                      <span className="text-gray-500">{format(date, "EEE")}</span>
                      <span
                        className={cn(
                          "font-medium",
                          isWeekend(date) ? "text-gray-400" : "text-gray-700"
                        )}
                      >
                        {format(date, "d")}
                      </span>
                    </>
                  )}
                  {viewMode === "week" && (
                    <>
                      <span className="text-gray-500">{format(date, "MMM")}</span>
                      <span className="font-medium text-gray-700">
                        Week {format(date, "w")}
                      </span>
                    </>
                  )}
                  {viewMode === "month" && (
                    <>
                      <span className="text-gray-500">{format(date, "yyyy")}</span>
                      <span className="font-medium text-gray-700">
                        {format(date, "MMM")}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Chart Grid and Bars */}
            <div className="relative" style={{ height: chartHeight }}>
              {/* Grid Lines */}
              <div className="absolute inset-0 flex">
                {timeUnits.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-shrink-0 border-r border-gray-100",
                      viewMode === "day" && isWeekend(date) && "bg-gray-50",
                      isSameDay(date, today) && "bg-blue-50"
                    )}
                    style={{ width: cellWidth, height: chartHeight }}
                  />
                ))}
              </div>

              {/* Today Line */}
              {timeUnits.some((d) => isSameDay(d, today)) && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{
                    left:
                      calculateBarPosition(today, today).left + cellWidth / 2,
                  }}
                />
              )}

              {/* Row Backgrounds */}
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className={cn(
                    "absolute left-0 right-0 border-b border-gray-100",
                    hoveredRow === row.id && "bg-blue-50/50"
                  )}
                  style={{
                    top: index * rowHeight,
                    height: rowHeight,
                  }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                />
              ))}

              {/* Task Bars and Milestones */}
              {rows.map((row, index) => {
                const { left, width } = calculateBarPosition(
                  row.startDate,
                  row.endDate
                );

                if (row.type === "milestone") {
                  return (
                    <div
                      key={row.id}
                      className="absolute flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform z-20"
                      style={{
                        top: index * rowHeight + rowHeight / 2 - 10,
                        left: left + cellWidth / 2 - 10,
                      }}
                      onClick={() =>
                        onMilestoneClick?.(row.data as Milestone)
                      }
                    >
                      <div
                        className="w-5 h-5 rotate-45 shadow-md"
                        style={{
                          backgroundColor: row.color,
                          border: row.progress === 100 ? "2px solid #166534" : undefined,
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={row.id}
                    className="absolute flex items-center cursor-pointer group z-10"
                    style={{
                      top: index * rowHeight + 8,
                      left: left + 4,
                      width: width - 8,
                      height: rowHeight - 16,
                    }}
                    onClick={() => onTaskClick?.(row.data as Task)}
                  >
                    {/* Task Bar Background */}
                    <div
                      className="absolute inset-0 rounded-md shadow-sm group-hover:shadow-md transition-shadow"
                      style={{ backgroundColor: `${row.color}30` }}
                    />

                    {/* Progress Fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-md transition-all"
                      style={{
                        width: `${row.progress}%`,
                        backgroundColor: row.color,
                      }}
                    />

                    {/* Task Label */}
                    <span className="relative z-10 px-2 text-xs font-medium text-gray-800 truncate">
                      {row.name}
                    </span>

                    {/* Progress Percentage */}
                    <span className="absolute right-2 text-xs text-gray-600">
                      {row.progress}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTaskColor(status: string): string {
  switch (status) {
    case "done":
      return "#22C55E"; // green
    case "in-progress":
      return "#3B82F6"; // blue
    case "review":
      return "#A855F7"; // purple
    case "todo":
    default:
      return "#6B7280"; // gray
  }
}

export default GanttChart;
