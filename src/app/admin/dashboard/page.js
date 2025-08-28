"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  FileQuestion,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Flag,
} from "lucide-react";
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
  AreaChart,
  Area,
} from "recharts";
import { THEME } from "@/theme";
import { useTheme } from "@/context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";

export default function AdminDashboard() {
  const { colors } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (range = timeRange) => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/dashboard?range=${range}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    fetchDashboardData(range);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const exportData = async (format) => {
    try {
      const response = await fetch(`/api/admin/dashboard/export?format=${format}&range=${timeRange}`);
      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `admin-dashboard-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Dashboard data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export dashboard data");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: colors.textSecondary }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const {
    overview = {},
    userMetrics = {},
    revenueMetrics = {},
    subscriptionMetrics = {},
    activityMetrics = {},
    contentMetrics = {},
    charts = {},
  } = dashboardData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            Admin Dashboard
          </h1>
          <p className="mt-1" style={{ color: colors.textSecondary }}>
            Comprehensive analytics and system overview
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => exportData("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {overview.userGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={overview.userGrowth > 0 ? "text-green-600" : "text-red-600"}>
                {overview.userGrowth > 0 ? "+" : ""}
                {overview.userGrowth}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview.totalRevenue?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {overview.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={overview.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}>
                {overview.revenueGrowth > 0 ? "+" : ""}
                {overview.revenueGrowth}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeSubscriptions?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {overview.subscriptionGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={overview.subscriptionGrowth > 0 ? "text-green-600" : "text-red-600"}>
                {overview.subscriptionGrowth > 0 ? "+" : ""}
                {overview.subscriptionGrowth}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Solved</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.questionsSolved?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>{overview.avgQuestionsPerUser || 0} avg per user</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Users</p>
              <p className="text-lg font-semibold">{userMetrics.newUsers || 0}</p>
            </div>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-semibold">{userMetrics.conversionRate || 0}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Revenue</p>
              <p className="text-lg font-semibold">${revenueMetrics.avgRevenue || 0}</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Churn Rate</p>
              <p className="text-lg font-semibold">{subscriptionMetrics.churnRate || 0}%</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-lg font-semibold">{contentMetrics.totalQuestions || 0}</p>
            </div>
            <FileQuestion className="h-5 w-5 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trash Items</p>
              <p className="text-lg font-semibold">{contentMetrics.trashItems || 0}</p>
            </div>
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Flagged Questions Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Flagged</p>
              <p className="text-lg font-semibold">{contentMetrics.totalFlaggedQuestions || 0}</p>
            </div>
            <Flag className="h-5 w-5 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-lg font-semibold text-red-600">{contentMetrics.pendingFlags || 0}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Flags</p>
              <p className="text-lg font-semibold">{contentMetrics.recentFlagsCount || 0}</p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="newUsers"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Status Distribution</CardTitle>
                <CardDescription>Active vs inactive users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.userStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(charts.userStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity Heatmap</CardTitle>
              <CardDescription>Most active times and days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.userActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activeUsers" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly recurring revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.revenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Revenue distribution across subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.revenueByPlan || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {(charts.revenueByPlan || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-green-600">${revenueMetrics.mrr?.toLocaleString() || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
                <p className="text-2xl font-bold text-green-600">${revenueMetrics.arr?.toLocaleString() || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average Deal Size</p>
                <p className="text-2xl font-bold">${revenueMetrics.averageDealSize || 0}</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Distribution of active subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.subscriptionPlans || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plan" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>Active, expired, and cancelled subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.subscriptionStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(charts.subscriptionStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monthly Plans</p>
                <p className="text-xl font-bold">{subscriptionMetrics.monthlyPlans || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Annual Plans</p>
                <p className="text-xl font-bold">{subscriptionMetrics.annualPlans || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Lifetime Plans</p>
                <p className="text-xl font-bold">{subscriptionMetrics.lifetimePlans || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-xl font-bold text-green-600">{subscriptionMetrics.retentionRate || 0}%</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>User engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.dailyActiveUsers || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="activeUsers" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Solving Trends</CardTitle>
                <CardDescription>Questions solved per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.questionsSolved || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="solved" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="correct" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                <p className="text-xl font-bold">{activityMetrics.avgSessionDuration || "0m"}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Questions/Session</p>
                <p className="text-xl font-bold">{activityMetrics.questionsPerSession || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                <p className="text-xl font-bold text-green-600">{activityMetrics.overallAccuracy || 0}%</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-xl font-bold">{activityMetrics.peakHour || "N/A"}</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
                <CardDescription>Questions by subject and difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.contentBySubject || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="easy" stackId="a" fill="#22c55e" />
                      <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="hard" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
                <CardDescription>Most attempted topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.popularTopics || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="topic" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="attempts" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-xl font-bold">{contentMetrics.totalSubjects || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Topics</p>
                <p className="text-xl font-bold">{contentMetrics.totalTopics || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-xl font-bold">{contentMetrics.totalQuestions || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg per Topic</p>
                <p className="text-xl font-bold">{contentMetrics.avgQuestionsPerTopic || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-xl font-bold">{contentMetrics.totalComments || 0}</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ToastContainer position="bottom-right" />
    </div>
  );
}
