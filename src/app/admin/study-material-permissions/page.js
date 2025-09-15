'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, X, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function StudyMaterialPermissionsPage() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users-simple');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        console.log('Fetched users:', data.users?.length || 0);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (userId, canDownload) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      const response = await fetch('/api/admin/study-material-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, canDownload })
      });

      if (response.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId ? { ...u, canDownload, lastUpdated: new Date().toISOString() } : u
          )
        );
      } else {
        console.error('Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const removePermission = async (userId) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      const response = await fetch(`/api/admin/study-material-permissions?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId ? { ...u, canDownload: false, lastUpdated: null } : u
          )
        );
      } else {
        console.error('Failed to remove permission');
      }
    } catch (error) {
      console.error('Error removing permission:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchUsers();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Study Material Permissions</h1>
            <p className="text-gray-600 mt-2">Control which users can download study materials</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                User Permissions
              </CardTitle>
              <CardDescription>
                Enable or disable study material downloads for specific users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-gray-600">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.canDownload}
                              onCheckedChange={(checked) => updatePermission(u.id, checked)}
                              disabled={updating[u.id]}
                            />
                            <Badge variant={u.canDownload ? 'default' : 'secondary'}>
                              {u.canDownload ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Enabled
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" /> Disabled
                                </>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {u.lastUpdated
                            ? new Date(u.lastUpdated).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {u.canDownload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePermission(u.id)}
                              disabled={updating[u.id]}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your search.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
