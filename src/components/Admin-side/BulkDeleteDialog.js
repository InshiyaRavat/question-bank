"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Shield, Gift } from "lucide-react";

export default function BulkDeleteDialog({ isOpen, onClose, onConfirm, selectedUsers, isLoading }) {
  if (!selectedUsers || selectedUsers.length === 0) return null;

  const adminCount = selectedUsers.filter((user) => user.role === "admin").length;
  const studentCount = selectedUsers.length - adminCount;
  const lifetimeCount = selectedUsers.filter((user) => user.hasLifetimeAccess).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Confirm Bulk User Deletion</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone and will permanently delete all selected users and their data.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Selected Users Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Users:</span>
                <span className="ml-2 font-medium">{selectedUsers.length}</span>
              </div>
              {studentCount > 0 && (
                <div>
                  <span className="text-gray-600">Students:</span>
                  <span className="ml-2 font-medium">{studentCount}</span>
                </div>
              )}
              {adminCount > 0 && (
                <div>
                  <span className="text-gray-600">Admins:</span>
                  <span className="ml-2 font-medium text-red-600">{adminCount}</span>
                </div>
              )}
              {lifetimeCount > 0 && (
                <div>
                  <span className="text-gray-600">Lifetime Access:</span>
                  <span className="ml-2 font-medium">{lifetimeCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warnings */}
          {adminCount > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-900">Admin Deletion Warning</h5>
                  <p className="text-sm text-red-700 mt-1">
                    You are about to delete {adminCount} admin user{adminCount !== 1 ? "s" : ""}. Make sure at least one
                    admin remains in the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data deletion warning */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h5 className="font-medium text-orange-900 mb-2">Data That Will Be Deleted:</h5>
            <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
              <li>User accounts and profile information</li>
              <li>All subscriptions and payment history</li>
              <li>Test history and performance data</li>
              <li>Comments and replies</li>
              <li>Announcement read status</li>
              <li>All other user-related data</li>
            </ul>
          </div>

          {/* User list preview */}
          <div className="max-h-48 overflow-y-auto border rounded-lg">
            <div className="p-3 bg-gray-50 border-b">
              <h5 className="font-medium text-gray-900">Users to be deleted:</h5>
            </div>
            <div className="p-3 space-y-2">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.role === "admin" && <Badge className="bg-red-500 text-white text-xs">Admin</Badge>}
                    {user.hasLifetimeAccess && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        Lifetime
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="min-w-[120px]">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              `Delete ${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
