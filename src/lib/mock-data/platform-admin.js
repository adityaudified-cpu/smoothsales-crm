import { PRICING_PLANS } from "./pricing-plans";

export const platformStats = {
  mrr: "₹18,45,000",
  mrrDelta: "+12.4% vs last month",
  activeTenants: 142,
  activeTenantsDelta: "+8 new this month",
  churnRate: "1.8%",
  trialConversionRate: "24.6%",
};

export const tenants = [
  {
    id: "t_101",
    businessName: "Jaipur Interiors Pvt Ltd",
    vertical: "Interior Design",
    plan: "Growth",
    status: "active",
    mrr: "₹17,999",
    signupDate: "2026-01-15",
    userCount: 14,
    contactEmail: "admin@jaipurinteriors.com",
    leadsThisMonth: 1420,
    storageUsed: "4.2 GB",
  },
  {
    id: "t_102",
    businessName: "Prestige City Living",
    vertical: "Real Estate",
    plan: "Enterprise",
    status: "active",
    mrr: "₹19,999",
    signupDate: "2026-01-18",
    userCount: 38,
    contactEmail: "sales@prestigecity.in",
    leadsThisMonth: 4890,
    storageUsed: "12.8 GB",
  },
  {
    id: "t_103",
    businessName: "Aura EdTech Institute",
    vertical: "Education",
    plan: "Starter",
    status: "trial",
    mrr: "₹0",
    signupDate: "2026-02-28",
    userCount: 6,
    contactEmail: "counselling@aurainstitute.org",
    leadsThisMonth: 210,
    storageUsed: "850 MB",
  },
  {
    id: "t_104",
    businessName: "Urban Nest Residences",
    vertical: "Real Estate",
    plan: "Growth",
    status: "active",
    mrr: "₹17,999",
    signupDate: "2026-02-05",
    userCount: 18,
    contactEmail: "info@urbannest.com",
    leadsThisMonth: 1890,
    storageUsed: "5.1 GB",
  },
  {
    id: "t_105",
    businessName: "Skyline High School Admissions",
    vertical: "Education",
    plan: "Growth",
    status: "past_due",
    mrr: "₹17,999",
    signupDate: "2025-11-12",
    userCount: 12,
    contactEmail: "admissions@skylinehigh.edu",
    leadsThisMonth: 950,
    storageUsed: "3.4 GB",
  },
  {
    id: "t_106",
    businessName: "Studio Forma Spaces",
    vertical: "Interior Design",
    plan: "Starter",
    status: "active",
    mrr: "₹12,999",
    signupDate: "2026-01-29",
    userCount: 5,
    contactEmail: "projects@studioforma.in",
    leadsThisMonth: 410,
    storageUsed: "1.9 GB",
  },
  {
    id: "t_107",
    businessName: "Silverline Properties",
    vertical: "Real Estate",
    plan: "Enterprise",
    status: "active",
    mrr: "₹19,999",
    signupDate: "2025-10-04",
    userCount: 42,
    contactEmail: "ops@silverlineproperties.com",
    leadsThisMonth: 5310,
    storageUsed: "15.4 GB",
  },
  {
    id: "t_108",
    businessName: "Horizon Architecture Studio",
    vertical: "Interior Design",
    plan: "Growth",
    status: "cancelled",
    mrr: "₹0",
    signupDate: "2025-08-19",
    userCount: 8,
    contactEmail: "contact@horizonstudio.co",
    leadsThisMonth: 0,
    storageUsed: "2.1 GB",
  },
  {
    id: "t_109",
    businessName: "Vedic Scholars Academy",
    vertical: "Education",
    plan: "Starter",
    status: "trial",
    mrr: "₹0",
    signupDate: "2026-03-01",
    userCount: 4,
    contactEmail: "helpdesk@vedicscholars.org",
    leadsThisMonth: 125,
    storageUsed: "420 MB",
  },
  {
    id: "t_110",
    businessName: "DLF Prime Developers",
    vertical: "Real Estate",
    plan: "Enterprise",
    status: "active",
    mrr: "₹19,999",
    signupDate: "2025-09-14",
    userCount: 65,
    contactEmail: "crm@dlfprime.in",
    leadsThisMonth: 8940,
    storageUsed: "28.5 GB",
  },
];

export const adminPlans = PRICING_PLANS.map((plan) => {
  const subscriberCounts = {
    starter: 48,
    growth: 76,
    enterprise: 18,
  };
  return {
    ...plan,
    activeSubscriberCount: subscriberCounts[plan.id] || 25,
  };
});

export const recentTenantActivity = [
  { id: "act_1", text: "Jaipur Interiors Pvt Ltd upgraded to Growth plan (₹17,999/mo)", time: "14 mins ago", type: "upgrade" },
  { id: "act_2", text: "New trial registered: Vedic Scholars Academy (Education vertical)", time: "2 hours ago", type: "signup" },
  { id: "act_3", text: "Prestige City Living exceeded 4,000 monthly leads mark", time: "5 hours ago", type: "milestone" },
  { id: "act_4", text: "Invoice payment succeeded for DLF Prime Developers (₹19,999)", time: "1 day ago", type: "payment" },
  { id: "act_5", text: "Skyline High School payment past due — automated dunning triggered", time: "1 day ago", type: "alert" },
];

