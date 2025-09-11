"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Download,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Target,
  Users
} from "lucide-react";
import { AdminSidebar } from "@/components/Admin-side/AdminSidebar";
import { toast } from "sonner";

export default function QuestionAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    topicId: "all",
    difficulty: "all",
    sortBy: "difficulty",
    search: ""
  });

  useEffect(() => {
    fetchTopics();
    fetchAnalytics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/admin/subjects-with-questions");
      const result = await response.json();
      if (result.success) {
        setTopics(result.subjects.flatMap(subject =>
          subject.topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            subjectName: subject.name
          }))
        ));
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.topicId !== "all") params.append("topicId", filters.topicId);
      if (filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      params.append("sortBy", filters.sortBy);

      const response = await fetch(`/api/admin/question-analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchAnalytics();
  };

  const exportData = (format) => {
    if (!data) return;

    const csvData = data.questions.map(q => ({
      "Question ID": q.id,
      "Question": q.questionText.substring(0, 100) + "...",
      "Topic": q.topic.name,
      "Difficulty": q.difficulty,
      "Total Attempts": q.totalAttempts,
      "Correct": q.correctAttempts,
      "Wrong": q.wrongAttempts,
      "Accuracy %": q.accuracy,
      "Difficulty Score": q.difficultyScore
    }));

    if (format === "csv") {
      const csv = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `question-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <AdminSidebar /> */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Question Analytics
            </h1>
            <p className="text-slate-600">
              Analyze question performance and identify areas for improvement
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Topic</label>
                  <Select value={filters.topicId} onValueChange={(value) => handleFilterChange("topicId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="difficulty">Most Difficult</SelectItem>
                      <SelectItem value="accuracy">Most Accurate</SelectItem>
                      <SelectItem value="attempts">Most Attempted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Questions</p>
                      <p className="text-2xl font-bold text-slate-900">{data.overall.totalQuestions}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Attempts</p>
                      <p className="text-2xl font-bold text-slate-900">{data.overall.totalAttempts}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Overall Accuracy</p>
                      <p className="text-2xl font-bold text-slate-900">{data.overall.overallAccuracy}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Topics Covered</p>
                      <p className="text-2xl font-bold text-slate-900">{data.topics.length}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="questions" className="!text-gray-800">Question Performance</TabsTrigger>
              <TabsTrigger value="topics" className="!text-gray-800">Topic Analysis</TabsTrigger>
              <TabsTrigger value="difficult" className="!text-gray-800">Most Difficult</TabsTrigger>
              <TabsTrigger value="easiest" className="!text-gray-800">Easiest Questions</TabsTrigger>
            </TabsList>

            {/* Question Performance Tab */}
            <TabsContent value="questions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Question Performance</CardTitle>
                  <Button onClick={() => exportData("csv")} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Topic</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Accuracy</TableHead>
                          <TableHead>Difficulty Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.questions?.slice(0, 20).map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={question.questionText}>
                                {question.questionText.substring(0, 100)}...
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="!text-gray-800">{question.topic.name}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={question.difficulty === "hard" ? "destructive" :
                                  question.difficulty === "medium" ? "default" : "secondary"}
                              >
                                {question.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell>{question.totalAttempts}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={question.accuracy >= 70 ? "text-green-600" :
                                  question.accuracy >= 50 ? "text-yellow-600" : "text-red-600"}>
                                  {question.accuracy}%
                                </span>
                                {question.accuracy >= 70 && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {question.accuracy < 50 && <AlertTriangle className="h-4 w-4 text-red-600" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={question.difficultyScore >= 70 ? "text-red-600" :
                                  question.difficultyScore >= 50 ? "text-yellow-600" : "text-green-600"}>
                                  {question.difficultyScore}%
                                </span>
                                {question.difficultyScore >= 70 && <TrendingDown className="h-4 w-4 text-red-600" />}
                                {question.difficultyScore < 30 && <TrendingUp className="h-4 w-4 text-green-600" />}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Topic Analysis Tab */}
            <TabsContent value="topics">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.topics?.map((topic) => (
                      <div key={topic.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{topic.name}</h3>
                          <Badge variant={topic.averageAccuracy >= 70 ? "default" :
                            topic.averageAccuracy >= 50 ? "secondary" : "destructive"}>
                            {topic.averageAccuracy}% accuracy
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                          <div>Questions: {topic.totalQuestions}</div>
                          <div>Attempts: {topic.totalAttempts}</div>
                          <div>Correct: {topic.totalCorrect}</div>
                        </div>
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${topic.averageAccuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Most Difficult Questions Tab */}
            <TabsContent value="difficult">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Most Difficult Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.mostDifficult?.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">#{index + 1}</Badge>
                            <span className="font-medium">Question {question.id}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-red-600 font-semibold">{question.difficultyScore}% difficulty</div>
                            <div className="text-sm text-slate-600">{question.accuracy}% accuracy</div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          {question.questionText.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>Topic: {question.topic.name}</span>
                          <span>Attempts: {question.totalAttempts}</span>
                          <span>Correct: {question.correctAttempts}</span>
                          <span>Wrong: {question.wrongAttempts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Easiest Questions Tab */}
            <TabsContent value="easiest">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Easiest Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.easiest?.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">#{index + 1}</Badge>
                            <span className="font-medium">Question {question.id}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-semibold">{question.accuracy}% accuracy</div>
                            <div className="text-sm text-slate-600">{question.difficultyScore}% difficulty</div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          {question.questionText.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>Topic: {question.topic.name}</span>
                          <span>Attempts: {question.totalAttempts}</span>
                          <span>Correct: {question.correctAttempts}</span>
                          <span>Wrong: {question.wrongAttempts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
