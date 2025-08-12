"use client";
import React, { useEffect, useMemo, useState } from "react";
import UserSidebar from "@/components/UserSidebar";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="w-64 flex-shrink-0">
        <UserSidebar />
      </div>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 lg:mb-10 text-primary text-center">Reports</h1>
        <ReportsTabs />
      </main>
    </div>
  );
}

function ReportsTabs() {
  const { user } = useUser();
  const userId = user?.id;
  return (
    <Tabs defaultValue="progress" className="w-full">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-gray-50 border border-border rounded-lg p-1">
        <TabsTrigger
          value="progress"
          className="rounded-md !text-gray-700 hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-black"
        >
          Progress
        </TabsTrigger>
        <TabsTrigger
          value="test"
          className="rounded-md !text-gray-700 hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow"
        >
          Individual Test
        </TabsTrigger>
        <TabsTrigger
          value="compare"
          className="rounded-md !text-gray-700 hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow"
        >
          Comparison
        </TabsTrigger>
        <TabsTrigger
          value="sessions"
          className="rounded-md !text-gray-700 hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow"
        >
          Test Sessions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="mt-6">
        <ProgressReport userId={userId} />
      </TabsContent>
      <TabsContent value="test" className="mt-6">
        <TestReport userId={userId} />
      </TabsContent>
      <TabsContent value="compare" className="mt-6">
        <ComparisonReport userId={userId} />
      </TabsContent>
      <TabsContent value="sessions" className="mt-6">
        <TestSessions userId={userId} />
      </TabsContent>
    </Tabs>
  );
}

