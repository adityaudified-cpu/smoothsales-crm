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

export function TradeIndiaLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0052CC" />
      <path d="M6 10h20v4H18v12h-4V14H6v-4z" fill="#FFFFFF" />
      <circle cx="24" cy="22" r="3" fill="#FFAB00" />
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

export function HousingLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#00B074" />
      <path d="M16 6L6 15h4v11h12V15h4L16 6zm0 4.2l6 5.4V24h-4v-6h-4v6h-4v-8.4l6-5.4z" fill="#FFFFFF" />
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

export function NoBrokerLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#E61E2A" />
      <path d="M16 6l-8 7v12h6v-6h4v6h6V13l-8-7z" fill="#FFFFFF" />
      <circle cx="16" cy="18" r="1.5" fill="#E61E2A" />
    </svg>
  );
}

export function SulekhaLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#FF5722" />
      <path
        d="M21 11c-1.5-1.5-3.5-2-5.5-1.5-2.5.6-4.5 2.8-4.5 5.5 0 3 2.5 5.5 5.5 5.5 2 0 3.8-.9 5-2.5l-2.2-1.5c-.7.9-1.7 1.5-2.8 1.5-1.7 0-3-1.3-3-3s1.3-3 3-3c1.1 0 2.1.6 2.6 1.5L21 11z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function ExportersIndiaLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0D47A1" />
      <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeWidth="2" fill="none" />
      <path d="M7 16h18M16 7c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function AndroidLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#3DDC84" />
      {/* Android Robot Head */}
      <path
        d="M10 18a6 6 0 0112 0H10z"
        fill="#FFFFFF"
      />
      {/* Eyes */}
      <circle cx="13" cy="15.5" r="0.75" fill="#3DDC84" />
      <circle cx="19" cy="15.5" r="0.75" fill="#3DDC84" />
      {/* Antennas */}
      <line x1="12" y1="12" x2="10.5" y2="9.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20" y1="12" x2="21.5" y2="9.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      {/* Body */}
      <path d="M10 19.5h12v5a2 2 0 01-2 2h-8a2 2 0 01-2-2v-5z" fill="#FFFFFF" />
      <line x1="12.5" y1="26.5" x2="12.5" y2="29" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19.5" y1="26.5" x2="19.5" y2="29" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WordPressLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#21759B" />
      <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <path
        d="M9.5 16c0 2.8 1.8 5.2 4.3 6.1L10.3 12.3c-.5 1.1-.8 2.4-.8 3.7zm10.7-3.4c.3.5.5 1.1.5 1.7 0 1.2-.6 2.3-1.2 3.4l-2.4 6.8c1.8-.7 3.1-2.2 3.6-4.1l-.5-7.8zm-7.6 9.8l2.6-7.5-1.5-4.2c-.3 0-.6.1-.9.1h-.2l3.4 9.6-3.4 2zm3.4-3.2l1.6-4.7c-.5 0-.9-.1-1.3-.1h-.3l-1.3 4.8 1.3 0z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function ZapierLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#FF4A00" />
      <path
        d="M16 8v16M8 16h16M10.3 10.3l11.4 11.4M21.7 10.3L10.3 21.7"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PabblyLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#00C292" />
      <path d="M10 11h7a4 4 0 014 4 4 4 0 01-4 4h-4v4h-3V11zm3 5h4a1.5 1.5 0 000-3h-4v3z" fill="#FFFFFF" />
      <circle cx="23" cy="11" r="2" fill="#FFFFFF" />
    </svg>
  );
}

export function MakeLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#6D28D9" />
      <path
        d="M8 12l8-5 8 5v10l-8 5-8-5V12zm8-2.5L10.5 14 16 17.5 21.5 14 16 9.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WhatsAppWidgetLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#25D366" />
      <path
        d="M9 10a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 3v-3h-2a2 2 0 01-2-2v-8z"
        fill="#FFFFFF"
      />
      <circle cx="13" cy="14" r="1.2" fill="#25D366" />
      <circle cx="16" cy="14" r="1.2" fill="#25D366" />
      <circle cx="19" cy="14" r="1.2" fill="#25D366" />
    </svg>
  );
}

