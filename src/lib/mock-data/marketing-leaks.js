export const MARKETING_LEAKS = [
  {
    id: "scattered-leads",
    tabLabel: "Lead capture",
    leakLabel: "Leak 01",
    headline: "Leads scatter across five different channels.",
    description:
      "A WhatsApp enquiry, a field partner's walk-in, an affiliate referral, and a Meta ad lead all land in different places — by the time anyone notices, the competitor already called back.",
    fixItems: [
      "Every channel feeds one unified lead record",
      "Rule-based routing assigns the right rep in under 2 seconds",
      "Partner and referral attribution locked automatically for 30 days",
    ],
    impactStat: "2s",
    impactLabel: "average lead assignment time",
    liveFeedTitle: "LEAD CAPTURE · LIVE FEED",
    liveFeedEvents: [
      { time: "10:02 AM", text: "Auto-assigned to Priya Nair", sub: "Based on territory + availability", tone: "primary" },
      { time: "10:03 AM", text: "First call connected — 52s", sub: "Round Robin, Jaipur Team", tone: "success" },
      { time: "10:05 AM", text: "New lead from IndiaMART", sub: "Kailash Bisht · 3BHK Interior", tone: "warning" },
      { time: "10:06 AM", text: "Auto-assigned to Karan Mehta", sub: "Weighted Round Robin", tone: "primary" },
    ],
  },
  {
    id: "commission-confusion",
    tabLabel: "Partner attribution",
    leakLabel: "Leak 02",
    headline: "Brokers and affiliates argue over who brought the deal.",
    description:
      "Spreadsheets lose track of first touch, partner disputes delay closings, and finance spends 4 days every month recalculating tiered commissions and TDS deductions by hand.",
    fixItems: [
      "30-day cookie and phone lock guarantees first-touch attribution",
      "Automated 3-tier commission split calculated the second a token is paid",
      "Broker self-serve portal with real-time payout tracking and GST invoice uploads",
    ],
    impactStat: "100%",
    impactLabel: "dispute-free commission payouts",
    liveFeedTitle: "PARTNER LEDGER · LIVE FEED",
    liveFeedEvents: [
      { time: "10:11 AM", text: "Token paid: ₹50,000 via Razorpay", sub: "Sobha Dream Acres · Deal #SS-891", tone: "success" },
      { time: "10:11 AM", text: "Commission credited: ₹18,500", sub: "Channel Partner: Apex Realty Solutions", tone: "primary" },
      { time: "10:12 AM", text: "TDS (5%) deducted automatically", sub: "Section 194H ledger entry verified", tone: "neutral" },
      { time: "10:14 AM", text: "Payout alert sent on WhatsApp", sub: "Delivered to Partner Admin (Vikram Seth)", tone: "success" },
    ],
  },
  {
    id: "forgotten-followups",
    tabLabel: "Follow-up SLA",
    leakLabel: "Leak 03",
    headline: "High-intent buyers go cold because reps forget the 24h follow-up.",
    description:
      "Sales reps take notes in WhatsApp personal chats and diaries. When someone takes a sick day or gets overwhelmed, leads slip past the critical 48-hour decision window without a whisper.",
    fixItems: [
      "Sub-60s automated WhatsApp greeting with dynamic catalog links",
      "SLA breach warnings auto-escalate stalled leads to squad managers",
      "1-click WhatsApp web dialer logs call duration and outcome immediately",
    ],
    impactStat: "< 60s",
    impactLabel: "first-contact response time",
    liveFeedTitle: "FOLLOW-UP CADENCE · LIVE FEED",
    liveFeedEvents: [
      { time: "10:20 AM", text: "SLA alert: 15m without response", sub: "Lead: Rohan Verma · ₹45L Budget", tone: "warning" },
      { time: "10:21 AM", text: "Escalated to Manager: Amit Sharma", sub: "Auto-reassigned to active rep Ananya", tone: "destructive" },
      { time: "10:22 AM", text: "WhatsApp template sent + read", sub: "Brochure PDF opened via tracking link", tone: "success" },
      { time: "10:24 AM", text: "Site visit booked for Saturday", sub: "Calendar invite synced to buyer WhatsApp", tone: "primary" },
    ],
  },
  {
    id: "manager-blindspots",
    tabLabel: "Manager visibility",
    leakLabel: "Leak 04",
    headline: "Managers have zero visibility into distributed field reps.",
    description:
      "Daily status calls waste 45 minutes asking 'kya hua lead ka?'. Leadership only discovers a branch missed its monthly target on the 29th when it's too late to intervene.",
    fixItems: [
      "Live rep activity timeline tracks calls, site visits, and quotes real-time",
      "Branch vs. branch revenue pacing gauges month-to-date target vs. actual",
      "AI conversion bottleneck alerts flag stages where deals stall the longest",
    ],
    impactStat: "3.4x",
    impactLabel: "higher pipeline velocity per rep",
    liveFeedTitle: "FIELD ACTIVITY · LIVE FEED",
    liveFeedEvents: [
      { time: "10:30 AM", text: "GPS Check-in: Sector 62 Site", sub: "Rep: Rajesh Kumar · Verified at location", tone: "primary" },
      { time: "10:34 AM", text: "Quotation generated: ₹1.2 Cr", sub: "Sent via WhatsApp Cloud API with PDF", tone: "success" },
      { time: "10:38 AM", text: "Pacing milestone: 85% of monthly quota", sub: "Gurugram Branch #1 on Leaderboard", tone: "success" },
      { time: "10:41 AM", text: "Deal stage advanced: Negotiation", sub: "Discount approved by Regional Director", tone: "primary" },
    ],
  },
];
