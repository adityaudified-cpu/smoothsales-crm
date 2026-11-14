import React from "react";

/**
 * Authentic vector brand logos for enterprise CRM integrations.
 * Scalable, pixel-perfect SVGs matching official brand identities.
 */

export function MetaLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M448 256c0-63.5-31.5-117.8-82.6-149.8-51.1-32-118-32-169.1 0-21.4 13.4-38.6 30.6-52.3 50.4-13.7-19.8-30.9-37-52.3-50.4-51.1-32-118-32-169.1 0C22.6 138.2 0 192.5 0 256s22.6 117.8 72.6 149.8c51.1 32 118 32 169.1 0 21.4-13.4 38.6-30.6 52.3-50.4 13.7 19.8 30.9 37 52.3 50.4 51.1 32 118 32 169.1 0C425.4 373.8 448 319.5 448 256z"
        fill="url(#meta-gradient)"
      />
      <path
        d="M260.4 256c0-48.6-26.6-90-67.6-112.4-41-22.4-90.8-19.6-129.2 7.3C25.2 177.8 0 214.9 0 256s25.2 78.2 63.6 105.1c38.4 26.9 88.2 29.7 129.2 7.3 41-22.4 67.6-63.8 67.6-112.4z"
        fill="#0866FF"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="meta-gradient" x1="0" y1="76" x2="448" y2="436" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0064E0" />
          <stop offset="0.4" stopColor="#0082FB" />
          <stop offset="0.8" stopColor="#00A2FF" />
          <stop offset="1" stopColor="#00C4FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GoogleLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function WhatsAppLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.174L2.094 21.68a.75.75 0 00.916.916l4.634-1.39A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-4.293 6.207a1 1 0 00-1.414 0c-.39.39-.793 1.018-.793 1.793 0 1.503.957 3.328 2.5 4.871 1.543 1.543 3.368 2.5 4.871 2.5.775 0 1.403-.403 1.793-.793a1 1 0 000-1.414l-1.5-1.5a1 1 0 00-1.414 0l-.354.353a.5.5 0 01-.638.064c-.663-.442-1.464-1.243-1.906-1.906a.5.5 0 01.064-.638l.353-.354a1 1 0 000-1.414l-1.5-1.5z"
        fill="#25D366"
      />
    </svg>
  );
}

export function IndiaMartLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#D92228" />
      <path d="M7 11h4v10H7V11zm7-4h4v14h-4V7zm7 6h4v8h-4v-8z" fill="#FFFFFF" />
      <circle cx="23" cy="9" r="2" fill="#2ECC71" />
    </svg>
  );
}

export function Acres99Logo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0A3C94" />
      <path
        d="M7 19c0-3.3 2.7-6 6-6h2v6H9v1h6v2H9c-1.1 0-2-.9-2-2v-1zm12-6c3.3 0 6 2.7 6 6v1c0 1.1-.9 2-2 2h-6v-2h6v-1h-6v-6h2zm-4 4h2v-2h-2v2z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MagicBricksLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#D8232A" />
      <path
        d="M16 6l-9 8v12h6v-7h6v7h6V14l-9-8zm0 3.3L22 15v8h-3v-7h-6v7h-3v-8l6-5.7z"
        fill="#FFFFFF"
      />
      <rect x="14" y="10" width="4" height="3" rx="0.5" fill="#FFC800" />
    </svg>
  );
}

export function JustdialLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#F86D1A" />
      <text x="6" y="22" fill="#FFFFFF" fontFamily="sans-serif" fontSize="13" fontWeight="bold">
        JD
      </text>
    </svg>
  );
}

export function OpenAILogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.28 9.87a5.98 5.98 0 00-.51-4.88 6.06 6.06 0 00-6.52-2.88A6.02 6.02 0 0010.5 4a6.04 6.04 0 00-4.63 2.18 6.05 6.05 0 00-1.8 5.07 5.99 5.99 0 00.51 4.88 6.06 6.06 0 006.52 2.88A6.02 6.02 0 0013.5 20a6.04 6.04 0 004.63-2.18 6.05 6.05 0 001.8-5.07l2.35-.88z"
        stroke="#10A37F"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExotelLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1C3D82" />
      <path
        d="M8 12c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4h-8c-2.2 0-4-1.8-4-4v-8zm8-1a5 5 0 100 10 5 5 0 000-10zm0 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function RazorpayLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0C2340" />
      <path
        d="M17.5 7L10 18h6l-3.5 8L23 15h-6.5l3.5-8h-2.5z"
        fill="#0C6BFA"
      />
    </svg>
  );
}

export function CashfreeLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#008080" />
      <path
        d="M10 11c0-1.7 1.3-3 3-3h6v3h-6v4h5v3h-5v6h-3V11zm11 3c0-1.7 1.3-3 3-3h2v3h-2v10h-3V14z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function GoogleSheetsLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0F9D58" />
      <path d="M9 7h9l6 6v12a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z" fill="#FFFFFF" opacity="0.9" />
      <path d="M18 7l6 6h-6V7z" fill="#0B8043" />
      <path d="M12 17h8v2h-8v-2zm0 3h8v2h-8v-2zm0-6h4v2h-4v-2z" fill="#0F9D58" />
    </svg>
  );
}

export function CalendlyLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#006BFF" />
      <path
        d="M16 9c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c1.4 0 2.6.6 3.4 1.6l-1.8 1.8c-.4-.5-.9-.9-1.6-.9-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5c.7 0 1.2-.4 1.6-.9l1.8 1.8c-.8 1-2 1.6-3.4 1.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function GoogleMeetLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1A73E8" />
      <path d="M8 11a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2h-8a2 2 0 01-2-2V11z" fill="#FFFFFF" />
      <path d="M20 14l5-3v10l-5-3v-4z" fill="#34A853" />
    </svg>
  );
}

export function WebhookFormLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#059669" />
      <path
        d="M11 12l-4 4 4 4m10-8l4 4-4 4m-3-9l-4 10"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JotformLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#FF6100" />
      <path
        d="M9 10h14v3H9v-3zm0 5h14v3H9v-3zm0 5h9v3H9v-3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Universal logo resolver based on integration key.
 */
export function getIntegrationLogo(key, className = "h-6 w-6") {
  switch (key.toLowerCase()) {
    case "meta_ads":
    case "meta_capi":
    case "instagram_ads":
      return <MetaLogo className={className} />;
    case "google_ads":
    case "google_oci":
    case "google_forms":
      return <GoogleLogo className={className} />;
    case "whatsapp":
      return <WhatsAppLogo className={className} />;
    case "indiamart":
      return <IndiaMartLogo className={className} />;
    case "99acres":
      return <Acres99Logo className={className} />;
    case "magicbricks":
      return <MagicBricksLogo className={className} />;
    case "justdial":
      return <JustdialLogo className={className} />;
    case "openai":
      return <OpenAILogo className={className} />;
    case "exotel":
      return <ExotelLogo className={className} />;
    case "razorpay":
      return <RazorpayLogo className={className} />;
    case "cashfree":
      return <CashfreeLogo className={className} />;
    case "google_sheets":
      return <GoogleSheetsLogo className={className} />;
    case "calendly":
      return <CalendlyLogo className={className} />;
    case "google_meet":
      return <GoogleMeetLogo className={className} />;
    case "jotform":
      return <JotformLogo className={className} />;
    case "website_webhook":
    default:
      return <WebhookFormLogo className={className} />;
  }
}

