"use client";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function EndTestFeedback({ onSubmitted }) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch('/api/feedback/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit');
      setSuccess(true);
      setFeedback("");
      onSubmitted && onSubmitted();
    } catch (e) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Optional feedback about your test experience</label>
      <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share anything that could help us improve" />
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">Thanks for your feedback!</div>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setFeedback("")} disabled={submitting}>Clear</Button>
        <Button onClick={onSubmit} disabled={!feedback.trim() || submitting}>{submitting ? 'Submitting...' : 'Submit feedback'}</Button>
      </div>
    </div>
  );
}


