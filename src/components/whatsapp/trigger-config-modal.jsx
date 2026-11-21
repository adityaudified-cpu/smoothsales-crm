"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, FileText, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const triggerConfigSchema = z.object({
  template: z.string().trim().min(1, "Please select an approved Meta template"),
  timing: z.string().trim().min(1, "Please select a trigger timing delay"),
});

const TIMING_OPTIONS = [
  "Immediate (0s delay)",
  "5 Minutes delay",
  "15 Minutes delay",
  "30 Minutes delay",
  "2 Hours Before Meeting",
  "24 Hours of Inactivity",
  "Immediate on Quote Generate",
  "Conversational Real-time",
];

export function TriggerConfigModal({
  open,
  onOpenChange,
  trigger,
  currentConfig,
  templates = [],
  onSave,
}) {
  const form = useForm({
    resolver: zodResolver(triggerConfigSchema),
    defaultValues: {
      template: "",
      timing: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open && trigger) {
      form.reset({
        template: currentConfig?.template || trigger.template || "",
        timing: currentConfig?.timing || trigger.timing || "Immediate (0s delay)",
      });
    }
  }, [open, trigger, currentConfig, form]);

  const selectedTemplateName = form.watch("template");
  const selectedTemplateObj = templates.find(
    (t) => (t.templateName || t.name) === selectedTemplateName
  );

  const handleSubmit = (values) => {
    onSave(trigger.id, values);
    toast.success(`Workflow "${trigger.title}" configured successfully!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-border bg-card shadow-xl">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Configure Workflow Trigger
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {trigger?.title || "Automated WhatsApp Trigger"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="timing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Trigger Dispatch Timing <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-border bg-background">
                        <SelectValue placeholder="Select trigger timing delay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMING_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Delay between trigger event detection and automated WhatsApp dispatch.
                  </FormDescription>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Approved Meta Template <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-border bg-background">
                        <SelectValue placeholder="Select approved Meta template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {templates.length > 0 ? (
                        templates.map((tmpl) => {
                          const name = tmpl.templateName || tmpl.name;
                          return (
                            <SelectItem key={tmpl.id || name} value={name} className="text-xs">
                              <span className="font-mono font-medium">{name}</span>
                              {tmpl.category && (
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  ({tmpl.category})
                                </span>
                              )}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="universal" className="text-xs">
                          universal_template (Default approved)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Official WhatsApp templates approved by Meta for this workspace.
                  </FormDescription>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Template Body Snippet Preview */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Message Content Preview:
              </p>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                &ldquo;{selectedTemplateObj?.bodyText || trigger?.snippet || "Hi {{1}}, thank you for reaching out to SmoothSales CRM!"}&rdquo;
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-xs font-medium rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Save Trigger
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
