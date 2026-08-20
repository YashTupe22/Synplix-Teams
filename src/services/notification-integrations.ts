import { createClient } from "@/lib/supabase/server";
import { createNotification, createNotifications, shouldNotify, getProjectMemberIds, getManagerIds } from "@/services/notifications";
import type { NotificationInsert, NotificationType } from "@/types/notifications";

// ──────────────────────────────────────────────
// Task Notifications
// ──────────────────────────────────────────────

export async function notifyTaskAssigned(
  actorId: string,
  taskId: string,
  taskTitle: string,
  assigneeId: string,
  projectId: string
) {
  if (actorId === assigneeId) return; // Don't notify self-assignment

  const shouldSend = await shouldNotify(assigneeId, "tasks");
  if (!shouldSend) return;

  await createNotification({
    recipient_id: assigneeId,
    actor_id: actorId,
    type: "TASK_ASSIGNED",
    title: "New task assigned",
    message: `You have been assigned to "${taskTitle}"`,
    entity_type: "task",
    entity_id: taskId,
    action_url: `/tasks/${taskId}`,
    metadata: { project_id: projectId },
  });
}

export async function notifyTaskReassigned(
  actorId: string,
  taskId: string,
  taskTitle: string,
  newAssigneeId: string,
  projectId: string
) {
  if (actorId === newAssigneeId) return;

  const shouldSend = await shouldNotify(newAssigneeId, "tasks");
  if (!shouldSend) return;

  await createNotification({
    recipient_id: newAssigneeId,
    actor_id: actorId,
    type: "TASK_REASSIGNED",
    title: "Task reassigned to you",
    message: `You have been assigned to "${taskTitle}"`,
    entity_type: "task",
    entity_id: taskId,
    action_url: `/tasks/${taskId}`,
    metadata: { project_id: projectId },
  });
}

