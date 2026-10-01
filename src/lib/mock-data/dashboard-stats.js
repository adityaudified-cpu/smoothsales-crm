export const DASHBOARD_STATS = {
  newLeadsToday: {
    label: "New Leads Today",
    value: "28",
    deltaText: "+14.2% from yesterday",
    deltaTone: "success",
  },
  avgAssignmentTime: {
    label: "Avg. Assignment Time",
    value: "1.4s",
    deltaText: "Within 5s SLA",
    deltaTone: "success",
  },
  qualifiedThisWeek: {
    label: "Qualified This Week",
    value: "46",
    deltaText: "+8.5% vs last week",
    deltaTone: "success",
  },
  followUpsDueToday: {
    label: "Follow-ups Due Today",
    value: "19",
    deltaText: "4 overdue",
    deltaTone: "warning",
  },
};

export const RECENT_ACTIVITY_EVENTS = [
  {
    id: "act_1",
    title: "Call logged — Interested",
    leadName: "Aditya Narayan",
    company: "Apex Tech Logistics",
    time: "4 min ago",
    agent: "Aarav Sharma",
  },
  {
    id: "act_2",
    title: "Lead reassigned to Enterprise Pool",
    leadName: "Meera Kulkarni",
    company: "Sudarshan Healthtech",
    time: "18 min ago",
    agent: "System Engine",
  },
  {
    id: "act_3",
    title: "WhatsApp brochure template delivered",
    leadName: "Rajeshwar Iyer",
    company: "Trident Engineering",
    time: "32 min ago",
    agent: "Vikram Singhania",
  },
  {
    id: "act_4",
    title: "Deal stage moved to Proposal Sent",
    leadName: "Kavita Nair",
    company: "Zenith Retail",
    time: "1 hour ago",
    agent: "Pooja Deshmukh",
  },
  {
    id: "act_5",
    title: "Call attempted — RNR",
    leadName: "Sanjay Singhal",
    company: "Kisan Agro Export",
    time: "2 hours ago",
    agent: "Vikram Singhania",
  },
  {
    id: "act_6",
    title: "New inbound lead ingested via Meta Ads",
    leadName: "Harish Patel",
    company: "Gujarat Solar",
    time: "3 hours ago",
    agent: "Meta Webhook",
  },
];

export const LEAD_VOLUME_TREND_7D = [
  { day: "Mon", leads: 18, qualified: 8 },
  { day: "Tue", leads: 24, qualified: 11 },
  { day: "Wed", leads: 29, qualified: 14 },
  { day: "Thu", leads: 22, qualified: 9 },
  { day: "Fri", leads: 34, qualified: 16 },
  { day: "Sat", leads: 19, qualified: 7 },
  { day: "Sun", leads: 28, qualified: 12 },
];
