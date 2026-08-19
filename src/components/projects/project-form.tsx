"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStatus, ProjectPriority } from "@/types/clients";

type ActionState = { error?: string; success?: boolean; id?: string };

interface ProjectFormProps {
  project?: {
    id: string;
    client_id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: string | null;
    target_end_date: string | null;
    progress_percent: number;
    project_manager_id: string | null;
  };
  clients: { id: string; client_code: string; company: { name: string } | null }[];
  teamMembers: { id: string; full_name: string | null; email: string }[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Project"}
    </Button>
  );
}

export function ProjectForm({ project, clients, teamMembers, action }: ProjectFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client_id" className="mb-1.5 block text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={project?.client_id}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_code} - {c.company?.name ?? "No company"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Project Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={project?.name}
                placeholder="Project name"
              />
            </div>
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={project?.status ?? "planning"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="mb-1.5 block text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={project?.priority ?? "medium"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="project_manager_id" className="mb-1.5 block text-sm font-medium">
                Project Manager
              </label>
              <select
                id="project_manager_id"
                name="project_manager_id"
                defaultValue={project?.project_manager_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select manager</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
            {project && (
              <div>
                <label htmlFor="progress_percent" className="mb-1.5 block text-sm font-medium">
                  Progress (%)
                </label>
                <Input
                  id="progress_percent"
                  name="progress_percent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={project.progress_percent}
                />
              </div>
            )}
            <div>
              <label htmlFor="start_date" className="mb-1.5 block text-sm font-medium">
                Start Date
              </label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={project?.start_date ?? ""}
              />
            </div>
            <div>
              <label htmlFor="target_end_date" className="mb-1.5 block text-sm font-medium">
                Target End Date
              </label>
              <Input
                id="target_end_date"
                name="target_end_date"
                type="date"
                defaultValue={project?.target_end_date ?? ""}
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project?.description ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Project description..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
