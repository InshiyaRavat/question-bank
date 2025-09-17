"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  Gift,
  Trash2,
  ShieldOff,
  X,
  CheckSquare,
  Square,
  Trash,
  Mail,
  Edit,
  Send,
  Filter,
  Download,
  Loader2,
} from "lucide-react";
import UserProgress from "./UserProgress";
import TestHistory from "./TestHistory";
import BulkDeleteDialog from "./BulkDeleteDialog";
import EmailModal from "./EmailModal";
import ProfileEditModal from "./ProfileEditModal";
import { toast } from "sonner";

const formatDate = (ts) => {
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return "-";
  }
};

export default function UsersTableEnhanced() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("registration_date");
  const [order, setOrder] = useState("desc");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [plan, setPlan] = useState("all");
  const [accuracyMin, setAccuracyMin] = useState("");
  const [accuracyMax, setAccuracyMax] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    role: "student",
    grantLifetime: false,
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  // New state for email functionality
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // New state for profile editing
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // New state for advanced filtering
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [inactiveDays, setInactiveDays] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        sort: sortBy,
        order,
        limit: String(limit),
        offset: String(offset),
      });
      if (plan && plan !== "all") params.set("plan", plan);
      if (accuracyMin !== "" && !Number.isNaN(Number(accuracyMin))) params.set("accuracyMin", String(accuracyMin));
      if (accuracyMax !== "" && !Number.isNaN(Number(accuracyMax))) params.set("accuracyMax", String(accuracyMax));
      if (inactiveDays !== "" && !Number.isNaN(Number(inactiveDays))) params.set("inactiveDays", String(inactiveDays));
      if (subscriptionStatus !== "all") params.set("subscriptionStatus", subscriptionStatus);
      
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.totalCount || 0);
      setSelectedUsers(new Set());
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...newUser }),
      });
      if (res.ok) {
        setNewUser({
          email: "",
          password: "",
          username: "",
          firstName: "",
          lastName: "",
          role: "student",
          grantLifetime: false,
        });
        fetchUsers();
        toast.success("User has been created successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "An error occurred while creating the user");
      }
    } finally {
      setCreating(false);
    }
  };

  const grantAdmin = async (userId) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant_admin", userId }),
    });
    fetchUsers();
  };

  const removeAdmin = async (userId) => {
    if (!confirm("Remove admin privileges from this user?")) return;
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_admin", userId }),
    });
    fetchUsers();
  };

  const grantStudentFree = async (userId) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant_student_free", userId }),
    });
    fetchUsers();
  };

  const removeStudentFree = async (userId) => {
    if (!confirm("Remove lifetime access from this user?")) return;
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_student_free", userId }),
    });
    fetchUsers();
  };

  const removeUser = async (userId) => {
    if (!confirm("Remove this user? This will delete related data.")) return;
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", userId }),
    });
    fetchUsers();
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user) => user.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedUsers.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_remove",
          userIds: Array.from(selectedUsers),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully deleted ${result.results.successful.length} of ${result.results.totalProcessed} users`);

        if (result.results.failed.length > 0) {
          toast.warning(`${result.results.failed.length} users could not be deleted. Check console for details.`);
          console.error("Failed deletions:", result.results.failed);
        }

        setSelectedUsers(new Set());
        setShowBulkDeleteDialog(false);
        fetchUsers();
      } else {
        toast.error(result.error || "An unexpected error occurred");
      }
    } catch (error) {
      toast.error("Failed to delete users. Please try again.");
      console.error("Bulk delete error:", error);
    } finally {
      setBulkDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Email functionality
  const handleSendEmail = async (emailData) => {
    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: emailData.recipients.map(r => r.id),
          subject: emailData.subject,
          message: emailData.message,
          attachment: emailData.attachment ? {
            name: emailData.attachment.name,
            size: emailData.attachment.size,
            type: emailData.attachment.type,
            data: await fileToBase64(emailData.attachment)
          } : null,
          filters: {
            plan,
            accuracyMin,
            accuracyMax,
            inactiveDays,
            subscriptionStatus
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully sent ${result.results.successful.length} of ${result.results.totalProcessed} emails`);

        if (result.results.failed.length > 0) {
          toast.warning(`${result.results.failed.length} emails could not be sent. Check console for details.`);
          console.error("Failed emails:", result.results.failed);
        }

        setShowEmailModal(false);
        setEmailRecipients([]);
      } else {
        toast.error(result.error || "An unexpected error occurred");
      }
    } catch (error) {
      toast.error("Failed to send emails. Please try again.");
      console.error("Email sending error:", error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleIndividualEmail = (user) => {
    setEmailRecipients([{
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.username || "Unknown",
      email: user.email
    }]);
    setShowEmailModal(true);
  };

  const handleBulkEmail = () => {
    if (selectedUsers.size === 0) {
      toast.warning("No users selected. Please select users to send email to");
      return;
    }

    const recipients = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.username || "Unknown",
        email: user.email
      }));

    setEmailRecipients(recipients);
    setShowEmailModal(true);
  };

  const handleFilteredEmail = () => {
    const recipients = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.username || "Unknown",
      email: user.email
    }));

    setEmailRecipients(recipients);
    setShowEmailModal(true);
  };

  // Profile editing functionality
  const handleEditProfile = (user) => {
    setEditingUser(user);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (profileData) => {
    setSavingProfile(true);
    try {
      const response = await fetch("/api/admin/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          ...profileData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User profile has been updated");
        setShowProfileModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(result.error || "An unexpected error occurred");
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, [query, sortBy, order, limit, offset, plan, accuracyMin, accuracyMax, inactiveDays, subscriptionStatus]);

  const onViewHistory = async (user) => {
    setSelectedUser(user.id);
    setSelectedUserData(user);
    setHistory(null);
    setHistoryLoading(true);
    setActiveTab("progress");

    try {
      const res = await fetch(`/api/admin/users/${user.id}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      setHistory({ error: true });
    } finally {
      setHistoryLoading(false);
    }
  };

  const onBackToUsers = () => {
    setSelectedUser(null);
    setSelectedUserData(null);
    setHistory(null);
    setActiveTab("users");
  };

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);
  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  if (selectedUser && selectedUserData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToUsers} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {selectedUserData.firstName} {selectedUserData.lastName}
            </h2>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress" className="!text-gray-700">
              Progress Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="!text-gray-700">
              Test History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-6">
            {historyLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading user progress...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <UserProgress user={selectedUserData} history={history} />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {historyLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading test history...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TestHistory history={history} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="dob">DOB</SelectItem>
                  <SelectItem value="registration_date">Registration Date</SelectItem>
                </SelectContent>
              </Select>

              <Select value={order} onValueChange={setOrder}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Filters */}
            <div className="flex gap-2 items-center">
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="none">No Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance Filter */}
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Accuracy min %"
                value={accuracyMin}
                onChange={(e) => setAccuracyMin(e.target.value)}
                className="w-[140px]"
              />
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Max %"
                value={accuracyMax}
                onChange={(e) => setAccuracyMax(e.target.value)}
                className="w-[100px]"
              />
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              <h4 className="font-medium">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inactive for (days)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Status</label>
                  <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Create User */}
          <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 items-center mt-4">
            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <Input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <Input
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newUser.grantLifetime}
                  onChange={(e) => setNewUser({ ...newUser, grantLifetime: e.target.checked })}
                />
                Lifetime free
              </label>
              <Button size="sm" onClick={createUser} disabled={creating} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEmail}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  disabled={bulkDeleting}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Actions Bar */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Email Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilteredEmail}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Email All Filtered ({users.length})
              </Button>
              {selectedUsers.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEmail}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Selected ({selectedUsers.size})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({total})</CardTitle>
            <Badge variant="secondary">
              {users.length} of {total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 w-8 p-0">
                      {selectedUsers.size === users.length && users.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`hover:bg-muted/50 ${selectedUsers.has(user.id) ? "bg-blue-50" : ""}`}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectUser(user.id)}
                          className="h-8 w-8 p-0"
                        >
                          {selectedUsers.has(user.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        {user.username ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {user.username}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge className="bg-red-500 text-white">Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="text-black">
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.planDuration ? (
                          <Badge variant="secondary">{user.planDuration} mo</Badge>
                        ) : user.hasLifetimeAccess ? (
                          <Badge className="bg-green-500 text-white">Lifetime</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof user.accuracy === "number" ? (
                          `${user.accuracy}%`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{user.birthday || "-"}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewHistory(user)}
                              className="inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProfile(user)}
                              className="inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleIndividualEmail(user)}
                              className="inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Mail className="h-4 w-4" /> Email
                            </Button>
                          </div>

                          {/* Admin Controls */}
                          <div className="flex gap-1">
                            {user.role === "admin" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAdmin(user.id)}
                                className="inline-flex items-center gap-2 cursor-pointer text-orange-600 hover:text-orange-700"
                              >
                                <ShieldOff className="h-4 w-4" /> Remove Admin
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => grantAdmin(user.id)}
                                className="inline-flex items-center gap-2 cursor-pointer"
                              >
                                <Shield className="h-4 w-4" /> Make Admin
                              </Button>
                            )}
                          </div>

                          {/* Lifetime Access Controls */}
                          <div className="flex gap-1">
                            {user.hasLifetimeAccess ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeStudentFree(user.id)}
                                className="inline-flex items-center gap-2 cursor-pointer text-orange-600 hover:text-orange-700"
                              >
                                <X className="h-4 w-4" /> Remove Lifetime
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => grantStudentFree(user.id)}
                                className="inline-flex items-center gap-2 cursor-pointer"
                              >
                                <Gift className="h-4 w-4" /> Grant Lifetime
                              </Button>
                            )}
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeUser(user.id)}
                            className="inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.min(total - limit, offset + limit))}
                disabled={offset + limit >= total || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <BulkDeleteDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDeleteConfirm}
        selectedCount={selectedUsers.size}
        loading={bulkDeleting}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipients={emailRecipients}
        onSend={handleSendEmail}
        loading={sendingEmail}
      />

      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={editingUser}
        onSave={handleSaveProfile}
        loading={savingProfile}
      />
    </div>
  );
}
