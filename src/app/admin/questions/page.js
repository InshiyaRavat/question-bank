"use client";
import React, { useState, useRef } from "react";
import { Search, Upload } from "lucide-react";
import AdminQuestionList from "@/components/Admin-side/AdminQuestionList";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  // const { isLoaded, isSignedIn, user } = useUser();
  // const [username, setUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("questions");
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [extracted, setExtracted] = useState([]);
  const fileOpenRef = useRef(null);

  const handleExtractPdf = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoadingExtract(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/pdf-process", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      const items = Array.isArray(data.questions) ? data.questions : [];
      if (!items.length) return;
      const editable = items.map((q, idx) => ({
        id: idx,
        subjectName: q.subjectName || "General",
        topicName: q.topicName || "Misc",
        questionText: q.questionText || "",
        options: q.options?.slice(0, 5) || ["", "", "", ""],
        correctOptionIdx: Number.isInteger(q.correctOptionIdx) ? q.correctOptionIdx : 0,
        explanation: q.explanation || "",
      }));
      setExtracted(editable);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExtract(false);
      // clear the input value to allow re-uploading the same file if needed
      event.target.value = "";
    }
  };

  const handleEditChange = (idx, field, value) => {
    setExtracted((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const handleEditOption = (idx, optIdx, value) => {
    setExtracted((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const nextOptions = [...(q.options || [])];
        nextOptions[optIdx] = value;
        return { ...q, options: nextOptions };
      })
    );
  };

  const submitExtracted = async () => {
    try {
      if (!extracted.length) return;
      const items = extracted.map((q) => ({
        subjectName: q.subjectName?.trim() || "General",
        topicName: q.topicName?.trim() || "Misc",
        questionText: q.questionText?.trim() || "",
        optionA: q.options?.[0] || "",
        optionB: q.options?.[1] || "",
        optionC: q.options?.[2] || "",
        optionD: q.options?.[3] || "",
        optionE: q.options?.[4] || "",
        correctOptionIdx: q.correctOptionIdx ?? 0,
        explanation: q.explanation || "",
        difficulty: "",
        tags: "",
      }));

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "insert", items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Insert failed");
      setModalOpen(false);
      setExtracted([]);
      // Optional: trigger a refresh of the list (if AdminQuestionList supports it via props or events)
    } catch (err) {
      console.error(err);
    }
  };

  // useEffect(() => {
  //   if (isLoaded && isSignedIn && user) {
  //     setUsername(user.username || "");
  //   }
  // }, [isLoaded, user, isSignedIn]);

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Search and Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: THEME.textSecondary }}
            />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                borderColor: THEME.neutral300,
                backgroundColor: "white",
                color: THEME.textPrimary,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Upload PDF Button */}
          {/* Profile */}
          {/* <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div> */}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        {/* Content Area */}
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6 space-y-6">
            <AdminQuestionList
              searchTerm={searchTerm}
              fileOpenRef={fileOpenRef}
              onPdfChange={handleExtractPdf}
              loadingExtract={loadingExtract}
            />
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Extracted Questions ({extracted.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-[60vh] overflow-auto pr-2">
            {extracted.map((q, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Subject"
                    value={q.subjectName}
                    onChange={(e) => handleEditChange(idx, "subjectName", e.target.value)}
                  />
                  <Input
                    placeholder="Topic"
                    value={q.topicName}
                    onChange={(e) => handleEditChange(idx, "topicName", e.target.value)}
                  />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Question text"
                  value={q.questionText}
                  onChange={(e) => handleEditChange(idx, "questionText", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  {(q.options || ["", "", "", "", ""]).slice(0, 5).map((opt, oi) => (
                    <Input
                      key={oi}
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => handleEditOption(idx, oi, e.target.value)}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-sm text-gray-700">Correct Option Index (0-4)</label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={q.correctOptionIdx}
                      onChange={(e) => handleEditChange(idx, "correctOptionIdx", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Explanation</label>
                    <Input
                      value={q.explanation}
                      onChange={(e) => handleEditChange(idx, "explanation", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExtracted}>Submit All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
}
