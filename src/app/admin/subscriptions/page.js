"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { THEME } from "@/theme";
import RefundLogs from "@/components/Admin-side/RefundLogs";
import { UserButton, useUser } from "@clerk/nextjs";

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState(null);
  const [refundLogs, setRefundLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLogsLoading, setPaymentLogsLoading] = useState(false);
  const [refundLogsLoading, setRefundLogsLoading] = useState(false);
  const [refundingPayment, setRefundingPayment] = useState(null);
  const [timeGranularity, setTimeGranularity] = useState("monthly"); // monthly | yearly
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  // Fetch subscription statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/subscriptions/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment logs
  const fetchPaymentLogs = async (page = 1) => {
    setPaymentLogsLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/logs?page=${page}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setPaymentLogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching payment logs:", error);
    } finally {
      setPaymentLogsLoading(false);
    }
  };

  // Fetch refund logs
  const fetchRefundLogs = async (page = 1) => {
    setRefundLogsLoading(true);
    try {
      const response = await fetch(`/api/admin/refunds/logs?page=${page}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setRefundLogs(data.data);
        console.log("refund logs: ", data.data);
      }
    } catch (error) {
      console.error("Error fetching refund logs:", error);
    } finally {
      setRefundLogsLoading(false);
    }
  };

  // Handle refund
  const handleRefund = async (stripePaymentId, reason = "requested_by_customer") => {
    // Validate reason to match Stripe's accepted values
    const validReasons = ["duplicate", "fraudulent", "requested_by_customer"];
    const refundReason = validReasons.includes(reason) ? reason : "requested_by_customer";

    setRefundingPayment(stripePaymentId);
    try {
      const response = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripePaymentId, reason: refundReason }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Refund processed successfully!");
        fetchPaymentLogs(); // Refresh payment logs
        fetchRefundLogs(); // Refresh refund logs
        fetchStats(); // Refresh stats
      } else {
        alert(`Refund failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Refund failed: ${error.message}`);
    } finally {
      setRefundingPayment(null);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPaymentLogs();
    fetchRefundLogs();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "requires_payment_method":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      succeeded: "default",
      processing: "secondary",
      requires_payment_method: "destructive",
      canceled: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: THEME.neutral900 }}>
            Subscription Management
          </h1>
          <p className="text-muted-foreground">Monitor subscription statistics and manage payments</p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
          <Button
            onClick={() => {
              fetchStats();
              fetchPaymentLogs();
              fetchRefundLogs();
            }}
            variant="outline"
            className="text-black cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className='!text-gray-700'>Subscription Stats</TabsTrigger>
          <TabsTrigger value="payments" className='!text-gray-700'>Payment Logs</TabsTrigger>
          <TabsTrigger value="refunds" className='!text-gray-700'>Refund Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.totalSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">All time subscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.overview.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats?.overview.totalEstimatedRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">Estimated total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stripe Payments</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.stripePaymentsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Last 12 months</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscriptions Over Time</CardTitle>
                    <CardDescription>Monthly or yearly subscriptions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className={`px-3 py-1 rounded-md border ${timeGranularity === "monthly" ? "bg-gray-900 text-white" : "bg-white"}`}
                      onClick={() => setTimeGranularity("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md border ${timeGranularity === "yearly" ? "bg-gray-900 text-white" : "bg-white"}`}
                      onClick={() => setTimeGranularity("yearly")}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(timeGranularity === "monthly" ? stats?.charts.subscriptionsByMonth : stats?.charts.subscriptionsByYear)?.map((row) => {
                    const label = timeGranularity === "monthly" ? new Date(row.month).toLocaleDateString(undefined, { year: "2-digit", month: "short" }) : new Date(row.year).getFullYear();
                    const count = row.count;
                    const denom = Math.max(1, (timeGranularity === "monthly" ? stats?.overview?.totalSubscriptions : stats?.overview?.totalSubscriptions));
                    const width = Math.max(20, (count / denom) * 300);
                    return (
                      <div key={String(label)} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-24">{label}</span>
                        <div className="flex-1 mx-3">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${width}px` }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Duration</CardTitle>
                <CardDescription>Distribution of subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.charts.subscriptionsByDuration?.map((item) => (
                    <div key={item.duration} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${Math.max(20, (item.count / stats.overview.totalSubscriptions) * 200)}px` }}
                        />
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed series table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detailed {timeGranularity === "monthly" ? "Monthly" : "Yearly"} Stats</CardTitle>
                <CardDescription>Totals, active/expired, plan split, and est. revenue</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2">Expired</th>
                      <th className="px-3 py-2">6 mo</th>
                      <th className="px-3 py-2">12 mo</th>
                      <th className="px-3 py-2">Est. Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(timeGranularity === "monthly" ? stats?.series?.monthly : stats?.series?.yearly)?.map((row) => (
                      <tr key={row.period} className="border-t">
                        <td className="px-3 py-2">
                          {timeGranularity === "monthly"
                            ? new Date(row.period).toLocaleDateString(undefined, { year: "numeric", month: "long" })
                            : new Date(row.period).getFullYear()}
                        </td>
                        <td className="px-3 py-2">{row.total}</td>
                        <td className="px-3 py-2">{row.active}</td>
                        <td className="px-3 py-2">{row.expired}</td>
                        <td className="px-3 py-2">{row.duration6}</td>
                        <td className="px-3 py-2">{row.duration12}</td>
                        <td className="px-3 py-2">£{row.estimatedRevenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Subscriptions</CardTitle>
              <CardDescription>Latest subscription activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">User: {sub.username || sub.userId}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.duration} months • {new Date(sub.subscribedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Logs</CardTitle>
              <CardDescription>Recent payment transactions from Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  {paymentLogs?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Total Amount</p>
                        <p className="text-lg font-bold">£{paymentLogs.summary.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Transactions</p>
                        <p className="text-lg font-bold">{paymentLogs.summary.totalTransactions}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Success Rate</p>
                        <p className="text-lg font-bold">
                          {paymentLogs.summary.statusBreakdown.find((s) => s.status === "succeeded")?.count || 0}/
                          {paymentLogs.summary.totalTransactions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Logs Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Payment ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">User Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {paymentLogs?.logs?.map((log) => (
                            <tr key={log.stripePaymentId} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(log.status)}
                                  <span className="text-sm font-mono">{log.stripePaymentId.slice(0, 20)}...</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{log.username}</td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium">
                                  £{log.amount.toFixed(2)} {log.currency}
                                </span>
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                              <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                {log.status === "succeeded" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRefund(log.stripePaymentId)}
                                    disabled={refundingPayment === log.stripePaymentId}
                                  >
                                    {refundingPayment === log.stripePaymentId ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Refund"
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <RefundLogs refundLogs={refundLogs} refundLogsLoading={refundLogsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
