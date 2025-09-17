"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Paperclip,
  X,
  Send,
  Loader2,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function EmailModal({
  isOpen,
  onClose,
  recipients = [],
  onSend,
  loading = false,
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Please select a file smaller than 10MB");
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Missing required fields. Please fill in both subject and message");
      return;
    }

    if (recipients.length === 0) {
      toast.error("No recipients. Please select at least one recipient");
      return;
    }

    try {
      await onSend({
        subject: subject.trim(),
        message: message.trim(),
        attachment,
        recipients,
      });

      // Reset form
      setSubject("");
      setMessage("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setPreviewMode(false);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject("");
      setMessage("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setPreviewMode(false);
      onClose();
    }
  };

  const getRecipientCount = () => {
    return recipients.length;
  };

  const getRecipientText = () => {
    const count = getRecipientCount();
    if (count === 0) return "No recipients selected";
    if (count === 1) return "1 recipient";
    return `${count} recipients`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to selected users. You can attach files and preview the
            content before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipients Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {getRecipientText()}
                  </span>
                </div>
                <Badge variant="secondary">
                  {getRecipientCount()} selected
                </Badge>
              </div>
              {recipients.length > 0 && (
                <div className="mt-2 max-h-20 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {recipients.slice(0, 5).map((recipient) => (
                      <Badge key={recipient.id} variant="outline" className="text-xs">
                        {recipient.name || recipient.email}
                      </Badge>
                    ))}
                    {recipients.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{recipients.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={8}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                {message.length} characters
              </div>
            </div>

            {/* File Attachment */}
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="flex-1"
                />
                {attachment && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeAttachment}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {attachment && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Mode Toggle */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={loading || !subject || !message}
            >
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <div className="text-xs text-muted-foreground">
              {getRecipientCount()} recipients will receive this email
            </div>
          </div>

          {/* Preview */}
          {previewMode && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      To:
                    </Label>
                    <div className="text-sm">
                      {recipients.length === 1
                        ? recipients[0].email
                        : `${recipients[0].email}${recipients.length > 1 ? ` (+${recipients.length - 1} more)` : ""}`}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Subject:
                    </Label>
                    <div className="text-sm font-medium">{subject}</div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Message:
                    </Label>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {message}
                    </div>
                  </div>
                  {attachment && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Attachment:
                        </Label>
                        <div className="text-sm flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          {attachment.name}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading || !subject.trim() || !message.trim() || recipients.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
