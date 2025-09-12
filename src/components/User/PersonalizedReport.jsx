"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  BookOpen,
  Calendar,
  Download
} from "lucide-react";

export default function PersonalizedReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [accuracyThreshold, setAccuracyThreshold] = useState(50);
  const [timeFilter, setTimeFilter] = useState('all');
  const [specificMonth, setSpecificMonth] = useState('');
  const [specificYear, setSpecificYear] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = async (timeFilter = 'all', month = '', year = '') => {
    try {
      const params = new URLSearchParams();
      if (timeFilter !== 'all') params.append('timeFilter', timeFilter);
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      const res = await fetch(`/api/user/report?${params.toString()}`);
      const data = await res.json();
      console.log("Personalized report data:", data);
      
      if (data.report) {
        setReport(data.report);
        if (data.accuracyThreshold) {
          setAccuracyThreshold(data.accuracyThreshold);
        }
      } else {
        console.error("No report data received:", data);
      }
    } catch (e) {
      console.error("Failed loading personalized report", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await fetchReport(timeFilter, specificMonth, specificYear);
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [timeFilter, specificMonth, specificYear]);

  const exportToPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (timeFilter !== 'all') params.append('timeFilter', timeFilter);
      if (specificMonth) params.append('month', specificMonth);
      if (specificYear) params.append('year', specificYear);
      
      const response = await fetch(`/api/user/report/pdf?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personal-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Time Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <Button 
              onClick={exportToPDF} 
              disabled={pdfLoading || !report}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {pdfLoading ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="specific">Specific Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {timeFilter === 'specific' && (
              <>
                <div className="min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">Month (YYYY-MM)</label>
                  <input
                    type="month"
                    value={specificMonth}
                    onChange={(e) => setSpecificMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="2024-01"
                  />
                </div>
                <div className="min-w-[100px]">
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <input
                    type="number"
                    value={specificYear}
                    onChange={(e) => setSpecificYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="2024"
                    min="2020"
                    max="2030"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            {/* Overall Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overall Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {report.overallStats?.totalQuestionsAttempted || 0}
                    </div>
                    <div className="text-sm text-blue-800">Questions Attempted</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {report.overallStats?.totalQuestionsCorrect || 0}
                    </div>
                    <div className="text-sm text-green-800">Questions Correct</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {report.overallStats?.overallAccuracy || 0}%
                    </div>
                    <div className="text-sm text-purple-800">Overall Accuracy</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {report.totalAttempts || 0}
                    </div>
                    <div className="text-sm text-orange-800">Total Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Period Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Period Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h4 className="font-semibold mb-2">Last Week</h4>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-blue-600">
                        {report.timePeriodStats?.weekly?.tests || 0}
                      </div>
                      <div className="text-sm text-slate-600">Tests</div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.weekly?.questions || 0} questions
                      </div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.weekly?.accuracy || 0}% accuracy
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-semibold mb-2">Last Month</h4>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {report.timePeriodStats?.monthly?.tests || 0}
                      </div>
                      <div className="text-sm text-slate-600">Tests</div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.monthly?.questions || 0} questions
                      </div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.monthly?.accuracy || 0}% accuracy
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-semibold mb-2">Last 3 Months</h4>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-purple-600">
                        {report.timePeriodStats?.quarterly?.tests || 0}
                      </div>
                      <div className="text-sm text-slate-600">Tests</div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.quarterly?.questions || 0} questions
                      </div>
                      <div className="text-sm text-slate-600">
                        {report.timePeriodStats?.quarterly?.accuracy || 0}% accuracy
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics">
          <div className="grid gap-6">
            {/* Topics Covered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Topics Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-slate-600">
                  Topics below {accuracyThreshold}% accuracy need attention
                </div>
                {report.topics && report.topics.length > 0 ? (
                  <div className="space-y-3">
                    {report.topics.map((t) => (
                      <div key={t.topicId} className="flex items-center justify-between border rounded-lg p-4">
                        <div className="flex-1">
                          <div className="font-medium">{t.topicName}</div>
                          <div className="text-sm text-slate-500">
                            {t.correct}/{t.total} correct ({t.accuracy}%)
                          </div>
                          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                t.accuracy >= 70 ? 'bg-green-500' : 
                                t.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(t.accuracy, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {t.needsAttention && (
                            <Badge variant="destructive" className="mb-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs Attention
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">
                    No topic data available yet. Complete some tests to see topic accuracy.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Topics Left to Do */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Topics Left to Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-slate-600">
                  {report.overallStats?.topicsLeft || 0} topics remaining out of {report.overallStats?.totalTopics || 0} total topics
                </div>
                {report.topicsLeftToDo && report.topicsLeftToDo.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.topicsLeftToDo.map((topic) => (
                      <div key={topic.topicId} className="border rounded-lg p-3 bg-slate-50">
                        <div className="font-medium">{topic.topicName}</div>
                        <div className="text-sm text-slate-500">Not attempted yet</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600">Congratulations! You've covered all available topics.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Test History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.history && report.history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 border-b">
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">Score</th>
                        <th className="py-3 pr-4">Correct</th>
                        <th className="py-3 pr-4">Incorrect</th>
                        <th className="py-3 pr-4">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.history.map((h) => {
                        const accuracy = h.totalQuestions > 0 ? Math.round((h.correct / h.totalQuestions) * 100) : 0;
                        return (
                          <tr key={h.sessionId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 pr-4">{new Date(h.completedAt || h.startedAt).toLocaleDateString()}</td>
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="capitalize">
                                {h.testType || "test"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 font-medium">{h.score}/{h.totalQuestions}</td>
                            <td className="py-3 pr-4 text-green-600">{h.correct}</td>
                            <td className="py-3 pr-4 text-red-600">{h.incorrect}</td>
                            <td className="py-3 pr-4">
                              <span className={`font-medium ${
                                accuracy >= 70 ? 'text-green-600' : 
                                accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {accuracy}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">
                  No test history available yet. Complete some tests to see your history.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {report.overallStats?.topicsCovered || 0} / {report.overallStats?.totalTopics || 0}
                  </div>
                  <div className="text-lg text-slate-600 mb-4">Topics Covered</div>
                  <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${report.overallStats?.totalTopics ? 
                          (report.overallStats.topicsCovered / report.overallStats.totalTopics) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {Math.round((report.overallStats?.topicsCovered || 0) / (report.overallStats?.totalTopics || 1) * 100)}% Complete
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {report.overallStats?.totalQuestionsCorrect || 0}
                    </div>
                    <div className="text-sm text-green-800">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {report.overallStats?.totalQuestionsIncorrect || 0}
                    </div>
                    <div className="text-sm text-red-800">Incorrect Answers</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


