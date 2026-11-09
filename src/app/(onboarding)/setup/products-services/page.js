"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Tag,
  IndianRupee,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { getProductsServices } from "@/lib/mock-data/onboarding-products-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * NOTE: Connects directly to the Proposal Generator built in Prompt #7, Part E.
 * Items configured here automatically populate the proposal line-item catalog.
 */
export default function ProductsServicesStepPage() {
  const router = useRouter();
  const { productsServices, vertical, businessDescription, updateOnboarding } =
    useOnboarding();

  const [items, setItems] = useState(() => {
    return productsServices && productsServices.length > 0
      ? productsServices
      : getProductsServices(vertical || businessDescription);
  });

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Service");
  const [newCategory, setNewCategory] = useState("Consultation");
  const [newPrice, setNewPrice] = useState("");

  const handleToggleEnable = (id) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it))
    );
  };

  const handleNameChange = (id, val) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, name: val } : it))
    );
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem = {
      id: `ps_custom_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      category: newCategory || (newType === "Service" ? "Consultation" : "Merchandise"),
      unitPrice: Number(newPrice) || 5000,
      unit: newType === "Service" ? "project" : "item",
      enabled: true,
    };

    setItems([...items, newItem]);
    setNewName("");
    setNewPrice("");
  };

  const handleSaveAndContinue = () => {
    updateOnboarding({ productsServices: items });
    router.push("/onboarding/setup/invite-reps");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Package className="h-3.5 w-3.5" />
          <span>Step 5 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Products &amp; Services
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Select what your team sells. These will be available when creating quotations and proposals.
        </p>
      </div>

      {/* Catalog items list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground font-heading">
            AI-Suggested Catalog ({items.filter((i) => i.enabled).length} selected)
          </h2>
          <span className="text-xs text-muted-foreground">
            Synchronizes with Proposal Generator
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`p-3.5 rounded-xl border border-border bg-card shadow-2xs transition-all ${
                !item.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Checkbox
                    checked={item.enabled}
                    onCheckedChange={() => handleToggleEnable(item.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Input
                    value={item.name}
                    onChange={(e) => handleNameChange(item.id, e.target.value)}
                    disabled={!item.enabled}
                    className="h-8 text-xs sm:text-sm font-medium border-transparent hover:border-border focus:border-primary bg-transparent flex-1"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      item.type === "Service"
                        ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                        : "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5"
                    }`}
                  >
                    {item.type}
                  </Badge>

                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                    {item.category}
                  </Badge>

                  <span className="text-xs font-semibold tabular-nums text-foreground min-w-[70px] text-right">
                    ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      /{item.unit || "unit"}
                    </span>
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Product / Service Row */}
        <Card className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-2.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name (e.g. 2-Hour Consultation, Modular Wardrobe)..."
              className="h-9 text-xs bg-background flex-1"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="h-9 w-28 text-xs bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-28">
                <IndianRupee className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price"
                  className="h-9 text-xs pl-7 bg-background"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim()}
                className="gap-1.5 text-xs font-semibold h-9 px-4 shrink-0 bg-primary text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/onboarding/setup/deal-stages")}
          className="gap-2 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <Button
          onClick={handleSaveAndContinue}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-6 shadow-xs"
        >
          <span>Save &amp; Continue</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
