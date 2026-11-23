"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, Cloud, KeyRound, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappAccountsApi } from "@/lib/api/whatsapp";
import { cn } from "@/lib/utils";

/** Loads Meta's JS SDK once. */
function loadFacebookSdk(appId, version) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No browser"));
    const init = () => {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      resolve(window.FB);
    };
    if (window.FB) return init();
    window.fbAsyncInit = init;
    if (!document.getElementById("facebook-jssdk")) {
      const s = document.createElement("script");
      s.id = "facebook-jssdk";
      s.src = "https://connect.facebook.net/en_US/sdk.js";
      s.async = true;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.onerror = () => reject(new Error("Could not load Facebook SDK (blocked by the browser?)"));
      document.body.appendChild(s);
    }
  });
}

const METHODS = [
  {
    id: "coexistence",
    icon: Smartphone,
    title: "WhatsApp Business app number",
    text: "Keep using the WhatsApp Business app on the phone. Chats sync to the CRM and you can reply from both.",
  },
  {
    id: "cloud",
    icon: Cloud,
    title: "New number on the Cloud API",
    text: "A number not used in any WhatsApp app. Best for high-volume campaigns.",
  },
  {
    id: "manual",
    icon: KeyRound,
    title: "Enter IDs and token manually",
    text: "Already set up in Meta Business Manager? Paste the phone number ID, WABA ID and a permanent token.",
  },
];

/**
 * Connects another WhatsApp number to the workspace. Every number is its own channel; a
 * workspace can connect as many as it needs.
 */
