import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for time filtering
    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get('timeFilter') || 'all';
    const specificMonth = searchParams.get('month');
    const specificYear = searchParams.get('year');

    // Load PDF libraries
    await loadPDFLibs();

    // Get user data
    // const clerk = await import('@clerk/nextjs/server');
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // Get accuracy threshold
    let accuracyThreshold = 50;
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: "accuracyThreshold" }
      });
      if (settings) {
        accuracyThreshold = parseInt(settings.value) || 50;
      }
    } catch (error) {
      console.log("Could not fetch accuracy threshold, using default:", error.message);
    }

    // Build time filter for sessions
    let timeWhereClause = { userId, status: "completed" };

    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeFilter) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'specific':
          if (specificMonth) {
            startDate = new Date(specificMonth + '-01');
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            timeWhereClause.startedAt = {
              gte: startDate,
              lt: endDate
            };
          } else if (specificYear) {
            startDate = new Date(specificYear + '-01-01');
            const endDate = new Date(specificYear + '-12-31');
            timeWhereClause.startedAt = {
              gte: startDate,
              lte: endDate
            };
          }
          break;
      }

      if (timeFilter !== 'specific' && startDate) {
        timeWhereClause.startedAt = { gte: startDate };
      }
    }

    // Get sessions and calculate stats
    const sessions = await prisma.testSession.findMany({
      where: timeWhereClause,
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    // Calculate topic stats
    const topicIdToStats = {};

    for (const s of sessions) {
      const ts = s.topicStats || {};
      for (const key of Object.keys(ts)) {
        if (!topicIdToStats[key]) topicIdToStats[key] = { correct: 0, wrong: 0, total: 0 };
        topicIdToStats[key].correct += ts[key].correct || 0;
        topicIdToStats[key].wrong += ts[key].wrong || 0;
        topicIdToStats[key].total += ts[key].total || 0;
      }
    }

    // Fallback to solved questions if no topicStats
    if (Object.keys(topicIdToStats).length === 0) {
      const sessionIds = sessions.map(s => s.sessionId);
      const questionIds = sessions.flatMap(s => s.questionIds || []);

      if (questionIds.length > 0) {
        const solvedQuestions = await prisma.solvedQuestion.findMany({
          where: {
            userId,
            questionId: { in: questionIds }
          },
          include: {
            question: {
              select: { topicId: true }
            }
          }
        });

        for (const sq of solvedQuestions) {
          const topicId = sq.question.topicId.toString();
          if (!topicIdToStats[topicId]) topicIdToStats[topicId] = { correct: 0, wrong: 0, total: 0 };

          if (sq.isCorrect) {
            topicIdToStats[topicId].correct += 1;
          } else {
            topicIdToStats[topicId].wrong += 1;
          }
          topicIdToStats[topicId].total += 1;
        }
      }
    }

    // Get topic names
    const topicIds = Object.keys(topicIdToStats).map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
    const topics = topicIds.length > 0 ? await prisma.topic.findMany({ where: { id: { in: topicIds } } }) : [];
    const idToName = Object.fromEntries(topics.map((t) => [String(t.id), t.name]));

    // Get all topics for topics left to do
    const allTopics = await prisma.topic.findMany({
      select: { id: true, name: true }
    });

    // Calculate statistics
    const totalAttempts = sessions.length;
    const totalQuestionsAttempted = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const totalQuestionsCorrect = sessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const totalQuestionsIncorrect = sessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
    const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0;

    // Calculate time period stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const weeklyStats = sessions.filter(s => new Date(s.startedAt) >= oneWeekAgo);
    const monthlyStats = sessions.filter(s => new Date(s.startedAt) >= oneMonthAgo);
    const quarterlyStats = sessions.filter(s => new Date(s.startedAt) >= threeMonthsAgo);

    // Prepare topics data
    const topicsReport = Object.entries(topicIdToStats)
      .map(([topicId, s]) => {
        const total = s.total || (s.correct + s.wrong);
        const accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0;
        const needsAttention = total > 0 && accuracy < accuracyThreshold;
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
    const coveredTopicIds = new Set(Object.keys(topicIdToStats).map(id => parseInt(id)));
    const topicsLeftToDo = allTopics
      .filter(topic => !coveredTopicIds.has(topic.id))
      .map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        status: 'not_attempted'
      }));

    // Create PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Personal Learning Report', 20, 30);

    // User info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const userName = user.fullName || user.firstName + (user.lastName ? ` ${user.lastName}` : '') || user.username || 'User';
    const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'No email';
    doc.text(`Name: ${userName}`, 20, 45);
    doc.text(`Email: ${userEmail}`, 20, 55);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);

    // Time period info
    let timePeriodText = 'All Time';
    if (timeFilter === 'week') timePeriodText = 'Last Week';
    else if (timeFilter === 'month') timePeriodText = 'Last Month';
    else if (timeFilter === 'year') timePeriodText = 'Last Year';
    else if (timeFilter === 'specific') {
      if (specificMonth) timePeriodText = `Month: ${specificMonth}`;
      else if (specificYear) timePeriodText = `Year: ${specificYear}`;
    }
    doc.text(`Period: ${timePeriodText}`, 20, 75);

    // Overall Statistics
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Statistics', 20, 95);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Tests: ${totalAttempts}`, 20, 110);
    doc.text(`Questions Attempted: ${totalQuestionsAttempted}`, 20, 120);
    doc.text(`Questions Correct: ${totalQuestionsCorrect}`, 20, 130);
    doc.text(`Questions Incorrect: ${totalQuestionsIncorrect}`, 20, 140);
    doc.text(`Overall Accuracy: ${overallAccuracy}%`, 20, 150);
    doc.text(`Topics Covered: ${topicsReport.length}`, 20, 160);
    doc.text(`Topics Left: ${topicsLeftToDo.length}`, 20, 170);

    // Time Period Performance
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Time Period Performance', 20, 190);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Weekly stats
    const weeklyAccuracy = weeklyStats.length > 0 ?
      Math.round((weeklyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) /
        weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last Week: ${weeklyStats.length} tests, ${weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${weeklyAccuracy}% accuracy`, 20, 205);

    // Monthly stats
    const monthlyAccuracy = monthlyStats.length > 0 ?
      Math.round((monthlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) /
        monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last Month: ${monthlyStats.length} tests, ${monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${monthlyAccuracy}% accuracy`, 20, 215);

    // Quarterly stats
    const quarterlyAccuracy = quarterlyStats.length > 0 ?
      Math.round((quarterlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) /
        quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0;
    doc.text(`Last 3 Months: ${quarterlyStats.length} tests, ${quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0)} questions, ${quarterlyAccuracy}% accuracy`, 20, 225);

    // Topics Performance Table
    if (topicsReport.length > 0) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Topics Performance', 20, 245);

      const topicsTableData = topicsReport.map(topic => [
        topic.topicName,
        topic.correct,
        topic.wrong,
        topic.total,
        `${topic.accuracy}%`,
        topic.needsAttention ? 'Yes' : 'No'
      ]);

      autoTable(doc, {
        startY: 250,
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
    if (sessions.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 400;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Recent Test History', 20, finalY + 20);

      const historyData = sessions.slice(0, 20).map(session => {
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

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text('Generated by Question Bank System', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="personal-report-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