export const signupsTrend = [
  { name: "Week 1", signups: 14, conversions: 5 },
  { name: "Week 2", signups: 22, conversions: 8 },
  { name: "Week 3", signups: 19, conversions: 7 },
  { name: "Week 4", signups: 29, conversions: 11 },
];

export const systemAuditLogs = [
  { id: "aud_1", timestamp: "2026-03-08 09:42:15", actor: "Aditya (Super Admin)", action: "IMPERSONATE_SESSION_START", tenant: "Jaipur Interiors Pvt Ltd", ip: "49.205.12.8" },
  { id: "aud_2", timestamp: "2026-03-08 08:15:30", actor: "System Engine", action: "DUNNING_NOTICE_SENT", tenant: "Skyline High School Admissions", ip: "10.0.0.1" },
  { id: "aud_3", timestamp: "2026-03-07 18:22:04", actor: "Prestige City Living Admin", action: "TEAM_SEATS_EXPANDED", tenant: "Prestige City Living", ip: "115.112.44.19" },
  { id: "aud_4", timestamp: "2026-03-07 14:05:11", actor: "Aditya (Super Admin)", action: "FEATURE_FLAG_UPDATE", tenant: "All Tenants (Global)", ip: "49.205.12.8" },
  { id: "aud_5", timestamp: "2026-03-06 11:30:52", actor: "System Engine", action: "MONTHLY_INVOICE_GENERATED", tenant: "DLF Prime Developers", ip: "10.0.0.1" },
];

export const featureFlags = [
  { id: "ff_1", name: "AI Voice Bot Qualification", key: "ai_voice_qualification", description: "Automated real-time voice call bot for instant phone lead qualification.", rollout: "25%", status: "Beta", enabled: true },
  { id: "ff_2", name: "WhatsApp Cloud Interactive Buttons", key: "wa_interactive_buttons", description: "Support for dynamic list messages and quick reply templates.", rollout: "100%", status: "GA", enabled: true },
  { id: "ff_3", name: "Multi-Currency Billing (USD/AED)", key: "multi_currency_billing", description: "Enables international pricing for GCC and US expansion.", rollout: "10%", status: "Alpha", enabled: false },
  { id: "ff_4", name: "White-Label Custom Domains SSL", key: "whitelabel_custom_domains", description: "Automated Let's Encrypt SSL provisioning for agency custom domains.", rollout: "100%", status: "GA", enabled: true },
  { id: "ff_5", name: "Advanced SLA Escalation Webhooks", key: "sla_escalation_webhooks", description: "Dispatch webhooks to PagerDuty or Slack when 60s SLA is breached.", rollout: "50%", status: "Beta", enabled: true },
];

export const supportTickets = [
  { id: "TICK-901", tenant: "Prestige City Living", subject: "Meta Ads webhook latency during flash sale launch", priority: "High", status: "In Progress", createdDate: "2026-03-08" },
  { id: "TICK-902", tenant: "Jaipur Interiors Pvt Ltd", subject: "How to export pipeline deals to custom accounting format?", priority: "Medium", status: "Resolved", createdDate: "2026-03-07" },
  { id: "TICK-903", tenant: "Skyline High School Admissions", subject: "Update GSTIN number on tax invoices", priority: "Low", status: "Open", createdDate: "2026-03-06" },
  { id: "TICK-904", tenant: "Urban Nest Residences", subject: "Assistance configuring round-robin weighting for weekend shifts", priority: "Medium", status: "Open", createdDate: "2026-03-05" },
];

export const integrationHealth = [
  { id: "int_1", name: "Meta Graph API (Facebook/Instagram)", endpoint: "graph.facebook.com/v19.0", status: "Healthy", latency: "142ms", uptime: "99.98%", errors24h: 3 },
  { id: "int_2", name: "WhatsApp Cloud API", endpoint: "graph.facebook.com/v19.0/messages", status: "Healthy", latency: "98ms", uptime: "100%", errors24h: 0 },
  { id: "int_3", name: "Razorpay Payment Gateway", endpoint: "api.razorpay.com/v1", status: "Healthy", latency: "165ms", uptime: "99.95%", errors24h: 1 },
  { id: "int_4", name: "Twilio Telephony & SMS", endpoint: "api.twilio.com/2010-04-01", status: "Degraded", latency: "420ms", uptime: "98.80%", errors24h: 42 },
  { id: "int_5", name: "SendGrid Transactional Email", endpoint: "api.sendgrid.com/v3", status: "Healthy", latency: "110ms", uptime: "99.99%", errors24h: 0 },
];
