"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MILESTONE_STATUS_CONFIG, type ProjectMilestoneWithStats } from "@/types/clients";
import { Plus } from "lucide-react";
import { useState } from "react";

type ActionState = { error?: string; success?: boolean };

interface MilestoneListProps {
  milestones: ProjectMilestoneWithStats[];
  projectId: string;
  createAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  updateAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function CreateMilestoneForm({
  projectId,
  createAction,
}: {
  projectId: string;
  createAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useFormState(createAction, null);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        <Plus className="mr-1 size-3" /> Add Milestone
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-3">
      <input type="hidden" name="project_id" value={projectId} />
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Milestone name" required />
        <Input name="due_date" type="date" />
      </div>
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">Create</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function MilestoneList({ milestones, projectId, createAction, updateAction }: MilestoneListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Milestones ({milestones.length})</CardTitle>
        <CreateMilestoneForm projectId={projectId} createAction={createAction} />
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet. Add your first milestone.</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((milestone) => {
  const _statusCfg = MILESTONE_STATUS_CONFIG[milestone.status];
              return (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  projectId={projectId}
                  updateAction={updateAction}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MilestoneItem({
  milestone,
  projectId,
  updateAction,
}: {
  milestone: ProjectMilestoneWithStats;
  projectId: string;
  updateAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useFormState(updateAction, null);
  const statusCfg = MILESTONE_STATUS_CONFIG[milestone.status];

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${statusCfg.color}`}>{statusCfg.icon}</span>
            <p className="text-sm font-medium">{milestone.name}</p>
          </div>
          {milestone.description && (
            <p className="mt-1 text-xs text-muted-foreground">{milestone.description}</p>
          )}
          {milestone.due_date && (
            <p className="mt-1 text-xs text-muted-foreground">
              Due: {new Date(milestone.due_date).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="id" value={milestone.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <select
            name="status"
            defaultValue={milestone.status}
            onChange={(e) => e.target.form?.requestSubmit()}
            className="rounded border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
          {state?.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