export function ConnectNumberDialog({ open, onOpenChange, onConnected }) {
  const [method, setMethod] = useState("coexistence");
  const [config, setConfig] = useState(null);
  const [label, setLabel] = useState("");
  const [manual, setManual] = useState({ phoneNumberId: "", wabaId: "", accessToken: "" });
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState(null);
  const session = useRef({ code: null, info: null });

  useEffect(() => {
    if (!open) return;
    setPin(null);
    session.current = { code: null, info: null };
    whatsappAccountsApi.signupConfig().then(setConfig).catch(() => setConfig({ enabled: false, missing: [] }));
  }, [open]);

  const finish = useCallback(async () => {
    const { code, info } = session.current;
    if (!code || !info) return;
    session.current = { code: null, info: null };
    try {
      const account = await whatsappAccountsApi.completeSignup({
        code,
        phoneNumberId: info.phone_number_id,
        wabaId: info.waba_id,
        coexistence: method === "coexistence",
        label: label.trim() || undefined,
      });
      toast.success(`${account.displayPhoneNumber || "Number"} connected`);
      onConnected?.(account);
      if (account.twoStepPin) setPin(account.twoStepPin);
      else onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || "Could not finish connecting the number");
    } finally {
      setBusy(false);
    }
  }, [label, method, onConnected, onOpenChange]);

  // Embedded Signup reports the chosen WABA / number through postMessage.
  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      let host;
      try { host = new URL(event.origin).hostname; } catch { return; }
      if (host !== "facebook.com" && !host.endsWith(".facebook.com")) return;
      let data;
      try { data = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (String(data.event).startsWith("FINISH")) {
        session.current.info = data.data;
        finish();
      } else if (data.event === "CANCEL") {
        setBusy(false);
        toast.message(data.data?.current_step ? `Signup stopped at: ${data.data.current_step}` : "Signup cancelled");
      } else if (data.event === "ERROR") {
        setBusy(false);
        toast.error(data.data?.error_message || "Meta reported an error during signup");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [open, finish]);

  const launchSignup = async () => {
    if (!config?.enabled) return;
    setBusy(true);
    try {
      const FB = await loadFacebookSdk(config.appId, config.graphVersion);
      FB.login((response) => {
        const code = response?.authResponse?.code;
        if (!code) { setBusy(false); return; }
        session.current.code = code;
        finish();
      }, {
        config_id: config.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          sessionInfoVersion: "3",
          ...(method === "coexistence" ? { featureType: "whatsapp_business_app_onboarding" } : {}),
        },
      });
    } catch (e) {
      setBusy(false);
      toast.error(e?.message || "Could not open Facebook");
    }
  };

  const connectManual = async () => {
    setBusy(true);
    try {
      const account = await whatsappAccountsApi.connect({
        phoneNumberId: manual.phoneNumberId.trim(),
        wabaId: manual.wabaId.trim(),
        accessToken: manual.accessToken.trim(),
        label: label.trim() || undefined,
      });
      toast.success(`${account.displayPhoneNumber || "Number"} connected`);
      onConnected?.(account);
      setManual({ phoneNumberId: "", wabaId: "", accessToken: "" });
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || "Meta did not accept these details");
    } finally {
      setBusy(false);
    }
  };

  const manualReady = /^\d{6,}$/.test(manual.phoneNumberId.trim()) && /^\d{6,}$/.test(manual.wabaId.trim()) && manual.accessToken.trim().length > 20;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-semibold">Connect a WhatsApp number</DialogTitle>
          <DialogDescription>Each number becomes its own inbox channel and can send campaigns with its own templates.</DialogDescription>
        </DialogHeader>

        {pin ? (
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-md border border-border p-4">
              <ShieldCheck className="h-5 w-5 text-success shrink-0" aria-hidden />
              <div className="space-y-1">
                <p className="text-sm font-medium">Number registered. Save its two-step verification PIN:</p>
                <p className="font-mono text-2xl tracking-[0.3em] tabular">{pin}</p>
                <p className="text-xs text-muted-foreground">Meta asks for this PIN if the number is ever re-registered. It is not shown again.</p>
              </div>
            </div>
            <DialogFooter><Button size="sm" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="How to connect">
              {METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)}
                    className={cn("text-left rounded-md border p-3 space-y-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      method === m.id ? "border-primary bg-accent" : "border-border hover:bg-muted/60")}>
                    <Icon className={cn("h-4 w-4", method === m.id ? "text-primary" : "text-muted-foreground")} aria-hidden />
                    <span className="block text-xs font-semibold leading-snug">{m.title}</span>
                    <span className="block text-2xs text-muted-foreground leading-snug">{m.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cn-label" className="text-xs">Name for this number (optional)</Label>
              <Input id="cn-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={100} placeholder="Sales line, Support, Rahul's phone…" className="h-8 text-xs" />
            </div>

            {method === "manual" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cn-pnid" className="text-xs">Phone number ID</Label>
                  <Input id="cn-pnid" inputMode="numeric" value={manual.phoneNumberId} onChange={(e) => setManual((s) => ({ ...s, phoneNumberId: e.target.value }))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cn-waba" className="text-xs">WhatsApp Business Account ID</Label>
                  <Input id="cn-waba" inputMode="numeric" value={manual.wabaId} onChange={(e) => setManual((s) => ({ ...s, wabaId: e.target.value }))} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cn-token" className="text-xs">Permanent access token (System User)</Label>
                  <Input id="cn-token" type="password" autoComplete="off" value={manual.accessToken} onChange={(e) => setManual((s) => ({ ...s, accessToken: e.target.value }))} className="h-8 text-xs font-mono" />
                  <p className="text-2xs text-muted-foreground">Checked with Meta on the server and stored encrypted. Needs whatsapp_business_messaging and whatsapp_business_management.</p>
                </div>
              </div>
            ) : config && !config.enabled ? (
              <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden />
                <span>
                  Facebook signup is not set up for this workspace yet{config.missing?.length ? <> — missing <span className="font-mono">{config.missing.join(", ")}</span></> : null}.
                  Add them under “Meta app and webhook” on this page, or use “Enter IDs and token manually”.
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {method === "coexistence"
                  ? "A Facebook window opens. Choose your business, enter the WhatsApp Business app number, then confirm on the phone (WhatsApp → Settings → Business tools). Last 6 months of chats can be shared."
                  : "A Facebook window opens. Pick or create a business account and verify the new number with an SMS or call code."}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
              {method === "manual" ? (
                <Button size="sm" onClick={connectManual} disabled={!manualReady || busy}>
                  {busy && <Loader2 className="animate-spin" />} Verify & connect
                </Button>
              ) : (
                <Button size="sm" onClick={launchSignup} disabled={!config?.enabled || busy}>
                  {busy && <Loader2 className="animate-spin" />} Continue with Facebook
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
