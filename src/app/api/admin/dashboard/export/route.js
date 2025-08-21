import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/admin/dashboard/export - Export dashboard data
export async function GET(req) {
  try {
    // Check authentication
    const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const range = searchParams.get("range") || "30d";

    // Get dashboard data
    const dashboardResponse = await fetch(`${req.nextUrl.origin}/api/admin/dashboard?range=${range}`, {
      headers: {
        // Forward auth headers if needed
      },
    });

    if (!dashboardResponse.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const dashboardData = await dashboardResponse.json();

    if (format === "csv") {
      const csvData = generateCSV(dashboardData);

      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="admin-dashboard-${range}.csv"`,
        },
      });
    } else if (format === "json") {
      return new Response(JSON.stringify(dashboardData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="admin-dashboard-${range}.json"`,
        },
      });
    } else {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error exporting dashboard data:", error);
    return NextResponse.json({ error: "Failed to export dashboard data" }, { status: 500 });
  }
}

function generateCSV(data) {
  const lines = [];

  // Header
  lines.push("Admin Dashboard Export");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Overview Metrics
  lines.push("OVERVIEW METRICS");
  lines.push("Metric,Value,Growth");
  lines.push(`Total Users,${data.overview?.totalUsers || 0},${data.overview?.userGrowth || 0}%`);
  lines.push(`Total Revenue,$${data.overview?.totalRevenue || 0},${data.overview?.revenueGrowth || 0}%`);
  lines.push(
    `Active Subscriptions,${data.overview?.activeSubscriptions || 0},${data.overview?.subscriptionGrowth || 0}%`
  );
  lines.push(`Questions Solved,${data.overview?.questionsSolved || 0},-`);
  lines.push(`Avg Questions per User,${data.overview?.avgQuestionsPerUser || 0},-`);
  lines.push("");

  // User Metrics
  lines.push("USER METRICS");
  lines.push("Metric,Value");
  lines.push(`New Users,${data.userMetrics?.newUsers || 0}`);
  lines.push(`Conversion Rate,${data.userMetrics?.conversionRate || 0}%`);
  lines.push("");

  // Revenue Metrics
  lines.push("REVENUE METRICS");
  lines.push("Metric,Value");
  lines.push(`Monthly Recurring Revenue,$${data.revenueMetrics?.mrr || 0}`);
  lines.push(`Annual Recurring Revenue,$${data.revenueMetrics?.arr || 0}`);
  lines.push(`Average Deal Size,$${data.revenueMetrics?.averageDealSize || 0}`);
  lines.push("");

  // Subscription Metrics
  lines.push("SUBSCRIPTION METRICS");
  lines.push("Metric,Value");
  lines.push(`Churn Rate,${data.subscriptionMetrics?.churnRate || 0}%`);
  lines.push(`Retention Rate,${data.subscriptionMetrics?.retentionRate || 0}%`);
  lines.push(`Monthly Plans,${data.subscriptionMetrics?.monthlyPlans || 0}`);
  lines.push(`Annual Plans,${data.subscriptionMetrics?.annualPlans || 0}`);
  lines.push(`Lifetime Plans,${data.subscriptionMetrics?.lifetimePlans || 0}`);
  lines.push("");

  // Content Metrics
  lines.push("CONTENT METRICS");
  lines.push("Metric,Value");
  lines.push(`Total Subjects,${data.contentMetrics?.totalSubjects || 0}`);
  lines.push(`Total Topics,${data.contentMetrics?.totalTopics || 0}`);
  lines.push(`Total Questions,${data.contentMetrics?.totalQuestions || 0}`);
  lines.push(`Total Comments,${data.contentMetrics?.totalComments || 0}`);
  lines.push(`Trash Items,${data.contentMetrics?.trashItems || 0}`);
  lines.push(`Avg Questions per Topic,${data.contentMetrics?.avgQuestionsPerTopic || 0}`);
  lines.push("");

  // Popular Topics
  if (data.charts?.popularTopics?.length > 0) {
    lines.push("POPULAR TOPICS");
    lines.push("Topic,Attempts");
    data.charts.popularTopics.forEach((topic) => {
      lines.push(`"${topic.topic}",${topic.attempts}`);
    });
    lines.push("");
  }

  // User Growth Data
  if (data.charts?.userGrowth?.length > 0) {
    lines.push("USER GROWTH DATA");
    lines.push("Date,New Users");
    data.charts.userGrowth.forEach((row) => {
      lines.push(`${row.date},${row.newUsers}`);
    });
    lines.push("");
  }

  // Revenue Data
  if (data.charts?.revenue?.length > 0) {
    lines.push("REVENUE DATA");
    lines.push("Date,Revenue");
    data.charts.revenue.forEach((row) => {
      lines.push(`${row.month},$${row.revenue}`);
    });
    lines.push("");
  }

  // Questions Solved Data
  if (data.charts?.questionsSolved?.length > 0) {
    lines.push("QUESTIONS SOLVED DATA");
    lines.push("Date,Solved,Correct");
    data.charts.questionsSolved.forEach((row) => {
      lines.push(`${row.date},${row.solved},${row.correct}`);
    });
  }

  return lines.join("\n");
}
