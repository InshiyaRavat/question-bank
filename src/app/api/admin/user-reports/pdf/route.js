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

export async function GET(req) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Load PDF libraries
    await loadPDFLibs();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "all";
    const accuracyMin = parseFloat(searchParams.get("accuracyMin") || "0");
    const accuracyMax = parseFloat(searchParams.get("accuracyMax") || "100");
    const sortBy = searchParams.get("sortBy") || "lastActivity";

    // Get all users from Clerk
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      limit: 1000,
      orderBy: "created_at"
    });

    // Get user analytics data
    const userIds = clerkUsers.data.map(user => user.id);
    
    // Get test sessions for all users
    const testSessions = await prisma.testSession.findMany({
      where: {
        userId: { in: userIds },
        status: "completed"
      },
      select: {
        userId: true,
        score: true,
        totalQuestions: true,
        correctCount: true,
        incorrectCount: true,
        startedAt: true,
        completedAt: true,
        testType: true,
        topicStats: true
      }
    });

    // Get solved questions for accuracy calculation
    const solvedQuestions = await prisma.solvedQuestion.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        isCorrect: true,
        question: {
          select: { topicId: true }
        }
      }
    });

    // Get subscription data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: { in: userIds }
      },
      orderBy: { subscribedAt: "desc" }
    });

    // Process user data
    const userReports = clerkUsers.data.map(user => {
      const userSessions = testSessions.filter(s => s.userId === user.id);
      const userSolvedQuestions = solvedQuestions.filter(sq => sq.userId === user.id);
      const userSubscriptions = subscriptions.filter(s => s.userId === user.id);
      
      // Calculate analytics
      const totalTests = userSessions.length;
      const totalQuestions = userSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
      const totalCorrect = userSessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
      const totalIncorrect = userSessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
      const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      
      // Calculate topic coverage
      const topicStats = {};
      userSessions.forEach(session => {
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

      // Fallback to solved questions
      if (Object.keys(topicStats).length === 0) {
        userSolvedQuestions.forEach(sq => {
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

      const topicsCovered = Object.keys(topicStats).length;
      const lastActivity = userSessions.length > 0 ? 
        new Date(Math.max(...userSessions.map(s => new Date(s.completedAt || s.startedAt).getTime()))) :
        new Date(user.createdAt);

      // Get current subscription
      const currentSubscription = userSubscriptions.find(s => 
        new Date(s.currentPeriodEnd) > new Date() && s.status === "active"
      ) || userSubscriptions[0];

      // Get user name with better fallback
      const userName = user.fullName || 
                     user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
                     user.username || 
                     user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                     "Unknown User";

      return {
        id: user.id,
        name: userName,
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "No email",
        createdAt: user.createdAt,
        lastActivity: lastActivity,
        totalTests,
        totalQuestions,
        totalCorrect,
        totalIncorrect,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        topicsCovered,
        subscription: currentSubscription ? {
          plan: currentSubscription.duration === 6 ? "basic" : currentSubscription.duration === 12 ? "premium" : "lifetime",
          status: currentSubscription.status,
          expiresAt: currentSubscription.currentPeriodEnd
        } : null,
        role: user.publicMetadata?.role || "user"
      };
    });

    // Apply filters
    let filteredUsers = userReports;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    if (plan !== "all") {
      filteredUsers = filteredUsers.filter(user => 
        user.subscription?.plan === plan
      );
    }

    if (accuracyMin > 0 || accuracyMax < 100) {
      filteredUsers = filteredUsers.filter(user => 
        user.overallAccuracy >= accuracyMin && user.overallAccuracy <= accuracyMax
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        filteredUsers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "accuracy":
        filteredUsers.sort((a, b) => b.overallAccuracy - a.overallAccuracy);
        break;
      case "tests":
        filteredUsers.sort((a, b) => b.totalTests - a.totalTests);
        break;
      case "lastActivity":
      default:
        filteredUsers.sort((a, b) => b.lastActivity - a.lastActivity);
        break;
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('User Reports - Admin Dashboard', 20, 30);
    
    // Report info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Total Users: ${filteredUsers.length}`, 20, 55);
    doc.text(`Filters: ${search ? `Search: ${search}` : 'All users'} | ${plan !== 'all' ? `Plan: ${plan}` : 'All plans'} | Accuracy: ${accuracyMin}%-${accuracyMax}%`, 20, 65);

    // Overall Statistics
    const totalTests = filteredUsers.reduce((sum, u) => sum + u.totalTests, 0);
    const totalQuestions = filteredUsers.reduce((sum, u) => sum + u.totalQuestions, 0);
    const totalCorrect = filteredUsers.reduce((sum, u) => sum + u.totalCorrect, 0);
    const avgAccuracy = filteredUsers.length > 0 ? 
      Math.round((filteredUsers.reduce((sum, u) => sum + u.overallAccuracy, 0) / filteredUsers.length) * 100) / 100 : 0;
    const activeUsers = filteredUsers.filter(u => u.totalTests > 0).length;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Statistics', 20, 85);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Users: ${filteredUsers.length}`, 20, 100);
    doc.text(`Active Users: ${activeUsers}`, 20, 110);
    doc.text(`Total Tests: ${totalTests}`, 20, 120);
    doc.text(`Total Questions: ${totalQuestions}`, 20, 130);
    doc.text(`Total Correct: ${totalCorrect}`, 20, 140);
    doc.text(`Average Accuracy: ${avgAccuracy}%`, 20, 150);

    // User Performance Table
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('User Performance Overview', 20, 170);
    
    const userTableData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.totalTests,
      user.totalQuestions,
      user.totalCorrect,
      user.totalIncorrect,
      `${user.overallAccuracy}%`,
      user.topicsCovered,
      user.lastActivity.toLocaleDateString(),
      user.subscription?.plan || 'None',
      user.role
    ]);
    
    autoTable(doc, {
      startY: 175,
      head: [['Name', 'Email', 'Tests', 'Questions', 'Correct', 'Incorrect', 'Accuracy', 'Topics', 'Last Activity', 'Plan', 'Role']],
      body: userTableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 }, // Name
        1: { cellWidth: 30 }, // Email
        2: { cellWidth: 12 }, // Tests
        3: { cellWidth: 15 }, // Questions
        4: { cellWidth: 12 }, // Correct
        5: { cellWidth: 12 }, // Incorrect
        6: { cellWidth: 12 }, // Accuracy
        7: { cellWidth: 12 }, // Topics
        8: { cellWidth: 15 }, // Last Activity
        9: { cellWidth: 12 }, // Plan
        10: { cellWidth: 10 }  // Role
      }
    });

    // Performance Distribution
    const finalY = doc.lastAutoTable.finalY || 300;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Distribution', 20, finalY + 20);
    
    const highPerformers = filteredUsers.filter(u => u.overallAccuracy >= 70).length;
    const mediumPerformers = filteredUsers.filter(u => u.overallAccuracy >= 50 && u.overallAccuracy < 70).length;
    const lowPerformers = filteredUsers.filter(u => u.overallAccuracy < 50).length;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`High Performers (≥70%): ${highPerformers} users`, 20, finalY + 35);
    doc.text(`Medium Performers (50-69%): ${mediumPerformers} users`, 20, finalY + 45);
    doc.text(`Low Performers (<50%): ${lowPerformers} users`, 20, finalY + 55);

    // Subscription Distribution
    const subscriptionStats = {};
    filteredUsers.forEach(user => {
      const plan = user.subscription?.plan || 'None';
      subscriptionStats[plan] = (subscriptionStats[plan] || 0) + 1;
    });
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Subscription Distribution', 20, finalY + 75);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(subscriptionStats).forEach(([plan, count], index) => {
      doc.text(`${plan}: ${count} users`, 20, finalY + 90 + (index * 10));
    });

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
        'Content-Disposition': `attachment; filename="user-reports-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
