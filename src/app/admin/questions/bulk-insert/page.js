"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, CheckCircle, XCircle } from "lucide-react";
import { AdminSidebar } from "@/components/Admin-side/AdminSidebar";

export default function BulkInsertQuestionsPage() {
  const { isLoaded, user } = useUser();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(null);
    setSummary(null);
    setError("");
  };

  const handlePreview = async () => {
    try {
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      form.append('mode', 'preview');
      const res = await fetch('/api/admin/questions/bulk', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setPreview(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadTemplate = async () => {
    const res = await fetch('/api/admin/questions/bulk/template');
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInsert = async () => {
    try {
      if (!preview?.results?.length) return;
      setSubmitting(true);
      const items = preview.results.map(r => r.row);
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'insert', items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Insert failed');
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-gray-600">Admins only</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <AdminSidebar /> */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Insert Questions</h1>
          <p className="text-gray-600 mt-2">Upload a CSV/XLSX file, preview, and insert questions</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
              <Button onClick={handlePreview} disabled={!file}>Preview</Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Template
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {preview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Preview ({preview.count} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.results.slice(0, 100).map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.index + 1}</TableCell>
                        <TableCell>{r.row.subjectName}</TableCell>
                        <TableCell>{r.row.topicName}</TableCell>
                        <TableCell className="max-w-[360px] truncate">{r.row.questionText}</TableCell>
                        <TableCell className="max-w-[360px] truncate">
                          {[r.row.optionA, r.row.optionB, r.row.optionC, r.row.optionD, r.row.optionE].join(' | ')}
                        </TableCell>
                        <TableCell>{r.row.correctOptionIdx}</TableCell>
                        <TableCell>
                          {r.valid ? (
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> OK</span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> {r.errors.join(', ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button onClick={handleInsert} disabled={submitting}>
                  {submitting ? 'Inserting...' : 'Insert Questions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">Inserted: <strong>{summary.inserted}</strong></p>
              <p className="text-gray-800 mt-1">Skipped: <strong>{summary.skipped?.length || 0}</strong></p>
              {summary.skipped?.length > 0 && (
                <div className="mt-3 max-h-64 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.skipped.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.index + 1}</TableCell>
                          <TableCell className="text-sm text-gray-700">{s.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


