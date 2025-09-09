"use client";
import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function ReportIssueModal({ questionId, open, onOpenChange }) {
  const { isLoaded, isSignedIn } = useUser();
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(() => (feedback || "").trim().split(/\s+/).filter(Boolean).length, [feedback]);
  const fileError = useMemo(() => {
    if (!file) return "Screenshot is required";
    if (!ALLOWED.includes(file.type)) return "Unsupported file type";
    if (file.size > MAX_SIZE) return "File too large (max 5MB)";
    return "";
  }, [file]);

  const canSubmit = wordCount >= 10 && file && !fileError && isLoaded && isSignedIn && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("feedback", feedback);
      fd.append("questionId", String(questionId || ""));
      fd.append("screenshot", file);
      const res = await fetch("/api/feedback/report", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to submit");
      onOpenChange(false);
      setFeedback("");
      setFile(null);
    } catch (e) {
      setError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>Please provide a constructive description and attach a screenshot.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Describe the issue (min 10 words)</label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5} placeholder="Explain what is wrong, what you expected, and how to reproduce." />
            <div className="text-xs text-muted-foreground mt-1">{wordCount} words</div>
          </div>
          <div>
            <label className="text-sm font-medium">Screenshot (PNG/JPG/WEBP, max 5MB)</label>
            <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {fileError && <div className="text-xs text-red-600 mt-1">{fileError}</div>}
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>{submitting ? "Submitting..." : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


