"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTaskAction, updateTaskAction } from "@/app/(dashboard)/tasks/actions";
import {
  Task,
  TaskPriority,
  TASK_PRIORITY_CONFIG,
} from "@/types/tasks";

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface Milestone {
  id: string;
  name: string;
  project_id: string;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
}

interface TaskFormProps {
  task?: Task;
  projects: Project[];
  milestones: Milestone[];
  teamMembers: TeamMember[];
  defaultProjectId?: string;
  defaultMilestoneId?: string;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
    </Button>
  );
}

export function TaskForm({
  task,
  projects,
  milestones,
  teamMembers,
  defaultProjectId,
  defaultMilestoneId,
}: TaskFormProps) {
  const router = useRouter();
  const action = task ? updateTaskAction : createTaskAction;

  const [state, formAction] = useFormState(action, {
    error: undefined,
    success: undefined,
    id: undefined,
  });

  const isEdit = !!task;

  // Track selected project for milestone filtering
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || task?.project_id || ""
  );

  const filteredMilestones = milestones.filter(
    (m) => m.project_id === selectedProjectId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Task" : "New Task"}</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Task {isEdit ? "updated" : "created"} successfully!
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={task.id} />}

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="task-title"
              name="title"
              defaultValue={task?.title || ""}
              required
              maxLength={500}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              defaultValue={task?.description || ""}
              rows={3}
              maxLength={5000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Describe the task"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-project" className="block text-sm font-medium mb-1">
                Project *
              </label>
              <select
                id="task-project"
                name="project_id"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                }}
                required
                disabled={isEdit || !!defaultProjectId}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-milestone" className="block text-sm font-medium mb-1">
                Milestone
              </label>
              <select
                id="task-milestone"
                name="milestone_id"
                defaultValue={defaultMilestoneId || task?.milestone_id || ""}
                disabled={!selectedProjectId}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">No milestone</option>
                {filteredMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="task-assignee" className="block text-sm font-medium mb-1">
                Assigned To
              </label>
              <select
                id="task-assignee"
                name="assigned_to"
                defaultValue={task?.assigned_to || ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                defaultValue={task?.priority || "medium"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {(
                  Object.entries(TASK_PRIORITY_CONFIG) as [
                    TaskPriority,
                    { label: string }
                  ][]
                ).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-sm font-medium mb-1">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                name="due_date"
                defaultValue={task?.due_date || ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton isEdit={isEdit} />
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
