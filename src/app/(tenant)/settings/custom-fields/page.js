"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Plus, Trash2, GripVertical, Type, Hash, Calendar, List, ToggleLeft } from "lucide-react";

const FIELD_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  dropdown: List,
  boolean: ToggleLeft,
};

const FIELD_TYPE_LABELS = {
  text: "Text",
  number: "Number",
  date: "Date",
  dropdown: "Dropdown",
  boolean: "Yes / No",
};

const INITIAL_FIELDS = [
  { id: "cf1", label: "Budget Range", type: "dropdown", entity: "lead", required: false, active: true },
  { id: "cf2", label: "Site Visit Date", type: "date", entity: "lead", required: false, active: true },
  { id: "cf3", label: "Referral Source", type: "text", entity: "lead", required: false, active: true },
  { id: "cf4", label: "Project Area (sq ft)", type: "number", entity: "lead", required: false, active: true },
  { id: "cf5", label: "Decision Maker Present", type: "boolean", entity: "deal", required: false, active: true },
  { id: "cf6", label: "Competitor Quoted", type: "text", entity: "deal", required: false, active: false },
];

export default function CustomFieldsPage() {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [entityFilter, setEntityFilter] = useState("lead");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newField, setNewField] = useState({ label: "", type: "text", entity: "lead", required: false });

  const filtered = fields.filter((f) => f.entity === entityFilter);

  const handleToggleActive = (id) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleDelete = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddField = () => {
    if (!newField.label.trim()) return;
    setFields((prev) => [
      ...prev,
      { id: `cf_${Date.now()}`, ...newField, active: true },
    ]);
    setNewField({ label: "", type: "text", entity: "lead", required: false });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Workspace configuration and preferences."
      />
      <div className="flex flex-col sm:flex-row gap-6">
        <SettingsNav />
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-foreground">Custom Fields</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Add custom data fields to leads and deals.</p>
            </div>
            <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </Button>
          </div>

          {/* Entity Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {["lead", "deal", "contact"].map((entity) => (
              <button
                key={entity}
                onClick={() => setEntityFilter(entity)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px capitalize transition-colors ${
                  entityFilter === entity
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {entity}
              </button>
            ))}
          </div>

          <Card className="border-border bg-card shadow-none overflow-hidden">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No custom fields for {entityFilter}s yet.{" "}
                <button onClick={() => setDialogOpen(true)} className="text-primary font-semibold hover:underline">Add one</button>
              </div>
            )}
            <div className="divide-y divide-border">
              {filtered.map((field) => {
                const Icon = FIELD_TYPE_ICONS[field.type] || Type;
                return (
                  <div key={field.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                    <div className="p-1.5 rounded-md bg-muted shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{field.label}</p>
                      <p className="text-[11px] text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</p>
                    </div>
                    {field.required && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-300">Required</Badge>
                    )}
                    <Switch
                      checked={field.active}
                      onCheckedChange={() => handleToggleActive(field.id)}
                    />
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Field Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Field Label</Label>
              <Input
                value={newField.label}
                onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Budget Range"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Field Type</Label>
              <Select value={newField.type} onValueChange={(v) => setNewField((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="boolean">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Apply To</Label>
              <Select value={newField.entity} onValueChange={(v) => setNewField((p) => ({ ...p, entity: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Required Field</Label>
              <Switch
                checked={newField.required}
                onCheckedChange={(v) => setNewField((p) => ({ ...p, required: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-primary text-primary-foreground" onClick={handleAddField} disabled={!newField.label.trim()}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