function ProgressReport({ userId }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/reports/progress?userId=${userId}&days=${days}`).then((r) => r.json()).then((res) => setData(res.data));
  }, [userId, days]);

  const exportCsv = async () => {
    if (!data) return;
    const headers = ["Topic", "Total", "Correct", "Accuracy %"];
    const rows = data.byTopic.map((t) => [t.topicName, t.total, t.correct, t.accuracy]);
    await fetch("/api/reports/export", { method: "POST", body: JSON.stringify({ type: "csv", title: `progress_${days}d`, headers, rows }) }).then(async (res) => {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `progress_${days}d.csv`; a.click(); URL.revokeObjectURL(url);
    });
  };

  const exportPdf = async () => {
    if (!data) return;
    const headers = ["Topic", "Total", "Correct", "Accuracy %"];
    const rows = data.byTopic.map((t) => [t.topicName, t.total, t.correct, t.accuracy]);
    await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "pdf", title: `Progress Report (${days} days)`, headers, rows }) })
      .then(async (res) => { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `progress_${days}d.pdf`; a.click(); URL.revokeObjectURL(url); });
  };

  return (
    <section className="rounded-xl border border-border p-4 sm:p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Days:</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded px-2 py-1">
            {[7, 14, 30, 60, 90].map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline" onClick={async () => {
            if (!data) return; const headers = ["Topic", "Total", "Correct", "Accuracy %"]; const rows = data.byTopic.map((t) => [t.topicName, t.total, t.correct, t.accuracy]);
            const res = await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "xlsx", title: `progress_${days}d`, headers, rows }) });
            const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `progress_${days}d.xlsx`; a.click(); URL.revokeObjectURL(url);
          }}>Export Excel</Button>
          <Button onClick={exportPdf}>Export PDF</Button>
        </div>
      </div>
      {!data ? (<div className="text-gray-500">Loading...</div>) : (
        <div className="space-y-3">
          {data.byTopic.map((t) => (
            <div key={t.topicId} className="flex items-center justify-between border rounded p-3">
              <div className="font-medium">{t.topicName}</div>
              <div className="text-sm text-gray-600">Total: {t.total} • Correct: {t.correct} • Accuracy: {t.accuracy}%</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TestSessions({ userId }) {
  const [gap, setGap] = useState(30);
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/reports/tests?userId=${userId}&gap=${gap}`).then((r) => r.json()).then((res) => setData(res.data));
  }, [userId, gap]);

  return (
    <section className="rounded-xl border border-border p-4 sm:p-6 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-600">Session gap (minutes):</span>
        <input type="number" min={5} step={5} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="border rounded px-2 py-1 w-24" />
      </div>
      {!data ? (<div className="text-gray-500">Loading...</div>) : data.sessions.length === 0 ? (
        <div className="text-gray-500">No sessions found.</div>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s) => (
            <div key={s.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Session #{s.id}</div>
                <div className="text-sm text-gray-600">{new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600 mt-1">Total: {s.total} • Correct: {s.correct} • Accuracy: {s.accuracy}%</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {s.topics.map((t) => (
                  <div key={`${s.id}-${t.topicId}`} className="text-sm text-gray-700 border rounded p-2 flex items-center justify-between">
                    <span>{t.topicName}</span>
                    <span className="text-gray-600">{t.correct}/{t.total} ({t.accuracy}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TestReport({ userId }) {
  const [range, setRange] = useState({ start: "", end: "" });
  const [limit, setLimit] = useState(0);
  const [data, setData] = useState(null);

  const load = () => {
    if (!userId) return;
    const params = new URLSearchParams({ userId });
    if (range.start) params.append("start", range.start);
    if (range.end) params.append("end", range.end);
    if (limit) params.append("limit", String(limit));
    fetch(`/api/reports/test?${params.toString()}`).then((r) => r.json()).then((res) => setData(res.data));
  };

  const exportPdf = async () => {
    if (!data) return;
    const headers = ["#", "QuestionId", "Topic", "Correct", "Solved At"];
    const rows = data.items.map((i) => [i.index, i.questionId, i.topicName, i.isCorrect ? "Yes" : "No", new Date(i.solvedAt).toLocaleString()]);
    await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "pdf", title: "Individual Test Report", headers, rows }) })
      .then(async (res) => { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `test_report.pdf`; a.click(); URL.revokeObjectURL(url); });
  };

  const exportCsv = async () => {
    if (!data) return;
    const headers = ["#", "QuestionId", "Topic", "Correct", "Solved At"];
    const rows = data.items.map((i) => [i.index, i.questionId, i.topicName, i.isCorrect ? "Yes" : "No", new Date(i.solvedAt).toLocaleString()]);
    await fetch("/api/reports/export", { method: "POST", body: JSON.stringify({ type: "csv", title: "test_report", headers, rows }) })
      .then(async (res) => { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `test_report.csv`; a.click(); URL.revokeObjectURL(url); });
  };

  return (
    <section className="rounded-xl border border-border p-4 sm:p-6 bg-white space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Start</label>
          <input type="datetime-local" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} className="border rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">End</label>
          <input type="datetime-local" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} className="border rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Limit (optional)</label>
          <input type="number" min={0} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-end">
          <Button onClick={load} className="w-full">Generate</Button>
        </div>
      </div>

      {!data ? (<div className="text-gray-500">No data yet.</div>) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border rounded p-3">
            <div className="font-medium">Totals</div>
            <div className="text-sm text-gray-600">Total: {data.totals.total} • Correct: {data.totals.correct} • Accuracy: {data.totals.accuracy}%</div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button variant="outline" onClick={async () => {
              if (!data) return; const headers = ["#", "QuestionId", "Topic", "Correct", "Solved At"]; const rows = data.items.map((i) => [i.index, i.questionId, i.topicName, i.isCorrect ? "Yes" : "No", new Date(i.solvedAt).toLocaleString()]);
              const res = await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "xlsx", title: `test_report`, headers, rows }) });
              const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `test_report.xlsx`; a.click(); URL.revokeObjectURL(url);
            }}>Export Excel</Button>
            <Button onClick={exportPdf}>Export PDF</Button>
          </div>
          {data.items.map((i) => (
            <div key={`${i.index}-${i.questionId}`} className="flex items-center justify-between border rounded p-3">
              <div className="text-sm text-gray-600">#{i.index} • Q{i.questionId} • {i.topicName}</div>
              <div className={`text-sm font-medium ${i.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{i.isCorrect ? 'Correct' : 'Incorrect'}</div>
              <div className="text-sm text-gray-600">{new Date(i.solvedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ComparisonReport({ userId }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/reports/comparison?userId=${userId}&days=${days}`).then((r) => r.json()).then((res) => setData(res.data));
  }, [userId, days]);

  const exportCsv = async () => {
    if (!data) return;
    const headers = ["Metric", "User", "All Users"];
    const rows = [["Accuracy %", data.userTotals.accuracy, data.allTotals.accuracy], ["Solved", data.userTotals.total, data.allTotals.total]];
    await fetch("/api/reports/export", { method: "POST", body: JSON.stringify({ type: "csv", title: `comparison_${days}d`, headers, rows }) }).then(async (res) => {
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `comparison_${days}d.csv`; a.click(); URL.revokeObjectURL(url);
    });
  };
  const exportPdf = async () => {
    if (!data) return;
    const headers = ["Metric", "User", "All Users"];
    const rows = [["Accuracy %", data.userTotals.accuracy, data.allTotals.accuracy], ["Solved", data.userTotals.total, data.allTotals.total]];
    await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "pdf", title: `Performance Comparison (${days} days)`, headers, rows }) })
      .then(async (res) => { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `comparison_${days}d.pdf`; a.click(); URL.revokeObjectURL(url); });
  };

  return (
    <section className="rounded-xl border border-border p-4 sm:p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Days:</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded px-2 py-1">
            {[7, 14, 30, 60, 90].map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline" onClick={async () => {
            if (!data) return; const headers = ["Metric", "User", "All Users"]; const rows = [["Accuracy %", data.userTotals.accuracy, data.allTotals.accuracy], ["Solved", data.userTotals.total, data.allTotals.total]];
            const res = await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "xlsx", title: `comparison_${days}d`, headers, rows }) });
            const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `comparison_${days}d.xlsx`; a.click(); URL.revokeObjectURL(url);
          }}>Export Excel</Button>
          <Button onClick={exportPdf}>Export PDF</Button>
        </div>
      </div>
      {!data ? (<div className="text-gray-500">Loading...</div>) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border rounded p-3">
            <div className="font-medium">Overall Accuracy</div>
            <div className="text-sm text-gray-600">You: {data.userTotals.accuracy}% • All: {data.allTotals.accuracy}%</div>
          </div>
          <div className="flex items-center justify-between border rounded p-3">
            <div className="font-medium">Total Solved</div>
            <div className="text-sm text-gray-600">You: {data.userTotals.total} • All: {data.allTotals.total}</div>
          </div>
        </div>
      )}
    </section>
  );
}


