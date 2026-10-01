"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Check, ChevronsUpDown } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { MOCK_TEAMS } from "@/lib/mock-data/teams";
import { cn } from "@/lib/utils";

export default function TeamsAndUsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [teams, setTeams] = useState(MOCK_TEAMS);

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  // Add User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserMobile, setNewUserMobile] = useState("+91 ");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserWorkType, setNewUserWorkType] = useState("Both");
  const [isManagerResp, setIsManagerResp] = useState(false);
  const [isTeamLeaderResp, setIsTeamLeaderResp] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState(["team-jaipur"]);
  const [primaryTeamId, setPrimaryTeamId] = useState("team-jaipur");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [autoDistribute, setAutoDistribute] = useState(true);
  const [availability, setAvailability] = useState("Available");
  const [maxActiveLeads, setMaxActiveLeads] = useState("25");
  const [distWeight, setDistWeight] = useState("1");
  const [territory, setTerritory] = useState("");
  const [userStatus, setUserStatus] = useState("Active");
  const [teamComboboxOpen, setTeamComboboxOpen] = useState(false);

  // Create Team Form State
  const [newTeamName, setNewTeamName] = useState("");

  const handleToggleAutoDistribute = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, autoLeadDistribution: !u.autoLeadDistribution } : u
      )
    );
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    const createdUser = {
      id: `usr_${Date.now()}`,
      name: newUserName || "New Teammate",
      initials: (newUserName || "NT")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      email: newUserEmail,
      phone: newUserMobile,
      role: "Sales User",
      avatarColor: "bg-blue-600 text-white",
      primaryTeamId,
      additionalTeamIds: selectedTeamIds.filter((id) => id !== primaryTeamId),
      isTeamLeader: isTeamLeaderResp,
      isManager: isManagerResp,
      workType: newUserWorkType,
      availability,
      autoLeadDistribution: autoDistribute,
      maxActiveLeads: maxActiveLeads ? Number(maxActiveLeads) : null,
    };

    setUsers([createdUser, ...users]);
    setIsAddUserOpen(false);
    // Reset form
    setNewUserName("");
    setNewUserEmail("");
  };

  const handleCreateTeamSubmit = (e) => {
    e.preventDefault();
    if (!newTeamName) return;

    const createdTeam = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      memberIds: [],
      isDirect: false,
      memberCount: 0,
    };

    setTeams([...teams, createdTeam]);
    setNewTeamName("");
    setIsCreateTeamOpen(false);
  };

  // Availability dot mapping
  const getAvailabilityDot = (status) => {
    switch (status) {
      case "Available":
        return <span className="h-2 w-2 rounded-full bg-success shrink-0" />;
      case "Busy":
        return <span className="h-2 w-2 rounded-full bg-warning shrink-0" />;
      case "On Leave":
      case "Paused":
      default:
        return <span className="h-2 w-2 rounded-full bg-neutral-status shrink-0" />;
    }
  };

  const getTeamName = (teamId) => {
    const t = teams.find((item) => item.id === teamId);
    return t ? t.name : "Unassigned";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams & Users"
        subtitle="Manage flexible organizational hierarchies, responsibilities, and routing capacity"
      />

      <Tabs defaultValue="users" className="w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="users" className="text-xs font-medium">
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="text-xs font-medium">
              Teams ({teams.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsAddUserOpen(true)}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add User</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateTeamOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Team</span>
            </Button>
          </div>
        </div>

        {/* 1. Users Tab */}
        <TabsContent value="users" className="m-0">
          <Card className="bg-card border border-border rounded-lg overflow-hidden shadow-none">
            <Table>
              <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <TableRow>
                  <TableHead className="py-2.5 px-4">Name</TableHead>
                  <TableHead className="py-2.5 px-4">Role Badges</TableHead>
                  <TableHead className="py-2.5 px-4">Primary Team</TableHead>
                  <TableHead className="py-2.5 px-4">Work Type</TableHead>
                  <TableHead className="py-2.5 px-4">Availability</TableHead>
                  <TableHead className="py-2.5 px-4">Auto-Distribution</TableHead>
                  <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border">
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    {/* Name + Contact */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarFallback className={cn("text-[10px] font-semibold", user.avatarColor)}>
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground leading-tight">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Badges */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border">
                          Sales User
                        </span>
                        {user.isManager && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Manager
                          </span>
                        )}
                        {user.isTeamLeader && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            Team Leader
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Primary Team */}
                    <TableCell className="py-2.5 px-4 font-medium text-foreground">
                      {getTeamName(user.primaryTeamId)}
                    </TableCell>

                    {/* Work Type */}
                    <TableCell className="py-2.5 px-4 text-muted-foreground">
                      {user.workType || "Both"}
                    </TableCell>

                    {/* Availability */}
                    <TableCell className="py-2.5 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        {getAvailabilityDot(user.availability)}
                        <span>{user.availability || "Available"}</span>
                      </div>
                    </TableCell>

                    {/* Auto-Distribution Switch */}
                    <TableCell className="py-2.5 px-4">
                      <Switch
                        checked={user.autoLeadDistribution}
                        onCheckedChange={() => handleToggleAutoDistribute(user.id)}
                      />
                    </TableCell>

                    {/* Action Menu */}
                    <TableCell className="py-2.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 2. Teams Tab */}
        <TabsContent value="teams" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teams.map((team) => {
              const teamMembers = users.filter(
                (u) =>
                  u.primaryTeamId === team.id ||
                  (u.additionalTeamIds && u.additionalTeamIds.includes(team.id))
              );
              const overflowCount = Math.max(0, teamMembers.length - 4);

              return (
                <Card key={team.id} className="p-4 bg-card border border-border shadow-none rounded-md space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        {team.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {team.isDirect ? "Direct to Admin" : "Standard Team"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent text-accent-foreground border border-border">
                      {teamMembers.length} {teamMembers.length === 1 ? "Member" : "Members"}
                    </span>
                  </div>

                  {/* Stacked Member Avatars */}
                  <div className="pt-2 border-t border-border flex items-center gap-1.5">
                    <div className="flex -space-x-2 overflow-hidden">
                      {teamMembers.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="h-7 w-7 border-2 border-card ring-0">
                          <AvatarFallback className={cn("text-[9px] font-semibold", member.avatarColor)}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {overflowCount > 0 && (
                      <span className="text-[11px] text-muted-foreground font-medium pl-1">
                        +{overflowCount} more
                      </span>
                    )}
                    {teamMembers.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No members assigned</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog (Full Schema per B2) */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold text-base">
                Add New User
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provision a sales user with customizable responsibility overlays and teams.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Mobile (+91)</Label>
                <Input
                  value={newUserMobile}
                  onChange={(e) => setNewUserMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="h-8 text-xs bg-background font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Work Email</Label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="rahul.s@smoothsales.ai"
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>

              {/* Primary Role (Fixed as Sales User) */}
              <div className="space-y-1">
                <Label className="text-xs">Primary Role</Label>
                <Select disabled defaultValue="sales_user">
                  <SelectTrigger className="h-8 text-xs bg-muted text-muted-foreground">
                    <SelectValue placeholder="Sales User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_user">Sales User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Work Type */}
              <div className="space-y-1">
                <Label className="text-xs">Work Type</Label>
                <Select value={newUserWorkType} onValueChange={setNewUserWorkType}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Calling">Calling</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability */}
              <div className="space-y-1">
                <Label className="text-xs">Initial Availability</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Responsibility Switches */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 border border-border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground text-xs">Manager Responsibility</div>
                  <div className="text-[10px] text-muted-foreground">Team overview and audit access</div>
                </div>
                <Switch checked={isManagerResp} onCheckedChange={setIsManagerResp} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground text-xs">Team Leader Responsibility</div>
                  <div className="text-[10px] text-muted-foreground">Lead allocation & queue monitoring</div>
                </div>
                <Switch checked={isTeamLeaderResp} onCheckedChange={setIsTeamLeaderResp} />
              </div>
            </div>

            {/* Teams Multi-select with Primary designation */}
            <div className="space-y-1.5">
              <Label className="text-xs">Teams & Primary Assignment</Label>
              <div className="flex items-center gap-2">
                <Popover open={teamComboboxOpen} onOpenChange={setTeamComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs justify-between flex-1 bg-background font-normal">
                      <span>{selectedTeamIds.length ? `${selectedTeamIds.length} Teams Selected` : "Select Teams..."}</span>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search teams..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No teams found.</CommandEmpty>
                        <CommandGroup>
                          {teams.map((t) => {
                            const isSelected = selectedTeamIds.includes(t.id);
                            return (
                              <CommandItem
                                key={t.id}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedTeamIds(selectedTeamIds.filter((id) => id !== t.id));
                                  } else {
                                    setSelectedTeamIds([...selectedTeamIds, t.id]);
                                  }
                                }}
                                className="text-xs flex items-center justify-between cursor-pointer"
                              >
                                <span>{t.name}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Primary team marker */}
                <Select value={primaryTeamId} onValueChange={setPrimaryTeamId}>
                  <SelectTrigger className="h-8 text-xs w-48 bg-background">
                    <SelectValue placeholder="Primary Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        Primary: {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reporting Manager & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Reporting Manager (Optional)</Label>
                <Select value={reportingManagerId} onValueChange={setReportingManagerId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Direct)</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Account Status</Label>
                <Select value={userStatus} onValueChange={setUserStatus}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quota & Capacity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max Active Leads</Label>
                <Input
                  type="number"
                  value={maxActiveLeads}
                  onChange={(e) => setMaxActiveLeads(e.target.value)}
                  placeholder="25"
                  className="h-8 text-xs bg-background tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Distribution Weight</Label>
                <Input
                  type="number"
                  value={distWeight}
                  onChange={(e) => setDistWeight(e.target.value)}
                  placeholder="1"
                  className="h-8 text-xs bg-background tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Territory / Specialization</Label>
                <Input
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="e.g. South Jaipur"
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Auto-Distribution Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <div className="font-semibold text-foreground text-xs">Auto Lead Distribution</div>
                <div className="text-[10px] text-muted-foreground">Eligible for real-time round-robin queue</div>
              </div>
              <Switch checked={autoDistribute} onCheckedChange={setAutoDistribute} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save & Provision User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleCreateTeamSubmit} className="space-y-4 text-xs">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold text-base">Create Team</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define a lightweight organizational grouping for lead routing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs">Team Name</Label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Commercial Interior Squad"
                required
                className="h-8 text-xs bg-background"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateTeamOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
