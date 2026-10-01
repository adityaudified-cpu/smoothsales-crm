import React from "react";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TouchStatusIcons renders 3 compact channel icons (WhatsApp, Email, Called)
 * displaying immediate inline automation & outreach signal on table rows.
 */
export function TouchStatusIcons({ touchStatus = {}, className = "" }) {
  const { whatsapp = false, email = false, called = false } = touchStatus || {};

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`Touch status: WhatsApp ${whatsapp ? "sent" : "pending"}, Email ${
        email ? "sent" : "pending"
      }, Call ${called ? "logged" : "pending"}`}
    >
      {/* WhatsApp */}
      <span
        title={whatsapp ? "WhatsApp message delivered" : "WhatsApp not sent"}
        className={cn(
          "inline-flex items-center justify-center p-0.5 rounded transition-colors",
          whatsapp
            ? "text-success bg-success/10"
            : "text-muted-foreground/30 bg-muted/40"
        )}
      >
        <MessageCircle
          className={cn(
            "h-3.5 w-3.5",
            whatsapp ? "fill-success/20 stroke-[2.2]" : "stroke-[1.5]"
          )}
        />
      </span>

      {/* Email */}
      <span
        title={email ? "Email campaign delivered" : "Email not sent"}
        className={cn(
          "inline-flex items-center justify-center p-0.5 rounded transition-colors",
          email
            ? "text-success bg-success/10"
            : "text-muted-foreground/30 bg-muted/40"
        )}
      >
        <Mail
          className={cn(
            "h-3.5 w-3.5",
            email ? "fill-success/20 stroke-[2.2]" : "stroke-[1.5]"
          )}
        />
      </span>

      {/* Called */}
      <span
        title={called ? "Call completed by sales rep" : "Not called yet"}
        className={cn(
          "inline-flex items-center justify-center p-0.5 rounded transition-colors",
          called
            ? "text-success bg-success/10"
            : "text-muted-foreground/30 bg-muted/40"
        )}
      >
        <Phone
          className={cn(
            "h-3.5 w-3.5",
            called ? "fill-success/20 stroke-[2.2]" : "stroke-[1.5]"
          )}
        />
      </span>
    </div>
  );
}
