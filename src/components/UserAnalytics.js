"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
} from "recharts";

export default function UserAnalytics() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${user.id}/history`);
        if (!res.ok) throw new Error("Failed to fetch analytics data");
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoaded, isSignedIn, user]);

  const dailySeries = useMemo(() => {
    if (!data?.solved) return [];
    const map = new Map();
    for (const s of data.solved) {
      const d = new Date(s.solvedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { date: key, total: 0, correct: 0 });
      const entry = map.get(key);
      entry.total += 1;
      if (s.isCorrect) entry.correct += 1;
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30);
  }, [data]);

  const topicsBar = useMemo(() => {
    const topics = data?.topics || [];
    return topics
      .map((t) => ({ name: t.topicName, attempted: t.questionsAttempted }))
      .sort((a, b) => b.attempted - a.attempted)
      .slice(0, 8);
  }, [data]);

  return (
    <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">Analytics</h2>
      </div>
      {loading && <div className="text-muted-foreground">Loading analytics...</div>}
      {error && <div className="text-destructive">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          {/* Daily Activity */}
          <div className="w-full h-64">
            <div className="text-sm font-medium text-accent-foreground mb-2">Daily Activity (last 30 days)</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Solved" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="correct" name="Correct" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Attempts by Topic */}
          <div className="w-full h-72">
            <div className="text-sm font-medium text-accent-foreground mb-2">Attempts by Topic</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicsBar} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="attempted" name="Attempted" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
