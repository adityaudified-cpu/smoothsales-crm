"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Edit3,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { TrialRewardBanner } from "@/components/onboarding/trial-reward-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function BusinessInfoCapturePage() {
  const router = useRouter();
  const {
    businessName,
    businessDescription,
    websiteUrl,
    trialRewardProgress,
    updateOnboarding,
  } = useOnboarding();

  // Mode: "website" | "manual"
  const [mode, setMode] = useState("website");

  // Form states
  const [formBusinessName, setFormBusinessName] = useState(
    businessName || "Jaipur Interiors Pvt Ltd"
  );
  const [formDescription, setFormDescription] = useState(
    businessDescription ||
      "We design bespoke luxury residential and commercial interiors in Mumbai and Jaipur, providing turnkey design and execution."
  );
  const [formWebsite, setFormWebsite] = useState(
    websiteUrl || "https://www.jaipurinteriors.in"
  );
  const [listingUrls, setListingUrls] = useState([
    "https://www.indiamart.com/jaipur-interiors",
  ]);

  // Simulated extraction loader
  const [isExtracting, setIsExtracting] = useState(false);

  // Handlers for listing URLs
  const handleAddListingUrl = () => {
    setListingUrls([...listingUrls, ""]);
  };

  const handleUpdateListingUrl = (index, val) => {
    const updated = [...listingUrls];
    updated[index] = val;
    setListingUrls(updated);
  };

  const handleRemoveListingUrl = (index) => {
    setListingUrls(listingUrls.filter((_, i) => i !== index));
  };

  // Continue via Manual form
  const handleManualContinue = (e) => {
    e.preventDefault();
    updateOnboarding({
      businessName: formBusinessName,
      businessDescription: formDescription,
      websiteUrl: "",
    });
    router.push("/setup/call-outcomes");
  };

  // Extract via Website form
  const handleWebsiteExtract = async (e) => {
    e.preventDefault();
    setIsExtracting(true);

    // Simulate AI web extraction delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Guess or generate a tailored description if website provided
    let synthesizedDesc = formDescription;
    let detectedVertical = "interior_design";

    const lowerWeb = (formWebsite + " " + listingUrls.join(" ")).toLowerCase();
    if (lowerWeb.includes("edu") || lowerWeb.includes("academy") || lowerWeb.includes("course")) {
      synthesizedDesc = "We provide live online and offline technical career training and mentorship for engineering students and working professionals.";
      detectedVertical = "education";
    } else if (lowerWeb.includes("real") || lowerWeb.includes("realty") || lowerWeb.includes("property") || lowerWeb.includes("estate")) {
      synthesizedDesc = "We are a premier residential real estate consultancy helping homebuyers find luxury 2, 3, and 4 BHK properties in prime urban locations.";
      detectedVertical = "real_estate";
    } else {
      synthesizedDesc = "We specialize in end-to-end luxury residential interior design, custom modular woodwork, and turnkey site renovations.";
      detectedVertical = "interior_design";
    }

    updateOnboarding({
      businessName: formBusinessName || "Apex Enterprises",
      businessDescription: synthesizedDesc,
      websiteUrl: formWebsite,
      vertical: detectedVertical,
    });

    setIsExtracting(false);
    router.push("/setup/call-outcomes");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header Section */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Let&apos;s set up your workspace — in 2 minutes.
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tell us about your business and we&apos;ll customize your CRM using AI.
        </p>
      </div>

      {/* B1. Reusable Trial Reward Banner */}
      <TrialRewardBanner progress={trialRewardProgress} />

      {/* Choice Selector: Website vs Manual */}
      <div className="space-y-3">
        <label className="text-xs sm:text-sm font-semibold text-foreground">
          How would you like to get started?
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Card 1: Website */}
          <Card
            onClick={() => setMode("website")}
            className={`p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
              mode === "website"
                ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-xs"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                mode === "website"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="font-heading text-sm font-bold text-foreground">
                I have a website
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We&apos;ll extract your business info automatically using AI
              </p>
            </div>
          </Card>

          {/* Card 2: Manual */}
          <Card
            onClick={() => setMode("manual")}
            className={`p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
              mode === "manual"
                ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-xs"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                mode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Edit3 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="font-heading text-sm font-bold text-foreground">
                I don&apos;t have a website
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your business name and description manually
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Dynamic Form based on selection */}
      <AnimatePresence mode="wait">
        {mode === "website" ? (
          <motion.div
            key="website-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 sm:p-7 border border-border bg-card rounded-xl space-y-6 shadow-xs">
              <form onSubmit={handleWebsiteExtract} className="space-y-5">
                {/* Business Website Input */}
                <div className="space-y-2">
                  <Label htmlFor="website-url" className="text-xs font-semibold">
                    Your business website <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="website-url"
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://www.yourbusiness.com"
                    required
                    className="h-10 text-xs sm:text-sm bg-background"
                  />
                </div>

                {/* Additional Listing Pages */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Other listing pages (optional)
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Google Maps, JustDial, IndiaMART, social media, etc. — helps us get more details.
                  </p>

                  <div className="space-y-2">
                    {listingUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="url"
                          value={url}
                          onChange={(e) => handleUpdateListingUrl(idx, e.target.value)}
                          placeholder="e.g. https://www.indiamart.com/your-business"
                          className="h-9 text-xs bg-background flex-1"
                        />
                        {listingUrls.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveListingUrl(idx)}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddListingUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add another URL</span>
                  </button>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/welcome")}
                    className="gap-2 text-xs font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={isExtracting || !formWebsite.trim()}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-5 shadow-xs"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                        <span>Extracting Business Info...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                        <span>Extract Business Info</span>
                        <ArrowRight className="h-4 w-4 ml-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="manual-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 sm:p-7 border border-border bg-card rounded-xl space-y-6 shadow-xs">
              <form onSubmit={handleManualContinue} className="space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="manual-business-name" className="text-xs font-semibold">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-business-name"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="e.g. Apex Realty Ventures"
                    required
                    className="h-10 text-xs sm:text-sm bg-background"
                  />
                </div>

                {/* Business Description */}
                <div className="space-y-2">
                  <Label htmlFor="manual-desc" className="text-xs font-semibold">
                    Describe your business in 1–2 sentences <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="manual-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="We are a real estate agency that helps clients buy and sell residential properties in Mumbai."
                    required
                    className="min-h-[85px] text-xs sm:text-sm bg-background resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This helps our AI customize your CRM — call outcomes, deal stages, products, and more.
                  </p>
                </div>

                {/* Upload Logo (Dashed dropzone visual) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Upload logo (optional)
                  </Label>
                  <div className="rounded-xl border-2 border-dashed border-border/80 hover:border-primary/40 p-6 text-center cursor-pointer transition-colors bg-muted/10">
                    <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Drop files here or{" "}
                      <span className="text-primary font-semibold hover:underline">
                        browse files
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      PNG, JPG, or SVG up to 5MB
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/welcome")}
                    className="gap-2 text-xs font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={!formBusinessName.trim() || !formDescription.trim()}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-5 shadow-xs"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
