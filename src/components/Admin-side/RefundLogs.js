import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, XCircle, BarChart3, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const RefundLogs = ({ refundLogs, refundLogsLoading }) => {
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

  if (refundLogsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Logs</CardTitle>
          <CardDescription>History of processed refunds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!refundLogs || !refundLogs.refunds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Logs</CardTitle>
          <CardDescription>History of processed refunds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No refund logs available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund Logs</CardTitle>
          <CardDescription>History of processed refunds</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Refund Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Total Refunded</p>
                    <p className="text-2xl font-bold">£{refundLogs.summary.totalRefunded.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Refunds</p>
                    <p className="text-2xl font-bold">
                      {typeof refundLogs.summary.totalRefundCount === "number"
                        ? refundLogs.summary.totalRefundCount
                        : Object.keys(refundLogs.summary.totalRefundCount || {}).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">By Reason</p>
                    <div className="text-sm">
                      {refundLogs.summary.reasonBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="capitalize text-gray-700">
                            {typeof item.reason === "string"
                              ? item.reason.replace("_", " ")
                              : String(item.reason || "Unknown")}
                          </span>
                          <span>{typeof item.count === "number" ? item.count : String(item.count || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Refund Logs Table - Responsive */}
          <div className="w-full">
            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
              {refundLogs.refunds.map((refund) => (
                <Card key={refund.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Refund ID</span>
                      <span className="text-sm font-mono text-right">
                        {typeof refund.stripeRefundId === "string"
                          ? refund.stripeRefundId.slice(0, 15) + "..."
                          : String(refund.stripeRefundId || "N/A")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Amount</span>
                      <span className="text-sm font-bold">
                        £{typeof refund.amount === "number" ? refund.amount.toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(refund.status)}
                        {getStatusBadge(refund.status)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reason</span>
                      <Badge variant="outline" className="capitalize text-gray-700">
                        {typeof refund.reason === "string" ? refund.reason.replace("_", " ") : "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Name</span>
                      <span className="text-sm">
                        {typeof refund.username === "string" ? refund.username : String(refund.username || "unknown")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Date</span>
                      <span className="text-sm">
                        {refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Refund ID
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Payment ID
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Amount
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Reason
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          User Name
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Processed By
                        </th>
                        <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundLogs.refunds.map((refund) => (
                        <tr key={refund.id} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-3 text-sm font-mono max-w-[120px]">
                            <div className="truncate" title={refund.stripeRefundId}>
                              {typeof refund.stripeRefundId === "string"
                                ? refund.stripeRefundId
                                : String(refund.stripeRefundId || "N/A")}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm font-mono max-w-[120px]">
                            <div className="truncate" title={refund.stripePaymentId}>
                              {typeof refund.stripePaymentId === "string"
                                ? refund.stripePaymentId
                                : String(refund.stripePaymentId || "N/A")}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm font-medium whitespace-nowrap">
                            £{typeof refund.amount === "number" ? refund.amount.toFixed(2) : "0.00"}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <Badge variant="outline" className="capitalize whitespace-nowrap text-gray-700">
                              {typeof refund.reason === "string" ? refund.reason.replace("_", " ") : "Unknown"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(refund.status)}
                              {getStatusBadge(refund.status)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm max-w-[100px]">
                            <div className="truncate">
                              {typeof refund.username === "string" ? refund.username : String(refund.username || "unknown")}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm max-w-[100px]">
                            <div className="truncate">
                              {typeof refund.processedBy === "string"
                                ? refund.processedBy
                                : String(refund.processedBy || "System")}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                            <div>{refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : "N/A"}</div>
                            <div className="text-xs text-muted-foreground">
                              {refund.createdAt ? new Date(refund.createdAt).toLocaleTimeString() : ""}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundLogs;
