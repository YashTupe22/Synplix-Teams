// Email Notification Service (Stub)
//
// This service provides an abstraction for sending transactional emails.
// It is not yet connected to an email provider.
//
// To integrate an email provider:
// 1. Install the provider's SDK (e.g., @resend/resend, @sendgrid/mail)
// 2. Add the provider's API key to .env.local as EMAIL_PROVIDER_API_KEY
// 3. Implement the sendEmail function below
// 4. Call sendNotificationEmail after creating in-app notifications

import type { Notification, NotificationType } from "@/types/notifications";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationEmailData {
  recipientEmail: string;
  recipientName: string | null;
  notification: Notification;
}

// ──────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<NotificationType, (data: NotificationEmailData) => { subject: string; html: string }> = {
  TASK_ASSIGNED: (data) => ({
    subject: `New task assigned: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>You have been assigned to a new task: <strong>${data.notification.title}</strong></p><p>${data.notification.message}</p>`,
  }),
  TASK_REASSIGNED: (data) => ({
    subject: `Task reassigned: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>You have been assigned to: <strong>${data.notification.title}</strong></p><p>${data.notification.message}</p>`,
  }),
  TASK_COMPLETED: (data) => ({
    subject: `Task completed: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p><strong>${data.notification.title}</strong> has been completed.</p>`,
  }),
  TASK_OVERDUE: (data) => ({
    subject: `Task overdue: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p><strong>${data.notification.title}</strong> is past its due date.</p>`,
  }),
  TASK_DUE_SOON: (data) => ({
    subject: `Task due soon: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p><strong>${data.notification.title}</strong> is due soon.</p>`,
  }),
  COMMENT_ADDED: (data) => ({
    subject: `New comment: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  COMMENT_MENTION: (data) => ({
    subject: `You were mentioned: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  PROJECT_UPDATED: (data) => ({
    subject: `Project updated: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  MILESTONE_UPDATED: (data) => ({
    subject: `Milestone updated: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  MILESTONE_COMPLETED: (data) => ({
    subject: `Milestone completed: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  LEAD_ASSIGNED: (data) => ({
    subject: `Lead assigned: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  LEAD_UPDATED: (data) => ({
    subject: `Lead updated: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  OPPORTUNITY_UPDATED: (data) => ({
    subject: `Opportunity updated: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  OPPORTUNITY_WON: (data) => ({
    subject: `Opportunity won: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  QUOTATION_ACCEPTED: (data) => ({
    subject: `Quotation accepted: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  QUOTATION_REJECTED: (data) => ({
    subject: `Quotation rejected: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  INVOICE_CREATED: (data) => ({
    subject: `Invoice created: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  INVOICE_OVERDUE: (data) => ({
    subject: `Invoice overdue: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
  PAYMENT_RECEIVED: (data) => ({
    subject: `Payment received: ${data.notification.title}`,
    html: `<p>Hi ${data.recipientName || "there"},</p><p>${data.notification.message}</p>`,
  }),
};

// ──────────────────────────────────────────────
// Provider Interface
// ──────────────────────────────────────────────

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; error?: string }>;
}

// ──────────────────────────────────────────────
// Stub Provider (logs to console)
// ──────────────────────────────────────────────

class StubEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log("[Email Stub] Would send email:", {
      to: options.to,
      subject: options.subject,
    });
    return { success: true };
  }
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

let provider: EmailProvider = new StubEmailProvider();

export function setEmailProvider(newProvider: EmailProvider) {
  provider = newProvider;
}

export async function sendNotificationEmail(
  data: NotificationEmailData
): Promise<{ success: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES[data.notification.type];
  if (!template) {
    return { success: false, error: `No template for type: ${data.notification.type}` };
  }

  const { subject, html } = template(data);

  return provider.send({
    to: data.recipientEmail,
    subject,
    html,
  });
}

export async function sendBulkNotificationEmails(
  recipients: NotificationEmailData[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendNotificationEmail(recipient);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
