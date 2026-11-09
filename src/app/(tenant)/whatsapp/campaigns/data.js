import { CheckCircle2, Clock, AlertCircle, Pause, RefreshCw } from "lucide-react";

export const MOCK_TEMPLATES = [
  {
    id: "t1", name: "diwali_offer_v2", displayName: "Diwali Interior Offer",
    category: "MARKETING", status: "APPROVED",
    header: "🎉 Diwali Special Offer", footer: "Reply STOP to unsubscribe",
    body: "Hi {{1}}! 🪔 This Diwali, transform your home with our exclusive interior packages starting at ₹8L. Book a FREE site visit today and get 10% off! Reply YES to schedule. — {{2}} Team",
    variables: ["customer_name", "company_name"],
  },
  {
    id: "t2", name: "site_visit_reminder", displayName: "Site Visit Reminder",
    category: "UTILITY", status: "APPROVED",
    header: null, footer: "SmoothSales CRM",
    body: "Hi {{1}}, this is a reminder that your site visit is scheduled for *{{2}}* at {{3}}. Our designer {{4}} will be there. Please confirm by replying YES. See you soon! 🏠",
    variables: ["customer_name", "visit_date", "visit_time", "designer_name"],
  },
  {
    id: "t3", name: "follow_up_generic", displayName: "Generic Follow-up",
    category: "UTILITY", status: "APPROVED",
    header: null, footer: null,
    body: "Hi {{1}}! 👋 We noticed you enquired about our interior design services. We'd love to help you create your dream space. Can we schedule a quick call? Reply YES or call us at {{2}}.",
    variables: ["customer_name", "phone_number"],
  },
  {
    id: "t4", name: "quotation_ready", displayName: "Quotation Ready",
    category: "UTILITY", status: "APPROVED",
    header: "Your Quotation is Ready", footer: null,
    body: "Hi {{1}}, your customized interior design quotation is ready! 📋 Total estimated value: *{{2}}*. Please review and let us know if you'd like to proceed.",
    variables: ["customer_name", "quote_amount"],
  },
  {
    id: "t5", name: "new_year_followup", displayName: "New Year Follow-up",
    category: "MARKETING", status: "APPROVED",
    header: "🎉 Happy New Year!", footer: "Reply STOP to opt out",
    body: "Happy New Year {{1}}! 🎊 Start 2025 with a beautiful new home. Our New Year special offers are live — up to 15% off on modular kitchens and wardrobes. Interested? Reply YES!",
    variables: ["customer_name"],
  },
];

export const MOCK_SEGMENTS = [
  { id: "s1", label: "All Leads", count: 1240 },
  { id: "s2", label: "Hot Leads", count: 312 },
  { id: "s3", label: "Inactive 30 Days", count: 198 },
  { id: "s4", label: "Site Visit Scheduled", count: 87 },
  { id: "s5", label: "Quotation Sent", count: 145 },
];

export const MOCK_CAMPAIGNS = [
  {
    id: "c1", name: "Diwali 2024 Offer Blast",
    templateId: "t1", template: "Diwali Interior Offer",
    segment: "All Leads", status: "completed",
    scheduledAt: "Oct 28, 2024 · 10:00 AM",
    sent: 1240, delivered: 1198, read: 876, replied: 134, failed: 42,
    createdAt: "28 Oct 2024",
  },
  {
    id: "c2", name: "Inactive Lead Re-engagement",
    templateId: "t3", template: "Generic Follow-up",
    segment: "Inactive 30 Days", status: "running",
    scheduledAt: "Nov 12, 2024 · 9:00 AM",
    sent: 198, delivered: 191, read: 102, replied: 28, failed: 7,
    createdAt: "12 Nov 2024",
  },
  {
    id: "c3", name: "Quotation Follow-up Nov",
    templateId: "t4", template: "Quotation Ready",
    segment: "Quotation Sent", status: "scheduled",
    scheduledAt: "Nov 15, 2024 · 11:00 AM",
    sent: 0, delivered: 0, read: 0, replied: 0, failed: 0,
    createdAt: "10 Nov 2024",
  },
  {
    id: "c4", name: "New Year 2025 Promo",
    templateId: "t5", template: "New Year Follow-up",
    segment: "Hot Leads", status: "draft",
    scheduledAt: "—",
    sent: 0, delivered: 0, read: 0, replied: 0, failed: 0,
    createdAt: "01 Jan 2025",
  },
  {
    id: "c5", name: "Site Visit Confirmation Drive",
    templateId: "t2", template: "Site Visit Reminder",
    segment: "Site Visit Scheduled", status: "paused",
    scheduledAt: "Nov 10, 2024 · 8:00 AM",
    sent: 87, delivered: 82, read: 61, replied: 19, failed: 5,
    createdAt: "10 Nov 2024",
  },
];