export async function notifyTaskCompleted(
  actorId: string,
  taskId: string,
  taskTitle: string,
  projectId: string,
  creatorId: string
) {
  // Notify the task creator if they're not the actor
  const recipients: NotificationInsert[] = [];

  if (actorId !== creatorId) {
    const shouldSend = await shouldNotify(creatorId, "tasks");
    if (shouldSend) {
      recipients.push({
        recipient_id: creatorId,
        actor_id: actorId,
        type: "TASK_COMPLETED",
        title: "Task completed",
        message: `"${taskTitle}" has been marked as complete`,
        entity_type: "task",
        entity_id: taskId,
        action_url: `/tasks/${taskId}`,
        metadata: { project_id: projectId },
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

export async function notifyTaskOverdue(
  taskId: string,
  taskTitle: string,
  assigneeId: string | null,
  projectId: string,
  creatorId: string
) {
  const recipients: NotificationInsert[] = [];

  // Notify assignee
  if (assigneeId) {
    const shouldSend = await shouldNotify(assigneeId, "tasks");
    if (shouldSend) {
      recipients.push({
        recipient_id: assigneeId,
        type: "TASK_OVERDUE",
        title: "Task overdue",
        message: `"${taskTitle}" is past its due date`,
        entity_type: "task",
        entity_id: taskId,
        action_url: `/tasks/${taskId}`,
        metadata: { project_id: projectId },
      });
    }
  }

  // Notify creator if different from assignee
  if (creatorId !== assigneeId) {
    const shouldSend = await shouldNotify(creatorId, "tasks");
    if (shouldSend) {
      recipients.push({
        recipient_id: creatorId,
        type: "TASK_OVERDUE",
        title: "Task overdue",
        message: `"${taskTitle}" is past its due date`,
        entity_type: "task",
        entity_id: taskId,
        action_url: `/tasks/${taskId}`,
        metadata: { project_id: projectId },
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

// ──────────────────────────────────────────────
// Comment Notifications
// ──────────────────────────────────────────────

export async function notifyCommentAdded(
  actorId: string,
  taskId: string,
  taskTitle: string,
  commentContent: string
) {
  const supabase = await createClient();

  // Get task details to find assignee and creator
  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to, created_by, project_id")
    .eq("id", taskId)
    .single();

  if (!task) return;

  const recipients: NotificationInsert[] = [];
  const mentionedIds = new Set<string>();

  // Extract @mentions from comment content
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(commentContent)) !== null) {
    mentionedIds.add(match[1]);
  }

  // If there are mentions, look up user IDs
  if (mentionedIds.size > 0) {
    const { data: mentionedUsers } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", Array.from(mentionedIds).map((m) => `${m}@synplix.com`));

    if (mentionedUsers) {
      for (const user of mentionedUsers) {
        if (user.id !== actorId) {
          const shouldSend = await shouldNotify(user.id, "comments");
          if (shouldSend) {
            recipients.push({
              recipient_id: user.id,
              actor_id: actorId,
              type: "COMMENT_MENTION",
              title: "Mentioned in comment",
              message: `You were mentioned in a comment on "${taskTitle}"`,
              entity_type: "task",
              entity_id: taskId,
              action_url: `/tasks/${taskId}`,
              metadata: { project_id: task.project_id },
            });
          }
        }
      }
    }
  }

  // Notify assignee (if not the actor and not already mentioned)
  if (task.assigned_to && task.assigned_to !== actorId && !mentionedIds.has(task.assigned_to)) {
    const shouldSend = await shouldNotify(task.assigned_to, "comments");
    if (shouldSend) {
      recipients.push({
        recipient_id: task.assigned_to,
        actor_id: actorId,
        type: "COMMENT_ADDED",
        title: "New comment on task",
        message: `A comment was added to "${taskTitle}"`,
        entity_type: "task",
        entity_id: taskId,
        action_url: `/tasks/${taskId}`,
        metadata: { project_id: task.project_id },
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

// ──────────────────────────────────────────────
// Project Notifications
// ──────────────────────────────────────────────

export async function notifyProjectUpdated(
  actorId: string,
  projectId: string,
  projectName: string
) {
  const memberIds = await getProjectMemberIds(projectId);
  const recipients: NotificationInsert[] = [];

  for (const memberId of memberIds) {
    if (memberId === actorId) continue;
    const shouldSend = await shouldNotify(memberId, "project");
    if (shouldSend) {
      recipients.push({
        recipient_id: memberId,
        actor_id: actorId,
        type: "PROJECT_UPDATED",
        title: "Project updated",
        message: `"${projectName}" has been updated`,
        entity_type: "project",
        entity_id: projectId,
        action_url: `/projects/${projectId}`,
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

export async function notifyMilestoneUpdated(
  actorId: string,
  milestoneId: string,
  milestoneName: string,
  projectId: string,
  projectName: string
) {
  const memberIds = await getProjectMemberIds(projectId);
  const recipients: NotificationInsert[] = [];

  for (const memberId of memberIds) {
    if (memberId === actorId) continue;
    const shouldSend = await shouldNotify(memberId, "project");
    if (shouldSend) {
      recipients.push({
        recipient_id: memberId,
        actor_id: actorId,
        type: "MILESTONE_UPDATED",
        title: "Milestone updated",
        message: `Milestone "${milestoneName}" in "${projectName}" has been updated`,
        entity_type: "milestone",
        entity_id: milestoneId,
        action_url: `/projects/${projectId}`,
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

// ──────────────────────────────────────────────
// Sales Notifications
// ──────────────────────────────────────────────

export async function notifyLeadAssigned(
  actorId: string,
  leadId: string,
  leadTitle: string,
  assigneeId: string
) {
  if (actorId === assigneeId) return;

  const shouldSend = await shouldNotify(assigneeId, "sales");
  if (!shouldSend) return;

  await createNotification({
    recipient_id: assigneeId,
    actor_id: actorId,
    type: "LEAD_ASSIGNED",
    title: "Lead assigned to you",
    message: `You have been assigned to lead "${leadTitle}"`,
    entity_type: "lead",
    entity_id: leadId,
    action_url: `/crm/leads/${leadId}`,
  });
}

export async function notifyOpportunityWon(
  actorId: string,
  opportunityId: string,
  opportunityTitle: string,
  projectId: string | null
) {
  // Notify managers
  const managerIds = await getManagerIds();
  const recipients: NotificationInsert[] = [];

  for (const managerId of managerIds) {
    if (managerId === actorId) continue;
    const shouldSend = await shouldNotify(managerId, "sales");
    if (shouldSend) {
      recipients.push({
        recipient_id: managerId,
        actor_id: actorId,
        type: "OPPORTUNITY_WON",
        title: "Opportunity won",
        message: `"${opportunityTitle}" has been marked as won`,
        entity_type: "opportunity",
        entity_id: opportunityId,
        action_url: `/sales/opportunities/${opportunityId}`,
        metadata: { project_id: projectId },
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

// ──────────────────────────────────────────────
// Finance Notifications
// ──────────────────────────────────────────────

export async function notifyQuotationStatusChanged(
  actorId: string,
  quotationId: string,
  quotationNumber: string,
  clientId: string,
  status: "accepted" | "rejected"
) {
  const supabase = await createClient();

  // Get client details (no financial info)
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (!client) return;

  // Get client company name for the notification
  const { data: clientWithCompany } = await supabase
    .from("clients")
    .select("company:companies(name)")
    .eq("id", clientId)
    .single();

  const companyName = (clientWithCompany?.company as unknown as { name: string } | null)?.name || "Client";

  const type: NotificationType = status === "accepted" ? "QUOTATION_ACCEPTED" : "QUOTATION_REJECTED";
  const title = status === "accepted" ? "Quotation accepted" : "Quotation rejected";
  const message = `${quotationNumber} for ${companyName} has been ${status}`;

  // Notify managers and admins who have finance permissions
  const managerIds = await getManagerIds();
  const recipients: NotificationInsert[] = [];

  for (const managerId of managerIds) {
    if (managerId === actorId) continue;
    const shouldSend = await shouldNotify(managerId, "finance");
    if (shouldSend) {
      recipients.push({
        recipient_id: managerId,
        actor_id: actorId,
        type,
        title,
        message,
        entity_type: "quotation",
        entity_id: quotationId,
        action_url: `/finance/quotations/${quotationId}`,
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

export async function notifyInvoiceCreated(
  actorId: string,
  invoiceId: string,
  invoiceNumber: string,
  clientId: string
) {
  const supabase = await createClient();

  const { data: clientWithCompany } = await supabase
    .from("clients")
    .select("company:companies(name)")
    .eq("id", clientId)
    .single();

  const companyName = (clientWithCompany?.company as unknown as { name: string } | null)?.name || "Client";

  // Notify managers
  const managerIds = await getManagerIds();
  const recipients: NotificationInsert[] = [];

  for (const managerId of managerIds) {
    if (managerId === actorId) continue;
    const shouldSend = await shouldNotify(managerId, "finance");
    if (shouldSend) {
      recipients.push({
        recipient_id: managerId,
        actor_id: actorId,
        type: "INVOICE_CREATED",
        title: "Invoice created",
        message: `${invoiceNumber} has been created for ${companyName}`,
        entity_type: "invoice",
        entity_id: invoiceId,
        action_url: `/finance/invoices/${invoiceId}`,
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}

export async function notifyPaymentReceived(
  actorId: string,
  invoiceId: string,
  invoiceNumber: string,
  clientId: string
) {
  const supabase = await createClient();

  const { data: clientWithCompany } = await supabase
    .from("clients")
    .select("company:companies(name)")
    .eq("id", clientId)
    .single();

  const companyName = (clientWithCompany?.company as unknown as { name: string } | null)?.name || "Client";

  // Notify managers
  const managerIds = await getManagerIds();
  const recipients: NotificationInsert[] = [];

  for (const managerId of managerIds) {
    if (managerId === actorId) continue;
    const shouldSend = await shouldNotify(managerId, "finance");
    if (shouldSend) {
      recipients.push({
        recipient_id: managerId,
        actor_id: actorId,
        type: "PAYMENT_RECEIVED",
        title: "Payment received",
        message: `Payment received for ${invoiceNumber} (${companyName})`,
        entity_type: "payment",
        entity_id: invoiceId,
        action_url: `/finance/invoices/${invoiceId}`,
      });
    }
  }

  if (recipients.length > 0) {
    await createNotifications(recipients);
  }
}
