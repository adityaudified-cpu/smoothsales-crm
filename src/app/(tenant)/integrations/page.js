"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { integrationsList as initialIntegrations } from "@/lib/mock-data/integrations";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Plug,
  Megaphone,
  MessageSquare,
  Building,
  CreditCard,
  Briefcase,
  Globe,
} from "lucide-react";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const categories = [
    { name: "Advertising", icon: Megaphone, description: "Capture paid leads from ad networks with automatic UTM tracking" },
    { name: "Messaging", icon: MessageSquare, description: "Official WhatsApp Cloud API, transactional SMS, and mailbox sync" },
    { name: "Listing Portals", icon: Building, description: "Direct webhook pipelines from Indian real estate and B2B portals" },
    { name: "Payments", icon: CreditCard, description: "Collect customer booking tokens and automate partner commission payouts" },
    { name: "Productivity", icon: Briefcase, description: "Two-way spreadsheet backup, calendar appointments, and Google Forms" },
    { name: "Web", icon: Globe, description: "Website inquiry widgets, embeddable form builders, and live chat" },
  ];

  const handleToggle = (id) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.connected;
          if (nextState) {
            toast.success(`${item.name} connected successfully`, {
              description: "Webhooks are active and routing incoming leads.",
            });
          } else {
            toast.info(`${item.name} disconnected`, {
              description: "Lead ingestion from this channel is paused.",
            });
          }
          return { ...item, connected: nextState };
        }
        return item;
      })
    );
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Integrations Marketplace"
        subtitle="Connect the marketing channels, payment gateways, and productivity tools your team already uses."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 text-primary border-primary/30">
              <Plug className="h-3 w-3 mr-1" />
              {connectedCount} of {integrations.length} Active
            </Badge>
          </div>
        }
      />

      {/* Categories Sections in Exact Order */}
      <div className="space-y-10">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const items = integrations.filter((i) => i.category === cat.name);

          return (
            <div key={cat.name} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-muted text-foreground">
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-foreground">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-muted-foreground font-mono">
                  {items.filter((i) => i.connected).length}/{items.length} Connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <IntegrationCard
                    key={item.id}
                    integration={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
