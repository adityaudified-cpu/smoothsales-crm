"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Bot,
  Zap,
  Check,
  RotateCw,
  ShieldAlert,
  Tag,
  Clock,
  UserCheck,
  Sliders,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const leadCaptureSchema = z.object({
  autoCreateLead: z.boolean(),
  extractName: z.boolean(),
  tagSource: z.boolean(),
  sourceTag: z
    .string()
    .trim()
    .min(2, "Source tag must be at least 2 characters")
    .max(40, "Source tag cannot exceed 40 characters"),
  aiBudgetParsing: z.boolean(),
  highIntentDetection: z.boolean(),
  highIntentKeywords: z
    .string()
    .trim()
    .min(2, "Enter at least one keyword (e.g. pricing, quote, demo, discount)"),
  filterSpam: z.boolean(),
  notifyRep: z.boolean(),
  autoAssign: z.boolean(),
  routingPool: z.enum(["all", "inbound", "senior"], {
    errorMap: () => ({ message: "Please select a valid distribution pool" }),
  }),
  slaWarning: z.boolean(),
  slaMinutes: z.coerce
    .number()
    .min(5, "Minimum SLA warning is 5 minutes")
    .max(180, "Maximum SLA warning is 180 minutes"),
});

export function LeadCaptureTab({ initialRules, onSave }) {
  const form = useForm({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
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
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialRules) {
      form.reset({
        autoCreateLead: !!initialRules.autoCreateLead,
        extractName: !!initialRules.extractName,
        tagSource: !!initialRules.tagSource,
        sourceTag: initialRules.sourceTag || "WhatsApp Inbound",
        aiBudgetParsing: !!initialRules.aiBudgetParsing,
        highIntentDetection: !!initialRules.highIntentDetection,
        highIntentKeywords:
          initialRules.highIntentKeywords || "pricing, quote, demo, discount, urgent, cost",
        filterSpam: !!initialRules.filterSpam,
        notifyRep: !!initialRules.notifyRep,
        autoAssign: !!initialRules.autoAssign,
        routingPool: initialRules.routingPool || "inbound",
        slaWarning: !!initialRules.slaWarning,
        slaMinutes: Number(initialRules.slaMinutes) || 15,
      });
    }
  }, [initialRules, form]);

  const handleSubmit = (values) => {
    try {
      if (onSave) onSave(values);
      toast.success("Lead capture rules saved successfully!");
    } catch {
      toast.error("Failed to save lead capture rules.");
    }
  };

  return (
    <div className="space-y-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {/* Main Settings Container (Unified Panel with Divided Sections) */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/15">
              <div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                  Inbound Routing &amp; Lead Qualification Pipeline
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automate CRM contact creation, natural-language intent tagging, and sales team assignment when prospects message.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold rounded-lg border-border hover:bg-muted/60"
                  onClick={() => form.reset()}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Configuration
                </Button>
              </div>
            </div>

            {/* SECTION 1: LEAD CREATION & PROFILE ENRICHMENT */}
            <div className="p-5 border-b border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Contact Profiling &amp; Lead Ingestion
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auto create lead */}
                <FormField
                  control={form.control}
                  name="autoCreateLead"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          Auto-Create Lead on New Inbound Message
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Automatically create a new CRM lead profile when an unknown phone number starts a conversation.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Extract profile name */}
                <FormField
                  control={form.control}
                  name="extractName"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          Extract WhatsApp PushName
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Parse sender&apos;s WhatsApp profile display name and map directly into CRM First and Last Name.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Source Tag */}
                <FormField
                  control={form.control}
                  name="sourceTag"
                  render={({ field }) => (
                    <FormItem className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        Default Lead Source Tag
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="WhatsApp Inbound"
                          className="h-8 text-xs bg-background rounded-md border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Anti-spam */}
                <FormField
                  control={form.control}
                  name="filterSpam"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          Anti-Spam &amp; Automated Verification
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Filter known bot blasts, spam triggers, and invalid short-code numbers from cluttering pipeline.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECTION 2: INTENT DETECTION & AI CLASSIFICATION */}
            <div className="p-5 border-b border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-violet-500/10 text-violet-600 flex items-center justify-center text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Smart Intent &amp; AI Qualification
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High intent detection */}
                <FormField
                  control={form.control}
                  name="highIntentDetection"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          High-Intent Keyword Auto-Flagging
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Mark conversations as High Priority when messages contain buying keywords.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* AI budget parsing */}
                <FormField
                  control={form.control}
                  name="aiBudgetParsing"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          AI Deal Value &amp; Budget Extraction
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Automatically parse numeric amounts, currencies, and scope requirements from chat history.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* High intent keywords */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="highIntentKeywords"
                    render={({ field }) => (
                      <FormItem className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-amber-500" />
                          High-Intent Keywords (Comma Separated)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pricing, quote, demo, discount, urgent, cost, buy, purchase"
                            className="h-8 text-xs bg-background rounded-md border-border font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10.5px] text-muted-foreground">
                          Whenever an inbound message contains any of these terms, the deal will be tagged &quot;Hot Lead&quot; and routed with top priority.
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: LEAD ASSIGNMENT & RESPONSE SLA */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Team Distribution &amp; Response SLA
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Auto assign */}
                <FormField
                  control={form.control}
                  name="autoAssign"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-0">
                      <div className="pr-3">
                        <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                          Auto-Assign to Agents
                        </FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground mt-0.5">
                          Distribute newly captured leads across active sales reps.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Routing pool */}
                <FormField
                  control={form.control}
                  name="routingPool"
                  render={({ field }) => (
                    <FormItem className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Assignment Pool
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs bg-background rounded-md border-border">
                            <SelectValue placeholder="Select team pool" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inbound" className="text-xs">
                            Inbound Sales Team (Round-Robin)
                          </SelectItem>
                          <SelectItem value="senior" className="text-xs">
                            Senior Account Executives
                          </SelectItem>
                          <SelectItem value="all" className="text-xs">
                            All Active Team Members
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* SLA minutes */}
                <FormField
                  control={form.control}
                  name="slaMinutes"
                  render={({ field }) => (
                    <FormItem className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        Response SLA Warning (Minutes)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={180}
                          className="h-8 text-xs bg-background rounded-md border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10.5px] text-muted-foreground">
                        Alert manager if lead remains unanswered after {field.value || 15} minutes.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
