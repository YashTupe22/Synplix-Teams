"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Archive,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  DollarSign,
  Tag,
  Plus,
  Send,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LEAD_STATUS_CONFIG,
  LEAD_PRIORITY_CONFIG,
  ACTIVITY_TYPE_CONFIG,
  type LeadWithRelations,
  type LeadActivity,
  type LeadNote,
  type LeadStatus,
  type ActivityType,
} from "@/types/crm";
import type { Profile } from "@/types/database";

interface LeadDetailProps {
  lead: LeadWithRelations;
  activities: (LeadActivity & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[];
  notes: (LeadNote & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[];
  onStatusChange: (id: string, status: LeadStatus) => Promise<{ error?: string; success?: boolean }>;
  onAddActivity: (leadId: string, type: ActivityType, subject: string, description: string) => Promise<{ error?: string; success?: boolean }>;
  onAddNote: (leadId: string, content: string) => Promise<{ error?: string; success?: boolean }>;
  onArchive: (id: string) => Promise<{ error?: string; success?: boolean }>;
  isAdmin: boolean;
  isManager: boolean;
}

export function LeadDetail({
  lead,
  activities,
  notes,
  onStatusChange,
  onAddActivity,
  onAddNote,
  onArchive,
  isAdmin,
  isManager,
}: LeadDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const statusCfg = LEAD_STATUS_CONFIG[lead.status];
  const priorityCfg = LEAD_PRIORITY_CONFIG[lead.priority];

  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await onStatusChange(lead.id, newStatus);
      if (result.error) setError(result.error);
    });
  };

  const handleAddActivity = async () => {
    setError(null);
    startTransition(async () => {
      const result = await onAddActivity(lead.id, activityType, activitySubject, activityDesc);
      if (result.error) {
        setError(result.error);
      } else {
        setShowActivityForm(false);
        setActivitySubject("");
        setActivityDesc("");
      }
    });
  };

  const handleAddNote = async () => {
    setError(null);
    startTransition(async () => {
      const result = await onAddNote(lead.id, noteContent);
      if (result.error) {
        setError(result.error);
      } else {
        setShowNoteForm(false);
        setNoteContent("");
      }
    });
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this lead?")) return;
    startTransition(async () => {
      const result = await onArchive(lead.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/crm/leads");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{lead.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                <span className={`mr-1.5 size-1.5 rounded-full ${statusCfg.bgColor}`} />
                {statusCfg.label}
              </Badge>
              <span className={`text-xs font-medium ${priorityCfg.color}`}>
                {priorityCfg.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isManager) && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/crm/leads/${lead.id}/edit`)}
              >
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleArchive}>
                <Archive className="mr-1.5 size-3.5" />
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Company:</span>
                  <span>{lead.company?.name ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Contact:</span>
                  <span>
                    {lead.contact
                      ? `${lead.contact.first_name} ${lead.contact.last_name ?? ""}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium">
                    {formatCurrency(lead.estimated_value, lead.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source:</span>
                  <span>{lead.source?.name ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned:</span>
                  <span>
                    {lead.assigned_user?.full_name ?? lead.assigned_user?.email ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Follow-up:</span>
                  <span>
                    {lead.next_follow_up_at
                      ? format(new Date(lead.next_follow_up_at), "dd MMM yyyy, h:mm a")
                      : "—"}
                  </span>
                </div>
              </div>
              {lead.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.description}</p>
                  </div>
                </>
              )}
              {lead.lost_reason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-destructive mb-1">Lost Reason</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.lost_reason}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Change */}
          {(isAdmin || isManager) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={s === lead.status || isPending}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        s === lead.status
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } disabled:opacity-50`}
                    >
                      {LEAD_STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Activity Timeline</CardTitle>
              {(isAdmin || isManager) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActivityForm(!showActivityForm)}
                >
                  <Plus className="mr-1 size-3" />
                  Log Activity
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showActivityForm && (
                <div className="mb-4 space-y-3 rounded-lg border border-border p-3">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {(Object.keys(ACTIVITY_TYPE_CONFIG) as ActivityType[]).map((t) => (
                      <option key={t} value={t}>
                        {ACTIVITY_TYPE_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={activitySubject}
                    onChange={(e) => setActivitySubject(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddActivity} disabled={isPending}>
                      <Send className="mr-1 size-3" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowActivityForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activities recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                        {ACTIVITY_TYPE_CONFIG[activity.activity_type]?.label?.[0] ?? "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {ACTIVITY_TYPE_CONFIG[activity.activity_type]?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {activity.user?.full_name ?? activity.user?.email}
                          </span>
                        </div>
                        {activity.subject && (
                          <p className="mt-1 text-sm font-medium">{activity.subject}</p>
                        )}
                        {activity.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">
                            {activity.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), "dd MMM yyyy, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.contact?.phone && (
                <a href={`tel:${lead.contact.phone}`} className={buttonVariants({ variant: "outline", size: "sm" }) + " w-full justify-start"}>
                  <Phone className="mr-2 size-3.5" />
                  Call {lead.contact.first_name}
                </a>
              )}
              {lead.contact?.email && (
                <a href={`mailto:${lead.contact.email}`} className={buttonVariants({ variant: "outline", size: "sm" }) + " w-full justify-start"}>
                  <Mail className="mr-2 size-3.5" />
                  Email {lead.contact.first_name}
                </a>
              )}
              {lead.company && "website" in lead.company && lead.company.website && (
                <a href={lead.company.website} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" }) + " w-full justify-start"}>
                  <Building2 className="mr-2 size-3.5" />
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Notes</CardTitle>
              {(isAdmin || isManager) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                >
                  <Plus className="size-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showNoteForm && (
                <div className="mb-4 space-y-2">
                  <textarea
                    placeholder="Add a note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote} disabled={isPending || !noteContent.trim()}>
                      Save Note
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNoteForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{note.user?.full_name ?? note.user?.email}</span>
                        <span>·</span>
                        <span>{format(new Date(note.created_at), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