export const STATUS_CFG = {
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500", Icon: CheckCircle2 },
  running:   { label: "Running",   cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500",    Icon: RefreshCw },
  scheduled: { label: "Scheduled", cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",           dot: "bg-amber-500",   Icon: Clock },
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground border-border",                                                         dot: "bg-muted-foreground/40", Icon: AlertCircle },
  paused:    { label: "Paused",    cls: "bg-orange-500/10 text-orange-700 border-orange-200 dark:border-orange-800 dark:text-orange-400",       dot: "bg-orange-500", Icon: Pause },
};

export const MSG_STATUS_CFG = {
  replied:   { label: "Replied",   cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500" },
  read:      { label: "Read",      cls: "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-800 dark:text-violet-400",     dot: "bg-violet-500" },
  delivered: { label: "Delivered", cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500" },
  sent:      { label: "Sent",      cls: "bg-muted text-muted-foreground border-border",                                                        dot: "bg-muted-foreground/40" },
  failed:    { label: "Failed",    cls: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",                    dot: "bg-red-500" },
};

export const CAMPAIGN_CONTACTS = {
  c1: [
    { id: "r1",  name: "Rahul Sharma",   phone: "+91 98765 43210", status: "replied",   sentAt: "28 Oct · 10:01 AM", deliveredAt: "28 Oct · 10:02 AM", readAt: "28 Oct · 10:15 AM", repliedAt: "28 Oct · 10:18 AM", reply: "YES, interested!",        failReason: null },
    { id: "r2",  name: "Priya Mehta",    phone: "+91 87654 32109", status: "read",      sentAt: "28 Oct · 10:01 AM", deliveredAt: "28 Oct · 10:02 AM", readAt: "28 Oct · 11:30 AM", repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r3",  name: "Amit Verma",     phone: "+91 76543 21098", status: "delivered", sentAt: "28 Oct · 10:01 AM", deliveredAt: "28 Oct · 10:03 AM", readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r4",  name: "Sneha Patel",    phone: "+91 65432 10987", status: "failed",    sentAt: "28 Oct · 10:01 AM", deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: "Not on WhatsApp" },
    { id: "r5",  name: "Karan Singh",    phone: "+91 54321 09876", status: "replied",   sentAt: "28 Oct · 10:02 AM", deliveredAt: "28 Oct · 10:04 AM", readAt: "28 Oct · 12:00 PM", repliedAt: "28 Oct · 12:05 PM", reply: "Please call me",          failReason: null },
    { id: "r6",  name: "Neha Gupta",     phone: "+91 43210 98765", status: "read",      sentAt: "28 Oct · 10:02 AM", deliveredAt: "28 Oct · 10:04 AM", readAt: "28 Oct · 2:00 PM",  repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r7",  name: "Vikram Joshi",   phone: "+91 32109 87654", status: "delivered", sentAt: "28 Oct · 10:02 AM", deliveredAt: "28 Oct · 10:05 AM", readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r8",  name: "Anjali Rao",     phone: "+91 21098 76543", status: "failed",    sentAt: "28 Oct · 10:02 AM", deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: "Opted out" },
    { id: "r9",  name: "Deepak Kumar",   phone: "+91 10987 65432", status: "replied",   sentAt: "28 Oct · 10:03 AM", deliveredAt: "28 Oct · 10:06 AM", readAt: "28 Oct · 3:00 PM",  repliedAt: "28 Oct · 3:10 PM",  reply: "YES",                    failReason: null },
    { id: "r10", name: "Pooja Nair",     phone: "+91 09876 54321", status: "read",      sentAt: "28 Oct · 10:03 AM", deliveredAt: "28 Oct · 10:06 AM", readAt: "28 Oct · 4:00 PM",  repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r11", name: "Suresh Iyer",    phone: "+91 98761 23456", status: "sent",      sentAt: "28 Oct · 10:03 AM", deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r12", name: "Meena Pillai",   phone: "+91 87652 34567", status: "replied",   sentAt: "28 Oct · 10:04 AM", deliveredAt: "28 Oct · 10:07 AM", readAt: "28 Oct · 5:00 PM",  repliedAt: "28 Oct · 5:15 PM",  reply: "Interested, book visit", failReason: null },
  ],
  c2: [
    { id: "r1",  name: "Arjun Das",      phone: "+91 91234 56789", status: "replied",   sentAt: "12 Nov · 9:01 AM",  deliveredAt: "12 Nov · 9:03 AM",  readAt: "12 Nov · 9:20 AM",  repliedAt: "12 Nov · 9:25 AM",  reply: "YES please",             failReason: null },
    { id: "r2",  name: "Kavya Reddy",    phone: "+91 80123 45678", status: "read",      sentAt: "12 Nov · 9:01 AM",  deliveredAt: "12 Nov · 9:03 AM",  readAt: "12 Nov · 10:00 AM", repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r3",  name: "Rohit Bansal",   phone: "+91 79012 34567", status: "delivered", sentAt: "12 Nov · 9:01 AM",  deliveredAt: "12 Nov · 9:04 AM",  readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r4",  name: "Divya Menon",    phone: "+91 68901 23456", status: "failed",    sentAt: "12 Nov · 9:01 AM",  deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: "Invalid number" },
    { id: "r5",  name: "Sanjay Tiwari",  phone: "+91 57890 12345", status: "replied",   sentAt: "12 Nov · 9:02 AM",  deliveredAt: "12 Nov · 9:05 AM",  readAt: "12 Nov · 11:00 AM", repliedAt: "12 Nov · 11:10 AM", reply: "Call me back",           failReason: null },
    { id: "r6",  name: "Lakshmi Nair",   phone: "+91 46789 01234", status: "read",      sentAt: "12 Nov · 9:02 AM",  deliveredAt: "12 Nov · 9:05 AM",  readAt: "12 Nov · 1:00 PM",  repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r7",  name: "Manish Agarwal", phone: "+91 35678 90123", status: "sent",      sentAt: "12 Nov · 9:02 AM",  deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
  ],
  c5: [
    { id: "r1",  name: "Ravi Shankar",   phone: "+91 99887 76655", status: "replied",   sentAt: "10 Nov · 8:01 AM",  deliveredAt: "10 Nov · 8:02 AM",  readAt: "10 Nov · 8:30 AM",  repliedAt: "10 Nov · 8:35 AM",  reply: "YES confirmed",          failReason: null },
    { id: "r2",  name: "Sunita Kapoor",  phone: "+91 88776 65544", status: "read",      sentAt: "10 Nov · 8:01 AM",  deliveredAt: "10 Nov · 8:02 AM",  readAt: "10 Nov · 9:00 AM",  repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r3",  name: "Tarun Malhotra", phone: "+91 77665 54433", status: "failed",    sentAt: "10 Nov · 8:01 AM",  deliveredAt: null,                readAt: null,                repliedAt: null,                 reply: null,                     failReason: "Not on WhatsApp" },
    { id: "r4",  name: "Geeta Sharma",   phone: "+91 66554 43322", status: "delivered", sentAt: "10 Nov · 8:02 AM",  deliveredAt: "10 Nov · 8:03 AM",  readAt: null,                repliedAt: null,                 reply: null,                     failReason: null },
    { id: "r5",  name: "Harish Pillai",  phone: "+91 55443 32211", status: "replied",   sentAt: "10 Nov · 8:02 AM",  deliveredAt: "10 Nov · 8:03 AM",  readAt: "10 Nov · 10:00 AM", repliedAt: "10 Nov · 10:05 AM", reply: "Will be there",          failReason: null },
  ],
};

export function encodeId(id) {
  return btoa(id).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function decodeId(encoded) {
  try {
    return atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
}