export function GmailLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#F1F3F4" stroke="#E0E0E0" />
      <path d="M8 11l8 6 8-6v11a1 1 0 01-1 1H9a1 1 0 01-1-1V11z" fill="#EA4335" opacity="0.9" />
      <path d="M8 11l8 6 8-6H8z" fill="#EA4335" />
      <path d="M8 11v11h4V14l4 3 4-3v8h4V11l-8 6-8-6z" fill="#D93025" />
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

export function KnowlarityLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#E65100" />
      <path d="M10 8h4v7l6-7h5l-7 8 8 8h-5l-6-7v7h-4V8z" fill="#FFFFFF" />
    </svg>
  );
}

export function CallerDeskLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#6A1B9A" />
      <path d="M8 12a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4h-8a4 4 0 01-4-4v-8zm4 0v8h8v-8h-8z" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="2" fill="#00E676" />
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
        d="M16 6a10 10 0 00-7.07 17.07l1.41-1.41A8 8 0 1116 24v-2a6 6 0 10-6-6H8a8 8 0 118 8v2a10 10 0 000-20z"
        fill="#FFFFFF"
      />
      <circle cx="16" cy="16" r="3" fill="#34D399" />
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

export function WebsiteLogo({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0284C7" />
      <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="4.5" ry="9" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M7 16h18" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 11h13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <path d="M9.5 21h13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/**
 * Universal logo resolver based on integration key.
 */
export function getIntegrationLogo(key, className = "h-6 w-6") {
  const k = (key || "").toLowerCase();
  switch (k) {
    case "meta_ads":
    case "meta_capi":
    case "instagram_ads":
    case "instagram_dm":
      return <MetaLogo className={className} />;
    case "google_ads":
    case "google_oci":
    case "google_forms":
      return <GoogleLogo className={className} />;
    case "website":
    case "website_form":
    case "website_webhook":
      return <WebsiteLogo className={className} />;
    case "whatsapp":
      return <WhatsAppLogo className={className} />;
    case "whatsapp_widget":
      return <WhatsAppWidgetLogo className={className} />;
    case "indiamart":
      return <IndiaMartLogo className={className} />;
    case "trade_india":
      return <TradeIndiaLogo className={className} />;
    case "99acres":
      return <Acres99Logo className={className} />;
    case "magicbricks":
      return <MagicBricksLogo className={className} />;
    case "housing":
      return <HousingLogo className={className} />;
    case "nobroker":
      return <NoBrokerLogo className={className} />;
    case "sulekha":
      return <SulekhaLogo className={className} />;
    case "exporters_india":
    case "exportersindia":
      return <ExportersIndiaLogo className={className} />;
    case "android_companion":
    case "android":
      return <AndroidLogo className={className} />;
    case "wordpress":
    case "wpforms":
      return <WordPressLogo className={className} />;
    case "zapier":
      return <ZapierLogo className={className} />;
    case "pabbly":
    case "pabbly_connect":
      return <PabblyLogo className={className} />;
    case "make":
    case "n8n":
      return <MakeLogo className={className} />;
    case "gmail_parser":
    case "gmail":
      return <GmailLogo className={className} />;
    case "justdial":
      return <JustdialLogo className={className} />;
    case "openai":
      return <OpenAILogo className={className} />;
    case "exotel":
      return <ExotelLogo className={className} />;
    case "knowlarity":
      return <KnowlarityLogo className={className} />;
    case "caller_desk":
    case "bon_voice":
    case "tata_tele":
      return <CallerDeskLogo className={className} />;
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
    case "website":
    case "website_webhook":
    case "outbound_webhook":
    default:
      return <WebhookFormLogo className={className} />;
  }
}
