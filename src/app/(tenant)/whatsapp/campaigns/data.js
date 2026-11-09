import { CheckCircle2, Clock, AlertCircle, Pause, RefreshCw } from "lucide-react";

export const MOCK_TEMPLATES = [
  {
    id: "t_welcome", name: "lead_welcome_intro", displayName: "Lead Welcome & Intro",
    category: "UTILITY", status: "APPROVED",
    header: "Welcome to {{2}}", footer: "SmoothSales CRM",
    body: "Hi {{1}}! 👋 Thank you for your interest in {{2}}. We are excited to assist you. Would you be available for a quick discovery call this week? Reply YES to connect with our specialist.",
    variables: ["customer_name", "company_name"],
  },
  {
    id: "t_demo_reminder", name: "meeting_demo_reminder", displayName: "Meeting / Demo Reminder",
    category: "UTILITY", status: "APPROVED",
    header: "Reminder: Scheduled Session", footer: "Reply CANCEL to reschedule",
    body: "Hi {{1}}, this is a friendly reminder for your scheduled session with {{4}} on *{{2}}* at *{{3}}*. Please reply YES to confirm your attendance.",
    variables: ["customer_name", "meeting_date", "meeting_time", "rep_name"],
  },
  {
    id: "t_quote_ready", name: "quotation_ready", displayName: "Quotation Ready",
    category: "UTILITY", status: "APPROVED",
    header: "Your Quotation is Ready", footer: "SmoothSales CRM",
    body: "Hi {{1}}, your customized proposal is ready! 📋 Estimated value: *{{2}}*. Please review and let us know if you would like to discuss next steps.",
    variables: ["customer_name", "quote_amount"],
  },
  {
    id: "t_followup", name: "lead_nudge_followup", displayName: "Product Follow-up",
    category: "MARKETING", status: "APPROVED",
    header: null, footer: "Reply STOP to unsubscribe",
    body: "Hi {{1}}! We wanted to check if you had any questions regarding our solutions. Reply YES to schedule a 10-minute demo, or call us directly at {{2}}.",
    variables: ["customer_name", "contact_phone"],
  },
];

export const MOCK_SEGMENTS = [
  { id: "all_leads", label: "All Active Leads", count: 242 },
  { id: "hot_leads", label: "Hot Leads", count: 48 },
  { id: "scheduled", label: "Meeting / Visit Scheduled", count: 34 },
  { id: "quote_sent", label: "Quotation Sent", count: 29 },
  { id: "followup_due", label: "Follow-up Due", count: 62 },
];

export const STATUS_CFG = {
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500", Icon: CheckCircle2 },
  running:   { label: "Running",   cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500",    Icon: RefreshCw },
  scheduled: { label: "Scheduled", cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",           dot: "bg-amber-500",   Icon: Clock },
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground border-border",                                                         dot: "bg-muted-foreground/40", Icon: AlertCircle },
  paused:    { label: "Paused",    cls: "bg-orange-500/10 text-orange-700 border-orange-200 dark:border-orange-800 dark:text-orange-400",       dot: "bg-orange-500", Icon: Pause },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-800 dark:text-rose-400",               dot: "bg-rose-500",   Icon: AlertCircle },
};

export const MSG_STATUS_CFG = {
  replied:   { label: "Replied",   cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500" },
  read:      { label: "Read",      cls: "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-800 dark:text-violet-400",     dot: "bg-violet-500" },
  delivered: { label: "Delivered", cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500" },
  sent:      { label: "Sent",      cls: "bg-muted text-muted-foreground border-border",                                                        dot: "bg-muted-foreground/40" },
  failed:    { label: "Failed",    cls: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",                    dot: "bg-red-500" },
};

export const CAMPAIGN_CONTACTS = {};

export function encodeId(id) {
  if (!id) return "";
  try {
    return btoa(String(id)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  } catch {
    return String(id);
  }
}

export function decodeId(encoded) {
  if (!encoded) return null;
  try {
    return atob(String(encoded).replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return encoded;
  }
}
