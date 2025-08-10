"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, XCircle } from "lucide-react";

const RecentActivityLogs = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${user.id}/history`);
        if (!res.ok) throw new Error("Failed to fetch activity logs");
        const result = await res.json();
        setLogs(result.solved || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isLoaded, isSignedIn, user]);

  return (
    <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
      <h2 className="text-xl font-semibold mb-4 text-primary">Recent Activity</h2>
      {(!isLoaded || loading) ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-destructive">Error: {error}</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground">No recent activity found.</p>
      ) : (
        <ol className="relative border-l border-border ml-2">
          {logs.slice(0, 10).map((log, idx) => (
            <li key={log.id || idx} className="mb-8 ml-4">
              <div className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                {log.isCorrect ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="bg-muted rounded-lg px-4 py-2 flex flex-col gap-1">
                <span className="font-medium text-accent-foreground">
                  Question #{log.questionId} - {log.isCorrect ? (
                    <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-1">Correct</span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full ml-1">Incorrect</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {log.solvedAt ? new Date(log.solvedAt).toLocaleString() : ""}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default RecentActivityLogs;
