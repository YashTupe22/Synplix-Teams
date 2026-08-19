"use client";

import { useActionState } from "react";
import { Shield, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { updateUserRole, toggleUserActive } from "./actions";
import type { Profile, UserRole } from "@/types/database";

interface TeamPageProps {
  members: Profile[];
  currentUser: Profile;
}

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: string; icon: typeof Shield }
> = {
  admin: {
    label: "Admin",
    color: "bg-red-500/10 text-red-600",
    icon: ShieldCheck,
  },
  manager: {
    label: "Manager",
    color: "bg-amber-500/10 text-amber-600",
    icon: Shield,
  },
  employee: {
    label: "Employee",
    color: "bg-blue-500/10 text-blue-600",
    icon: Shield,
  },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role as UserRole] ?? ROLE_CONFIG.employee;
  return (
    <Badge variant="secondary" className={`${config.color} border-0`}>
      <config.icon className="mr-1 size-3" />
      {config.label}
    </Badge>
  );
}

function MemberCard({
  member,
  isAdmin,
  currentUserId,
}: {
  member: Profile;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [roleState, roleAction, rolePending] = useActionState(updateUserRole, null);
  const [activeState, activeAction, activePending] = useActionState(toggleUserActive, null);

  const isSelf = member.id === currentUserId;
  const initials = member.full_name
    ? member.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : member.email.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {initials}
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              {member.full_name || "No name"}
              {isSelf && (
                <span className="ml-2 text-xs text-muted-foreground">(You)</span>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <RoleBadge role={member.role} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {member.is_active ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0">
                <UserCheck className="mr-1 size-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0">
                <UserX className="mr-1 size-3" />
                Inactive
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </span>
          </div>

          {isAdmin && !isSelf && (
            <div className="flex items-center gap-2">
              {/* Role change dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" disabled={rolePending}>
                      Change Role
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {(["admin", "manager", "employee"] as UserRole[]).map(
                    (role) => (
                      <DropdownMenuItem
                        key={role}
                        disabled={role === member.role || rolePending}
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("target_id", member.id);
                          fd.set("role", role);
                          roleAction(fd);
                        }}
                      >
                        <RoleBadge role={role} />
                        {role === member.role && " (Current)"}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6" />

              {/* Activate/Deactivate button */}
              <form action={activeAction}>
                <input type="hidden" name="target_id" value={member.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={member.is_active ? "false" : "true"}
                />
                <Button
                  type="submit"
                  variant={member.is_active ? "destructive" : "outline"}
                  size="sm"
                  disabled={activePending}
                >
                  {member.is_active ? "Deactivate" : "Activate"}
                </Button>
              </form>
            </div>
          )}
        </div>

        {(roleState?.error || activeState?.error) && (
          <p className="mt-2 text-xs text-destructive">
            {roleState?.error || activeState?.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamPageContent({ members, currentUser }: TeamPageProps) {
  const isAdmin = currentUser.role === "admin";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Team"
        description={
          isAdmin
            ? "Manage team members, roles, and access."
            : "View team members."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            currentUserId={currentUser.id}
          />
        ))}
      </div>

      {members.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No team members found.</p>
        </div>
      )}
    </div>
  );
}
