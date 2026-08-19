"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ProjectMemberWithUser } from "@/types/clients";
import { UserMinus, Plus } from "lucide-react";
import { useState, useTransition } from "react";

type ActionState = { error?: string; success?: boolean };

interface MemberListProps {
  members: ProjectMemberWithUser[];
  projectId: string;
  teamMembers: { id: string; full_name: string | null; email: string; role: string }[];
  addAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  removeAction: (projectId: string, userId: string) => Promise<ActionState>;
}

export function MemberList({ members, projectId, teamMembers, addAction, removeAction }: MemberListProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Members ({members.length})</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-1 size-3" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <AddMemberForm
            projectId={projectId}
            teamMembers={teamMembers}
            existingMemberIds={members.map((m) => m.user_id)}
            addAction={addAction}
            onCancel={() => setShowAdd(false)}
          />
        )}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                projectId={projectId}
                removeAction={removeAction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddMemberForm({
  projectId,
  teamMembers,
  existingMemberIds,
  addAction,
  onCancel,
}: {
  projectId: string;
  teamMembers: { id: string; full_name: string | null; email: string; role: string }[];
  existingMemberIds: string[];
  addAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  onCancel: () => void;
}) {
  const [state, formAction] = useFormState(addAction, null);
  const availableMembers = teamMembers.filter((m) => !existingMemberIds.includes(m.id));

  return (
    <form action={formAction} className="mb-3 space-y-3 rounded-lg border border-border p-3">
      <input type="hidden" name="project_id" value={projectId} />
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="user_id"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select user</option>
          {availableMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name ?? m.email}
            </option>
          ))}
        </select>
        <Input name="role" placeholder="Role (e.g. Developer)" />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">Add Member</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function MemberItem({
  member,
  projectId,
  removeAction,
}: {
  member: ProjectMemberWithUser;
  projectId: string;
  removeAction: (projectId: string, userId: string) => Promise<ActionState>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeAction(projectId, member.user_id);
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{member.user?.full_name ?? member.user?.email ?? "Unknown"}</p>
        {member.role && (
          <Badge variant="outline" className="mt-1 text-[10px]">{member.role}</Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Remove member"
        disabled={isPending}
        onClick={handleRemove}
      >
        <UserMinus className="size-3.5" />
      </Button>
    </div>
  );
}
