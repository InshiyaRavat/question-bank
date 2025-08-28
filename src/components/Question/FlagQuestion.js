"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Flag, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const FlagQuestion = ({ questionId, className = "" }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagData, setFlagData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");

  const flagReasons = [
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "incorrect", label: "Incorrect Answer/Question" },
    { value: "unclear", label: "Unclear or Confusing" },
    { value: "duplicate", label: "Duplicate Question" },
    { value: "outdated", label: "Outdated Information" },
    { value: "typo", label: "Spelling/Grammar Error" },
    { value: "other", label: "Other Issue" },
  ];

  // Check if question is already flagged by user
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !questionId) return;

    const checkFlagStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/question-flag?questionId=${questionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.flag) {
            setIsFlagged(true);
            setFlagData(data.flag);
          }
        }
      } catch (error) {
        console.error("Error checking flag status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkFlagStatus();
  }, [isLoaded, isSignedIn, user, questionId]);

  const handleFlagSubmit = async () => {
    if (!selectedReason) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/question-flag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          reason: selectedReason,
          details: details.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFlagged(true);
        setFlagData(data.flag);
        setIsOpen(false);
        setSelectedReason("");
        setDetails("");

        // Show success message (you might want to use a toast library)
        alert("Question flagged successfully. Thank you for your feedback!");
      } else {
        alert(data.error || "Failed to flag question");
      }
    } catch (error) {
      console.error("Error flagging question:", error);
      alert("Failed to flag question. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnflag = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/question-flag?questionId=${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsFlagged(false);
        setFlagData(null);
        alert("Flag removed successfully.");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove flag");
      }
    } catch (error) {
      console.error("Error removing flag:", error);
      alert("Failed to remove flag. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isFlagged) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnflag}
          disabled={submitting}
          className="text-xs p-1 h-auto"
          title="Remove flag"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-gray-600 hover:text-red-600 ${className}`}
          title="Flag this question"
        >
          <Flag className="w-4 h-4 mr-1" />
          Flag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Flag Question
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues with this question. Your feedback is valuable and will be reviewed by
            our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">What&apos;s the issue? *</label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {flagReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Additional details (optional)</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide more details about the issue..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">{details.length}/500 characters</div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleFlagSubmit}
            disabled={!selectedReason || submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : (
              "Submit Flag"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlagQuestion;
