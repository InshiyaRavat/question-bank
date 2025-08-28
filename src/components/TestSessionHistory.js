"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, RefreshCw, Trophy, Target, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

const TestSessionHistory = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSessions = async () => {
    if (!isLoaded || !isSignedIn || !user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/test-session?limit=10");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching test sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isLoaded, isSignedIn, user]);

  const handleRetest = (sessionId, testType) => {
    router.push(`/questions?type=${testType}&sessionId=${sessionId}`);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: "secondary", text: "In Progress", color: "text-blue-600" },
      completed: { variant: "default", text: "Completed", color: "text-green-600" },
      abandoned: { variant: "destructive", text: "Abandoned", color: "text-red-600" },
    };

    const config = variants[status] || variants.active;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateAccuracy = (correct, total) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Test Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Test Sessions
        </CardTitle>
        <CardDescription>Track your test history and retake previous tests</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No test sessions yet</p>
            <p className="text-sm">Complete your first test to see your history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg capitalize">{session.testType} Test</h4>
                      {getStatusBadge(session.status)}
                      {session.retestCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Attempt #{session.retestCount + 1}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {formatDate(session.startedAt)}</span>
                      </div>
                      {session.completedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Completed: {formatDate(session.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {session.status === "completed" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{session.score}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{session.correctCount}</div>
                      <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{session.incorrectCount}</div>
                      <div className="text-xs text-gray-500">Incorrect</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {calculateAccuracy(session.correctCount, session.totalQuestions)}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{session.totalQuestions}</span> questions
                  </div>

                  <div className="flex gap-2">
                    {session.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetest(session.sessionId, session.testType)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retake Test
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/reports`)}
                      className="flex items-center gap-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestSessionHistory;
