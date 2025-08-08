"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";

const TestHistory = ({ history }) => {
  if (!history || history.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No test history available</p>
        </CardContent>
      </Card>
    );
  }

  const { topics } = history;

  return (
    <div className="space-y-6">
      {/* Topic-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Topic Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topics && topics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic Name</TableHead>
                  <TableHead>Questions Attempted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic) => {
                  const attempted = topic.questionsAttempted || 0;
                  const performance = attempted > 0 ? "Active" : "Not Started";
                  const performanceColor = attempted > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";

                  return (
                    <TableRow key={topic.topicId}>
                      <TableCell className="font-medium">{topic.topicName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{attempted}</span>
                          <span className="text-muted-foreground text-sm">questions</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={performanceColor}>{performance}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {attempted > 0 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">In Progress</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-muted-foreground">Pending</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No topic attempts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Topics</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics ? topics.filter((t) => t.questionsAttempted > 0).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Out of {topics ? topics.length : 0} total topics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics ? topics.reduce((sum, topic) => sum + (topic.questionsAttempted || 0), 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Questions across all topics</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Topic Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topics && topics.length > 0 ? (
              topics
                .sort((a, b) => (b.questionsAttempted || 0) - (a.questionsAttempted || 0))
                .slice(0, 5)
                .map((topic) => (
                  <div key={topic.topicId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          topic.questionsAttempted > 0 ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium">{topic.topicName}</p>
                        <p className="text-sm text-muted-foreground">
                          {topic.questionsAttempted || 0} questions attempted
                        </p>
                      </div>
                    </div>
                    <Badge variant={topic.questionsAttempted > 0 ? "default" : "secondary"}>
                      {topic.questionsAttempted > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No activity recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestHistory;
