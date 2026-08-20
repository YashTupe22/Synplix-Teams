"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  TaskWithRelations,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/types/tasks";
import { updateTaskStatusAction } from "@/app/(dashboard)/tasks/actions";
import { CheckCircle, Clock, AlertTriangle, Circle, MoreHorizontal, Ban } from "lucide-react";

interface TaskBoardProps {
  tasks: TaskWithRelations[];
}

const BOARD_COLUMNS: { status: TaskStatus; title: string; icon: React.ReactNode }[] = [
  { status: "todo", title: "To Do", icon: <Circle className="h-4 w-4" /> },
  { status: "in_progress", title: "In Progress", icon: <Clock className="h-4 w-4" /> },
  { status: "in_review", title: "In Review", icon: <MoreHorizontal className="h-4 w-4" /> },
  { status: "blocked", title: "Blocked", icon: <AlertTriangle className="h-4 w-4" /> },
  { status: "completed", title: "Completed", icon: <CheckCircle className="h-4 w-4" /> },
  { status: "cancelled", title: "Cancelled", icon: <Ban className="h-4 w-4" /> },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function moveTask(taskId: string, newStatus: TaskStatus) {
    setMovingTaskId(taskId);
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, newStatus);
      if (result.error) {
        setError(result.error);
      }
      setMovingTaskId(null);
      router.refresh();
    });
  }

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  function getNextStatuses(current: TaskStatus): TaskStatus[] {
    switch (current) {
      case "todo":
        return ["in_progress"];
      case "in_progress":
        return ["in_review", "blocked"];
      case "in_review":
        return ["completed", "in_progress"];
      case "blocked":
        return ["in_progress"];
      case "completed":
        return ["todo", "in_progress"];
      case "cancelled":
        return ["todo"];
      default:
        return [];
    }
  }

  function isOverdue(task: TaskWithRelations) {
    if (!task.due_date) return false;
    const today = new Date().toISOString().split("T")[0];
    return (
      task.due_date < today &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <div
              key={column.status}
              className="min-w-[280px] flex-1 rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="mb-3 flex items-center gap-2">
                {column.icon}
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {columnTasks.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`transition-opacity ${
                        movingTaskId === task.id ? "opacity-50" : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <Link href={`/tasks/${task.id}`}>
                          <h4 className="text-sm font-medium hover:underline">
                            {task.title}
                          </h4>
                        </Link>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {task.project && (
                            <span>{task.project.project_code}</span>
                          )}
                          {task.milestone && (
                            <span>/ {task.milestone.name}</span>
                          )}
                          {task.assignee && (
                            <span className="truncate max-w-[120px]">
                              {task.assignee.full_name || task.assignee.email}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${TASK_PRIORITY_CONFIG[task.priority].color}`}
                            >
                              {TASK_PRIORITY_CONFIG[task.priority].label}
                            </Badge>
                            {isOverdue(task) && (
                              <Badge
                                variant="destructive"
                                className="text-[9px]"
                              >
                                Overdue
                              </Badge>
                            )}
                          </div>

                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Status transition buttons */}
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {getNextStatuses(task.status).map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={(e) => {
                                e.preventDefault();
                                moveTask(task.id, nextStatus);
                              }}
                              disabled={isPending}
                              aria-label={`Move to ${TASK_STATUS_CONFIG[nextStatus].label}`}
                            >
                              {TASK_STATUS_CONFIG[nextStatus].label}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
