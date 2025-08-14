"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Download, LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { THEME } from "@/theme";

export default function AdminAnalyticsPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Client-only effect (avoids hydration mismatches) for search suggestions
  useEffect(() => {
    let cancelled = false;
    const doSearch = async () => {
      if (!query || query.trim().length < 2) {
        if (!cancelled) setResults([]);
        return;
      }
      setSearching(true);
      try {
        const params = new URLSearchParams({ query, limit: "10" });
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) setResults(json.users || []);
      } catch (_e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    const t = setTimeout(doSearch, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Load user list (paged), optionally filtered by query
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          sort: "registration_date",
          order: "desc",
          limit: String(limit),
          offset: String(offset),
        });
        if (query && query.trim().length >= 1) params.set("query", query.trim());
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const json = await res.json();
        setUsers(json.users || []);
        setTotal(json.totalCount || 0);
      } catch (_e) {
        setUsers([]);
        setTotal(0);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [query, limit, offset]);

  const selectUser = async (user) => {
    setSelectedUser(user);
    setHistory(null);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/history`);
      const json = await res.json();
      setHistory(json);
    } catch (_e) {
      setHistory({ error: true });
    } finally {
      setLoadingHistory(false);
    }
  };

  const overview = useMemo(() => history?.totals || { totalSolved: 0, totalCorrect: 0, accuracy: 0 }, [history]);

  const dailySeries = useMemo(() => {
    if (!history?.solved) return [];
    const map = new Map();
    for (const s of history.solved) {
      const d = new Date(s.solvedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { date: key, solved: 0, correct: 0 });
      const entry = map.get(key);
      entry.solved += 1;
      if (s.isCorrect) entry.correct += 1;
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30);
  }, [history]);

  const topicsBar = useMemo(() => {
    const topics = history?.topics || [];
    return topics
      .map((t) => ({ name: t.topicName, attempted: t.questionsAttempted, total: t.noOfQuestions }))
      .sort((a, b) => b.attempted - a.attempted)
      .slice(0, 10);
  }, [history]);

  const accuracyPie = useMemo(() => {
    const total = overview.totalSolved || 0;
    const correct = overview.totalCorrect || 0;
    const incorrect = Math.max(0, total - correct);
    return [
      { name: "Correct", value: correct, color: "#22c55e" },
      { name: "Incorrect", value: incorrect, color: "#ef4444" },
    ];
  }, [overview]);

  const onExport = async (type) => {
    if (!selectedUser || !history) return;
    const title = `Performance Report - ${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim();
    const headers = ["Section", "Metric", "Value"];
    const rows = [];
    rows.push(["Overview", "Total Solved", overview.totalSolved]);
    rows.push(["Overview", "Total Correct", overview.totalCorrect]);
    rows.push(["Overview", "Accuracy", `${overview.accuracy}%`]);
    rows.push([" ", " ", " "]);
    rows.push(["Daily", "Date", "Solved/Correct"]);
    for (const d of dailySeries) rows.push(["Daily", d.date, `${d.solved}/${d.correct}`]);
    rows.push([" ", " ", " "]);
    rows.push(["Topics", "Topic", "Attempted / Total"]);
    for (const t of topicsBar) rows.push(["Topics", t.name, `${t.attempted}/${t.total}`]);

    const res = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, headers, rows }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.${type === "pdf" ? "pdf" : type === "xlsx" ? "xlsx" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: THEME.neutral900 }}>Analytics</h1>
          <p className="text-sm text-muted-foreground">Track individual performance, visualize progress, and export reports</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Select User
          </CardTitle>
          <CardDescription>Search by name, email, or username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-3 border rounded-md max-w-3xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto divide-y">
              {loadingUsers ? (
                <div className="px-3 py-6 text-sm text-muted-foreground">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="px-3 py-6 text-sm text-muted-foreground">No users found.</div>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${selectedUser?.id === u.id ? "bg-gray-50" : ""}`}
                    onClick={() => selectUser(u)}
                  >
                    <div>
                      <div className="text-sm font-medium">{`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email || u.username}</div>
                    </div>
                    <Badge variant="secondary">Select</Badge>
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
              <div className="text-xs text-muted-foreground">
                Showing {Math.min(offset + 1, total)} to {Math.min(offset + limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset((p) => Math.max(0, p - limit))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset((p) => p + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() || selectedUser.username || selectedUser.email}</h2>
              <p className="text-sm text-muted-foreground">User ID: {selectedUser.id}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onExport("csv")}> <Download className="h-4 w-4 mr-2" /> CSV</Button>
              <Button variant="outline" onClick={() => onExport("xlsx")}> <Download className="h-4 w-4 mr-2" /> XLSX</Button>
              <Button variant="outline" onClick={() => onExport("pdf")}> <Download className="h-4 w-4 mr-2" /> PDF</Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className='!text-gray-700'>Overview</TabsTrigger>
              <TabsTrigger value="activity" className='!text-gray-700'>Daily Activity</TabsTrigger>
              <TabsTrigger value="topics" className='!text-gray-700'>Topics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Solved</CardTitle>
                    <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.totalSolved}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Correct</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.totalCorrect}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.accuracy}%</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Accuracy Split</CardTitle>
                    <CardDescription>Correct vs Incorrect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={accuracyPie} cx="50%" cy="50%" outerRadius={80} label>
                            {accuracyPie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity (30 days)</CardTitle>
                    <CardDescription>Solved vs Correct per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailySeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={16} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="solved" name="Solved" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="correct" name="Correct" stroke="#22c55e" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={16} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="solved" name="Solved" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="correct" name="Correct" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attempts by Topic</CardTitle>
                  <CardDescription>Top attempted topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicsBar} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attempted" name="Attempted" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}


