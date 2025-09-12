"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings, Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/Admin-side/AdminSidebar";

export default function RetakeLimitsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [maxRetakes, setMaxRetakes] = useState(-1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isLoaded && user) {
      if (user.publicMetadata?.role !== 'admin') {
        return;
      }
      fetchUsers();
    }
  }, [isLoaded, user, pagination.page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search
      });

      const response = await fetch(`/api/admin/retake-limits?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleSetLimit = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/retake-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          maxRetakes: maxRetakes
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Retake limit set to ${maxRetakes === -1 ? 'unlimited' : maxRetakes} for ${selectedUser.name}`);
        setDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to set retake limit");
      }
    } catch (error) {
      console.error("Error setting retake limit:", error);
      toast.error("Error setting retake limit");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveLimit = async (userId, userName) => {
    if (!confirm(`Remove retake limit for ${userName}? They will have unlimited retakes.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/retake-limits?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Retake limit removed for ${userName}`);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to remove retake limit");
      }
    } catch (error) {
      console.error("Error removing retake limit:", error);
      toast.error("Error removing retake limit");
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (user) => {
    setSelectedUser(user);
    setMaxRetakes(user.maxRetakes);
    setDialogOpen(true);
  };

  const getRetakeStatus = (user) => {
    if (user.isUnlimited) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Unlimited</Badge>;
    }
    return <Badge variant="outline" className="!text-gray-800">{user.maxRetakes} retakes</Badge>;
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p>You don&apos;t have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <AdminSidebar /> */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Retake Limits Management</h1>
            <p className="text-gray-600">Manage retake limits for users</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={fetchUsers} disabled={loading}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({pagination.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Retake Limit</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRetakeStatus(user)}</TableCell>
                          <TableCell>
                            {new Date(user.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDialog(user)}
                                disabled={actionLoading}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Set Limit
                              </Button>
                              {user.hasCustomLimit && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveLimit(user.id, user.name)}
                                  disabled={actionLoading}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Set Limit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Retake Limit for {selectedUser?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Maximum Retakes</label>
                  <Select value={maxRetakes.toString()} onValueChange={(value) => setMaxRetakes(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Unlimited</SelectItem>
                      <SelectItem value="0">No Retakes</SelectItem>
                      <SelectItem value="1">1 Retake</SelectItem>
                      <SelectItem value="2">2 Retakes</SelectItem>
                      <SelectItem value="3">3 Retakes</SelectItem>
                      <SelectItem value="5">5 Retakes</SelectItem>
                      <SelectItem value="10">10 Retakes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetLimit} disabled={actionLoading}>
                    {actionLoading ? 'Setting...' : 'Set Limit'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
