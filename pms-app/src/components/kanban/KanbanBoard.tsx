"use client";

import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task, TaskStatus } from "@/lib/types";
import { cn, formatDate, getPriorityColor, isOverdue } from "@/lib/utils";
import { ProgressBar, Avatar, Badge } from "@/components/ui";
import {
  Calendar,
  Clock,
  MoreVertical,
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  Eye,
} from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

const columns: { id: TaskStatus; title: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "todo",
    title: "To Do",
    icon: <Circle className="w-4 h-4" />,
    color: "bg-gray-100 border-gray-300",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: <Timer className="w-4 h-4" />,
    color: "bg-blue-50 border-blue-300",
  },
  {
    id: "review",
    title: "In Review",
    icon: <Eye className="w-4 h-4" />,
    color: "bg-purple-50 border-purple-300",
  },
  {
    id: "done",
    title: "Done",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "bg-green-50 border-green-300",
  },
];

export function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;

    onTaskMove(draggableId, newStatus);
  };

  const getColumnTasks = (status: TaskStatus) =>
    tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          const totalTasks = columnTasks.length;

          return (
            <div
              key={column.id}
              className={cn(
                "flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2",
                column.color
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{column.icon}</span>
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                    {totalTasks}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(column.id)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto",
                      snapshot.isDraggingOver && "bg-blue-50"
                    )}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TaskCard
                            task={task}
                            provided={provided}
                            isDragging={snapshot.isDragging}
                            onClick={() => onTaskClick(task)}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <p className="text-sm">No tasks</p>
                        <button
                          onClick={() => onAddTask(column.id)}
                          className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                        >
                          + Add a task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

interface TaskCardProps {
  task: Task;
  provided: any;
  isDragging: boolean;
  onClick: () => void;
}

function TaskCard({ task, provided, isDragging, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.endDate) && task.status !== "done";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-3 mb-2 cursor-pointer",
        "hover:border-gray-300 hover:shadow-sm transition-all",
        isDragging && "shadow-lg ring-2 ring-blue-500",
        overdue && "border-red-300 bg-red-50"
      )}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full border",
            getPriorityColor(task.priority)
          )}
        >
          {task.priority}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Task Name */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.name}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      {task.progress > 0 && task.status !== "done" && (
        <div className="mb-3">
          <ProgressBar value={task.progress} size="sm" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          <div
            className={cn(
              "flex items-center gap-1",
              overdue && "text-red-600 font-medium"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(task.endDate)}
          </div>

          {/* Estimated Hours */}
          {task.estimatedHours > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.estimatedHours}h
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <Avatar name={task.assignee.name} size="sm" />
        )}
      </div>
    </div>
  );
}

export default KanbanBoard;
