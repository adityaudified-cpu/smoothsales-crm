"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { MessageCircle, Send, RefreshCw, Globe, Users, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useWaAccounts } from "../wa-accounts-context";
import { whatsappTemplatesApi, waBridgeApi } from "@/lib/api/whatsapp";

// Modular Production-Grade Components
import { CredentialsModal } from "@/components/whatsapp/credentials-modal";
import { TestPingModal } from "@/components/whatsapp/test-ping-modal";
import { LinkPersonalModal } from "@/components/whatsapp/link-personal-modal";
import { AddRepModal } from "@/components/whatsapp/add-rep-modal";
import { TriggerConfigModal } from "@/components/whatsapp/trigger-config-modal";
import { ChannelsHealthTab } from "@/components/whatsapp/channels-health-tab";
import { LeadCaptureTab } from "@/components/whatsapp/lead-capture-tab";
import { AutomationTriggersTab, AUTOMATION_TRIGGERS_DEF } from "@/components/whatsapp/automation-triggers-tab";
import { SetupGuideTab, WEBHOOK_CALLBACK_URL, WEBHOOK_VERIFY_TOKEN } from "@/components/whatsapp/setup-guide-tab";

const LEAD_RULES_KEY = "wa_lead_capture_rules_v4";
const AUTO_RULES_KEY = "wa_auto_rules_v4";

