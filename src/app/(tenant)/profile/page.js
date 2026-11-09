"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";
import { User, Lock, Bell, Shield, Camera, Save, Loader2 } from "lucide-react";

const SECTIONS = [
  { key: "profile", label: "Personal Info", icon: User },
  { key: "password", label: "Password", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification prefs (local only — no backend endpoint yet)
  const [notifPrefs, setNotifPrefs] = useState({
    newLeadAssigned: true,
    followUpReminder: true,
    dealUpdates: true,
    teamActivity: false,
    systemAlerts: true,
    weeklyReport: false,
  });

  // Sync form with user context on mount / user change
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDesignation(user.designation || "");
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ fullName, email, phone, designation });
      // res is AuthResponse — update context
      const nameParts = (res.fullName || fullName).split(" ");
      updateUser({
        name: res.fullName || fullName,
        fullName: res.fullName || fullName,
        email: res.email || email,
        phone: res.phone || phone,
        designation: res.designation || designation,
        avatarUrl: res.avatarUrl,
        initials: nameParts.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U",
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsSaving(true);
    try {
      await authApi.updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="My Profile" subtitle="Manage your personal information, password, and preferences." />

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="sm:w-48 shrink-0">
          <Card className="p-2 border-border bg-card shadow-none">
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      activeSection === s.key
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "profile" && (
            <Card className="p-6 border-border bg-card shadow-none space-y-6">
              <h3 className="font-heading font-extrabold text-sm text-foreground">Personal Information</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                      {user?.initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{user?.name || "User"}</p>
                  <Badge variant="outline" className="text-[10px] mt-1 text-primary border-primary/30">
                    {user?.role || "Sales User"}
                  </Badge>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Designation</Label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === "password" && (
            <Card className="p-6 border-border bg-card shadow-none space-y-5">
              <h3 className="font-heading font-extrabold text-sm text-foreground">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    {isSaving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 border-border bg-card shadow-none space-y-5">
              <h3 className="font-heading font-extrabold text-sm text-foreground">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: "newLeadAssigned", label: "New lead assigned to me", desc: "Get notified when a lead is assigned via round-robin or manually." },
                  { key: "followUpReminder", label: "Follow-up reminders", desc: "Reminders before a scheduled follow-up is due." },
                  { key: "dealUpdates", label: "Deal stage updates", desc: "When a deal I own moves to a new pipeline stage." },
                  { key: "teamActivity", label: "Team activity feed", desc: "Activity from other team members on shared leads." },
                  { key: "systemAlerts", label: "System alerts", desc: "TAT violations, SLA breaches, and critical system events." },
                  { key: "weeklyReport", label: "Weekly performance report", desc: "Email summary of your weekly sales performance." },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{pref.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{pref.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[pref.key]}
                      onCheckedChange={(val) => setNotifPrefs((p) => ({ ...p, [pref.key]: val }))}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="p-6 border-border bg-card shadow-none space-y-5">
              <h3 className="font-heading font-extrabold text-sm text-foreground">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/60">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Two-Factor Authentication</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Enable 2FA</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/60">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Active Sessions</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">1 active session — Chrome on Windows</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5">Revoke All</Button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Login History</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Last login: Today at 9:32 AM from 103.x.x.x</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary">View History</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
