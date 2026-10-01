/**
 * SmoothSales.ai Onboarding Call Outcomes Mock Data
 * Aligned with the platform's 7 fixed lead statuses:
 * ["New", "Not Connected", "Connected", "Not Interested", "Junk", "Qualified", "Converted"]
 */

export const INITIAL_CALL_OUTCOMES = {
  positive: [
    {
      id: "outcome_interested",
      label: "Interested",
      mapsToStatus: "Qualified",
      autoCreateDeal: true,
      enabled: true,
    },
    {
      id: "outcome_demo_req",
      label: "Demo Requested",
      mapsToStatus: "Qualified",
      autoCreateDeal: false,
      enabled: true,
    },
    {
      id: "outcome_site_visit",
      label: "Site Visit Scheduled",
      mapsToStatus: "Qualified",
      autoCreateDeal: true,
      enabled: true,
    },
  ],
  neutral: [
    {
      id: "outcome_callback",
      label: "Call Back",
      mapsToStatus: "Connected",
      autoCreateDeal: false,
      enabled: true,
    },
    {
      id: "outcome_need_details",
      label: "Need Details / Brochure",
      mapsToStatus: "Connected",
      autoCreateDeal: false,
      enabled: true,
    },
    {
      id: "outcome_dm_busy",
      label: "Decision Maker Unavailable",
      mapsToStatus: "Connected",
      autoCreateDeal: false,
      enabled: true,
    },
  ],
  negative: [
    {
      id: "outcome_not_interested",
      label: "Not Interested",
      mapsToStatus: "Not Interested",
      autoCloseLead: true,
      enabled: true,
    },
    {
      id: "outcome_no_eligibility",
      label: "No Eligibility / Out of Budget",
      mapsToStatus: "Junk",
      autoCloseLead: true,
      enabled: true,
    },
    {
      id: "outcome_fake_enquiry",
      label: "Wrong Number / Fake Enquiry",
      mapsToStatus: "Junk",
      autoCloseLead: true,
      enabled: true,
    },
  ],
  // Standard call-attempt outcomes (always included, non-editable platform standard)
  notConnected: [
    { id: "rnr", label: "RNR (Ringing No Response)", mapsToStatus: "Not Connected" },
    { id: "busy", label: "Busy / Line Engaged", mapsToStatus: "Not Connected" },
    { id: "switched_off", label: "Switched Off", mapsToStatus: "Not Connected" },
    { id: "not_reachable", label: "Not Reachable", mapsToStatus: "Not Connected" },
    { id: "cut_call", label: "Cut the Call", mapsToStatus: "Not Connected" },
    { id: "invalid_num", label: "Invalid / Disconnected Number", mapsToStatus: "Not Connected" },
  ],
};