export default function WhatsAppConnectPage() {
  const { accounts, metaAccount, addAccount, removeAccount, refreshAccounts } = useWaAccounts();
  const [activeTab, setActiveTab] = useState("connect");
  const [templateSyncing, setTemplateSyncing] = useState(false);

  // Modals
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [testPingModalOpen, setTestPingModalOpen] = useState(false);
  const [linkPersonalModalOpen, setLinkPersonalModalOpen] = useState(false);
  const [addRepModalOpen, setAddRepModalOpen] = useState(false);
  const [triggerConfigModalOpen, setTriggerConfigModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);

  // Live Backend & Bridge State
  const [liveApprovedTemplates, setLiveApprovedTemplates] = useState([]);
  const [bridgeStatus, setBridgeStatus] = useState({
    connected: false,
    state: "close",
    phone: null,
    pushname: null,
  });

  // Webhook Diagnostic State
  const [webhookChecking, setWebhookChecking] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  // Lead Rules (persisted)
  const [leadRules, setLeadRules] = useState(() => {
    try {
      const saved = localStorage.getItem(LEAD_RULES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      autoCreateLead: true,
      extractName: true,
      tagSource: true,
      sourceTag: "WhatsApp Inbound",
      aiBudgetParsing: true,
      highIntentDetection: true,
      highIntentKeywords: "pricing, quote, demo, discount, urgent, cost",
      filterSpam: true,
      notifyRep: true,
      autoAssign: true,
      routingPool: "inbound",
      slaWarning: true,
      slaMinutes: 15,
    };
  });

  // Automation Rules (persisted)
  const [autoRules, setAutoRules] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTO_RULES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial = {};
    AUTOMATION_TRIGGERS_DEF.forEach((r) => {
      initial[r.id] = { enabled: r.default, template: r.template, timing: r.timing };
    });
    return initial;
  });

  // Scroll Container Ref to maintain smooth view
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeTab]);

  // Poll Baileys Bridge Status
  const fetchBridgeStatus = useCallback(async () => {
    try {
      const res = await waBridgeApi.getStatus();
      if (res?.success && res?.data) {
        setBridgeStatus(res.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBridgeStatus();
    const interval = setInterval(fetchBridgeStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchBridgeStatus]);

  // Auto-close pairing modal when socket connects
  useEffect(() => {
    if (bridgeStatus.connected && linkPersonalModalOpen) {
      toast.success(`Personal WhatsApp connected: +${bridgeStatus.phone || ""}`);
      setLinkPersonalModalOpen(false);
    }
  }, [bridgeStatus.connected, linkPersonalModalOpen, bridgeStatus.phone]);

  // Load Approved Templates from backend
  useEffect(() => {
    whatsappTemplatesApi
      .getApproved()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveApprovedTemplates(data);
        }
      })
      .catch(() => {});
  }, []);

  // Filter personal accounts
  const personalAccounts = accounts.filter((a) => a.type === "personal");

  // ── Template Sync Handler ──────────────────────────────────────────────────
  const handleSyncTemplates = async () => {
    if (!metaAccount) {
      toast.error("Connect a WhatsApp Business Account before syncing templates.");
      setCredentialsModalOpen(true);
      return;
    }
    setTemplateSyncing(true);
    try {
      const res = await whatsappTemplatesApi.syncAll();
      const count = Array.isArray(res) ? res.length : 0;
      const approved = Array.isArray(res) ? res.filter((t) => t.status === "APPROVED") : [];
      setLiveApprovedTemplates(approved);
      toast.success(`Synced ${count} WhatsApp templates directly with Meta Graph API!`);
    } catch (err) {
      toast.error(err?.message || "Failed to sync templates with Meta. Please verify credentials.");
    } finally {
      setTemplateSyncing(false);
    }
  };

  // ── Disconnect Bridge Handler ──────────────────────────────────────────────
  const handleDisconnectBridge = async () => {
    try {
      const res = await waBridgeApi.logout();
      if (res?.success) {
        toast.success("Personal WhatsApp socket disconnected successfully.");
        setBridgeStatus({ connected: false, state: "close", phone: null, pushname: null });
      } else {
        toast.error(res?.message || "Failed to disconnect socket.");
      }
    } catch (e) {
      toast.error(e?.message || "Error disconnecting bridge socket.");
    }
  };

  // ── Save Lead Rules Handler ────────────────────────────────────────────────
  const handleSaveLeadRules = (rules) => {
    setLeadRules(rules);
    try {
      localStorage.setItem(LEAD_RULES_KEY, JSON.stringify(rules));
    } catch {}
  };

  // ── Save Automation Rules Handler ──────────────────────────────────────────
  const handleSaveAutoRules = () => {
    try {
      localStorage.setItem(AUTO_RULES_KEY, JSON.stringify(autoRules));
      toast.success("All 5 automation workflow rules saved successfully!");
    } catch {}
  };

  const handleOpenTriggerConfig = (trigger) => {
    setEditingTrigger(trigger);
    setTriggerConfigModalOpen(true);
  };

  const handleSaveSingleTrigger = (triggerId, config) => {
    setAutoRules((prev) => {
      const next = {
        ...prev,
        [triggerId]: {
          ...(prev[triggerId] || {}),
          template: config.template,
          timing: config.timing,
        },
      };
      try {
        localStorage.setItem(AUTO_RULES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // ── Run Webhook Diagnostic Challenge Check ─────────────────────────────────
  const runWebhookHealthCheck = async () => {
    setWebhookChecking(true);
    const startTime = performance.now();
    const challengeTest = `test_challenge_${Math.floor(Math.random() * 900000 + 100000)}`;

    try {
      const url = `${WEBHOOK_CALLBACK_URL}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
        WEBHOOK_VERIFY_TOKEN
      )}&hub.challenge=${challengeTest}`;

      const res = await fetch(url, { method: "GET" });
      const elapsed = Math.round(performance.now() - startTime);
      const text = await res.text();

      if (res.ok && text.trim() === challengeTest) {
        setWebhookResult({
          status: "success",
          statusCode: res.status,
          latency: `${elapsed} ms`,
          message: "Handshake verified! Server returned exact challenge echo.",
          timestamp: new Date().toLocaleTimeString(),
        });
        toast.success(`Webhook verified! Response time: ${elapsed}ms`);
      } else {
        setWebhookResult({
          status: "warning",
          statusCode: res.status,
          latency: `${elapsed} ms`,
          message: `Endpoint responded with status ${res.status}. Expected challenge echo.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setWebhookResult({
        status: "error",
        statusCode: 500,
        latency: `${elapsed} ms`,
        message: err?.message || "Could not reach webhook endpoint from browser context.",
        timestamp: new Date().toLocaleTimeString(),
      });
      toast.error("Webhook endpoint ping failed. Check Nginx proxy settings.");
    } finally {
      setWebhookChecking(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* ── Top Header Bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-card shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">
                WhatsApp Connection Hub
              </h1>
              {metaAccount && metaAccount.status === "CONNECTED" ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-0.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Meta Cloud API Active
                </Badge>
              ) : metaAccount ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1.5 py-0.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {metaAccount.status || "Needs Verification"}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-muted text-muted-foreground border-border gap-1.5 py-0.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  No WABA Connected
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Official WhatsApp Business Cloud API v19.0 · Multi-Channel Inbound Routing · Lead Automation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium rounded-xl"
            onClick={() => {
              if (!metaAccount) {
                toast.error("No WhatsApp channel connected. Please connect your Meta WABA account first.");
                setCredentialsModalOpen(true);
                return;
              }
              setTestPingModalOpen(true);
            }}
          >
            <Send className="h-3.5 w-3.5" />
            Send Test Ping
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium rounded-xl"
            onClick={handleSyncTemplates}
            disabled={templateSyncing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", templateSyncing && "animate-spin")} />
            {templateSyncing ? "Syncing..." : "Sync Templates"}
          </Button>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="shrink-0 px-6 pt-2 pb-0 border-b border-border bg-card/60">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            {
              id: "connect",
              label: "Channels & Health",
              icon: Globe,
              badge: `${accounts.filter((a) => a.type === "meta").length || (metaAccount ? 1 : 0)} Active`,
            },
            { id: "settings", label: "Lead Capture", icon: Users, badge: "9 Rules" },
            { id: "automation", label: "Automation Triggers", icon: Zap, badge: "5 Workflows" },
            { id: "setup", label: "Setup Guide & Webhooks", icon: HelpCircle, badge: "Diagnostic" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                  isActive
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                />
                {tab.label}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Scroll View ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {activeTab === "connect" && (
          <ChannelsHealthTab
            metaAccount={metaAccount}
            personalAccounts={personalAccounts}
            bridgeStatus={bridgeStatus}
            liveApprovedTemplates={liveApprovedTemplates}
            onOpenCredentialsModal={() => setCredentialsModalOpen(true)}
            onOpenLinkPersonalModal={() => setLinkPersonalModalOpen(true)}
            onOpenAddRepModal={() => setAddRepModalOpen(true)}
            onDisconnectBridge={handleDisconnectBridge}
            onRemovePersonalAccount={(id) => {
              removeAccount(id);
              toast.success("Sales Rep account unlinked from workspace.");
            }}
            onSwitchTab={(t) => setActiveTab(t)}
            onRunWebhookCheck={runWebhookHealthCheck}
            onRefreshAccounts={refreshAccounts}
          />
        )}

        {activeTab === "settings" && (
          <LeadCaptureTab initialRules={leadRules} onSave={handleSaveLeadRules} />
        )}

        {activeTab === "automation" && (
          <AutomationTriggersTab
            autoRules={autoRules}
            setAutoRules={setAutoRules}
            onOpenTriggerConfig={handleOpenTriggerConfig}
            onSaveRules={handleSaveAutoRules}
          />
        )}

        {activeTab === "setup" && (
          <SetupGuideTab
            webhookChecking={webhookChecking}
            webhookResult={webhookResult}
            onRunWebhookCheck={runWebhookHealthCheck}
          />
        )}
      </div>

      {/* ── Production-Grade Modals (React Hook Form + Zod) ── */}
      <CredentialsModal
        open={credentialsModalOpen}
        onOpenChange={setCredentialsModalOpen}
        metaAccount={metaAccount}
        onSave={async (vals) => {
          await addAccount({
            type: "meta",
            label: vals.label,
            phoneId: vals.phoneId,
            wabaId: vals.wabaId,
            token: vals.token,
          });
          await refreshAccounts();
        }}
      />

      <TestPingModal
        open={testPingModalOpen}
        onOpenChange={setTestPingModalOpen}
        metaAccount={metaAccount}
      />

      <LinkPersonalModal
        open={linkPersonalModalOpen}
        onOpenChange={setLinkPersonalModalOpen}
        bridgeStatus={bridgeStatus}
        onBridgeStatusRefresh={fetchBridgeStatus}
      />

      <AddRepModal
        open={addRepModalOpen}
        onOpenChange={setAddRepModalOpen}
        onAddAccount={async (acc) => {
          await addAccount(acc);
          await refreshAccounts();
        }}
      />

      <TriggerConfigModal
        open={triggerConfigModalOpen}
        onOpenChange={setTriggerConfigModalOpen}
        trigger={editingTrigger}
        currentConfig={editingTrigger ? autoRules[editingTrigger.id] : null}
        templates={liveApprovedTemplates}
        onSave={handleSaveSingleTrigger}
      />
    </div>
  );
}
