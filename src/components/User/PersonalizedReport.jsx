"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PersonalizedReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/user/report");
        const data = await res.json();
        console.log("Personalized report data:", data);
        if (mounted) {
          if (data.report) {
            setReport(data.report);
          } else {
            console.error("No report data received:", data);
          }
        }
      } catch (e) {
        console.error("Failed loading personalized report", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">Loading personalized report...</CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-slate-600">Complete some tests to see your personalized report here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{report.totalAttempts}</div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {report.topics && report.topics.length > 0 ? report.topics.length : 0}
              </div>
              <div className="text-sm text-green-800">Topics Covered</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {report.topics && report.topics.length > 0 
                  ? report.topics.filter(t => t.needsAttention).length 
                  : 0}
              </div>
              <div className="text-sm text-orange-800">Need Attention</div>
            </div>
          </div>
          
          {report.history && report.history.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">Recent Performance</h4>
              <div className="space-y-2">
                {report.history.slice(0, 3).map((h, index) => {
                  const accuracy = h.totalQuestions > 0 ? Math.round((h.score / h.totalQuestions) * 100) : 0;
                  return (
                    <div key={h.sessionId} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium capitalize">{h.testType || "test"}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(h.completedAt || h.startedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{h.score}/{h.totalQuestions}</div>
                        <div className="text-xs text-slate-500">{accuracy}% accuracy</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Topics Accuracy</h3>
          {report.topics && report.topics.length > 0 ? (
            <div className="space-y-3">
              {report.topics.map((t) => (
                <div key={t.topicId} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-medium">{t.topicName}</div>
                    <div className="text-xs text-slate-500">{t.correct}/{t.total} correct</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.needsAttention && <Badge variant="destructive">Needs more attention</Badge>}
                    <div className="text-sm font-semibold">{t.accuracy}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-4">No topic data available yet. Complete some tests to see topic accuracy.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test History</h3>
          {report.history && report.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Correct</th>
                    <th className="py-2 pr-4">Incorrect</th>
                  </tr>
                </thead>
                <tbody>
                  {report.history.map((h) => (
                    <tr key={h.sessionId} className="border-t border-slate-100">
                      <td className="py-2 pr-4">{new Date(h.completedAt || h.startedAt).toLocaleString()}</td>
                      <td className="py-2 pr-4 capitalize">{h.testType || "test"}</td>
                      <td className="py-2 pr-4">{h.score}/{h.totalQuestions}</td>
                      <td className="py-2 pr-4">{h.correct}</td>
                      <td className="py-2 pr-4">{h.incorrect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600 text-center py-4">No test history available yet. Complete some tests to see your history.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


