import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const clerk = await clerkClient();
  const u = await clerk.users.getUser(userId);
  const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
  return role === 'admin';
}

// Dynamic import for PDF generation
let jsPDF, autoTable;

async function loadPDFLibs() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.default;
  }
  if (!autoTable) {
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
}

export async function GET(req, { params }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Load PDF libraries
    await loadPDFLibs();

    // Get user from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get user analytics data
    const testSessions = await prisma.testSession.findMany({
      where: {
        userId: userId,
        status: "completed"
      },
      orderBy: { startedAt: "desc" },
      take: 100
    });

    const solvedQuestions = await prisma.solvedQuestion.findMany({
      where: { userId: userId },
      orderBy: { solvedAt: "desc" },
      take: 1000,
      include: {
        question: {
          select: { topicId: true, topic: { select: { name: true } } }
        }
      }
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: userId },
      orderBy: { subscribedAt: "desc" }
    });

    // Calculate analytics
    const totalTests = testSessions.length;
    const totalQuestions = testSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const totalCorrect = testSessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const totalIncorrect = testSessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate topic performance
    const topicStats = {};
    testSessions.forEach(session => {
      if (session.topicStats) {
        try {
          const stats = typeof session.topicStats === 'string' ? 
            JSON.parse(session.topicStats) : session.topicStats;
          Object.entries(stats).forEach(([topicId, data]) => {
            if (!topicStats[topicId]) {
              topicStats[topicId] = { correct: 0, wrong: 0, total: 0 };
            }
            topicStats[topicId].correct += data.correct || 0;
            topicStats[topicId].wrong += data.wrong || 0;
            topicStats[topicId].total += data.total || 0;
          });
        } catch (e) {
          console.warn("Invalid topicStats for session:", session.id);
        }
      }
    });

    // Fallback to solved questions if no topicStats
    if (Object.keys(topicStats).length === 0) {
      solvedQuestions.forEach(sq => {
        const topicId = sq.question.topicId.toString();
        if (!topicStats[topicId]) {
          topicStats[topicId] = { correct: 0, wrong: 0, total: 0 };
        }
        topicStats[topicId].total += 1;
        if (sq.isCorrect) {
          topicStats[topicId].correct += 1;
        } else {
          topicStats[topicId].wrong += 1;
        }
      });
    }

    // Get topic names
    const topicIds = Object.keys(topicStats).map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
    const topics = topicIds.length > 0 ? await prisma.topic.findMany({ where: { id: { in: topicIds } } }) : [];
    const idToName = Object.fromEntries(topics.map((t) => [String(t.id), t.name]));

    // Get all topics for topics left to do
    const allTopics = await prisma.topic.findMany({
      select: { id: true, name: true }
    });

    // Calculate time period stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const weeklyStats = testSessions.filter(s => new Date(s.startedAt) >= oneWeekAgo);
    const monthlyStats = testSessions.filter(s => new Date(s.startedAt) >= oneMonthAgo);
    const quarterlyStats = testSessions.filter(s => new Date(s.startedAt) >= threeMonthsAgo);

    // Prepare topics data
    const topicsReport = Object.entries(topicStats)
      .map(([topicId, s]) => {
        const total = s.total || (s.correct + s.wrong);
        const accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0;
        const needsAttention = total > 0 && accuracy < 50;
        return { 
          topicId: Number(topicId), 
          topicName: idToName[topicId] || `Topic ${topicId}`, 
          correct: s.correct, 
          wrong: s.wrong, 
          total, 
          accuracy, 
          needsAttention 
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);

    // Find topics left to do
    const coveredTopicIds = new Set(Object.keys(topicStats).map(id => parseInt(id)));
    const topicsLeftToDo = allTopics
      .filter(topic => !coveredTopicIds.has(topic.id))
      .map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        status: 'not_attempted'
      }));

    // Get current subscription
    const currentSubscription = subscriptions.find(s => 
      new Date(s.currentPeriodEnd) > new Date() && s.status === "active"
    ) || subscriptions[0];

    // Get user name with better fallback
    const userName = user.fullName || 
                   user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
                   user.username || 
                   user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                   "Unknown User";

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Individual User Report', 20, 30);
    
    // User info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'No email';
    const userRole = user.publicMetadata?.role || 'user';
    doc.text(`Name: ${userName}`, 20, 45);
    doc.text(`Email: ${userEmail}`, 20, 55);
    doc.text(`Role: ${userRole}`, 20, 65);
    doc.text(`User ID: ${userId}`, 20, 75);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 85);

    // Subscription info
    if (currentSubscription) {
      const plan = currentSubscription.duration === 6 ? "basic" : 
                   currentSubscription.duration === 12 ? "premium" : "lifetime";
      const status = currentSubscription.status;
      const expiresAt = new Date(currentSubscription.currentPeriodEnd).toLocaleDateString();
      doc.text(`Subscription: ${plan} (${status})`, 20, 95);
      doc.text(`Expires: ${expiresAt}`, 20, 105);
    } else {
      doc.text(`Subscription: None`, 20, 95);
    }

    // Overall Statistics
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Statistics', 20, 125);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Tests: ${totalTests}`, 20, 140);
    doc.text(`Questions Attempted: ${totalQuestions}`, 20, 150);
    doc.text(`Questions Correct: ${totalCorrect}`, 20, 160);
    doc.text(`Questions Incorrect: ${totalIncorrect}`, 20, 170);
    doc.text(`Overall Accuracy: ${Math.round(overallAccuracy * 100) / 100}%`, 20, 180);
    doc.text(`Topics Covered: ${topicsReport.length}`, 20, 190);
    doc.text(`Topics Left: ${topicsLeftToDo.length}`, 20, 200);

    // Time Period Performance
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Time Period Performance', 20, 220);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Weekly stats
    const weeklyAccuracy = weeklyStats.length > 0 ? 
      Math.round((weeklyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / 
                 weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last Week: ${weeklyStats.length} tests, ${weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${weeklyAccuracy}% accuracy`, 20, 235);
    
    // Monthly stats
    const monthlyAccuracy = monthlyStats.length > 0 ? 
      Math.round((monthlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / 
                 monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last Month: ${monthlyStats.length} tests, ${monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${monthlyAccuracy}% accuracy`, 20, 245);
    
    // Quarterly stats
    const quarterlyAccuracy = quarterlyStats.length > 0 ? 
      Math.round((quarterlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / 
                 quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last 3 Months: ${quarterlyStats.length} tests, ${quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${quarterlyAccuracy}% accuracy`, 20, 255);

    // Topics Performance Table
    if (topicsReport.length > 0) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Topics Performance', 20, 275);
      
      const topicsTableData = topicsReport.map(topic => [
        topic.topicName,
        topic.correct,
        topic.wrong,
        topic.total,
        `${topic.accuracy}%`,
        topic.needsAttention ? 'Yes' : 'No'
      ]);
      
      autoTable(doc, {
        startY: 280,
        head: [['Topic', 'Correct', 'Wrong', 'Total', 'Accuracy', 'Needs Attention']],
        body: topicsTableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    }

    // Topics Left to Do
    if (topicsLeftToDo.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 300;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Topics Left to Do', 20, finalY + 20);
      
      const topicsLeftData = topicsLeftToDo.map(topic => [topic.topicName, 'Not attempted']);
      
      autoTable(doc, {
        startY: finalY + 25,
        head: [['Topic', 'Status']],
        body: topicsLeftData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] },
        alternateRowStyles: { fillColor: [254, 242, 242] }
      });
    }

    // Test History Table
    if (testSessions.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 400;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Test History', 20, finalY + 20);
      
      const historyData = testSessions.slice(0, 30).map(session => {
        const accuracy = session.totalQuestions > 0 ? 
          Math.round((session.correctCount / session.totalQuestions) * 100) : 0;
        return [
          new Date(session.completedAt || session.startedAt).toLocaleDateString(),
          session.testType || 'test',
          `${session.score}/${session.totalQuestions}`,
          session.correctCount,
          session.incorrectCount,
          `${accuracy}%`
        ];
      });
      
      autoTable(doc, {
        startY: finalY + 25,
        head: [['Date', 'Type', 'Score', 'Correct', 'Incorrect', 'Accuracy']],
        body: historyData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
        alternateRowStyles: { fillColor: [240, 253, 244] }
      });
    }

    // Subscription History
    if (subscriptions.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 500;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Subscription History', 20, finalY + 20);
      
      const subscriptionData = subscriptions.slice(0, 10).map(sub => {
        const plan = sub.duration === 6 ? "basic" : 
                     sub.duration === 12 ? "premium" : "lifetime";
        return [
          new Date(sub.subscribedAt).toLocaleDateString(),
          plan,
          sub.status,
          new Date(sub.currentPeriodEnd).toLocaleDateString()
        ];
      });
      
      autoTable(doc, {
        startY: finalY + 25,
        head: [['Subscribed Date', 'Plan', 'Status', 'Expires']],
        body: subscriptionData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [168, 85, 247] },
        alternateRowStyles: { fillColor: [250, 245, 255] }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text('Generated by Question Bank Admin System', doc.internal.pageSize.width - 100, doc.internal.pageSize.height - 10);
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="user-report-${userName.replace(/\s+/g, '-')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
