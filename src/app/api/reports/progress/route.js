import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/reports/progress?userId=...&days=30
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Per-topic attempts and accuracy
    const solved = await prisma.solvedQuestion.findMany({
      where: { userId, solvedAt: { gte: sinceDate } },
      select: { isCorrect: true, solvedAt: true, question: { select: { topicId: true, topic: { select: { name: true } } } } },
      orderBy: { solvedAt: "asc" },
    });

    const perTopic = new Map();
    for (const s of solved) {
      const topicId = s.question.topicId;
      const topicName = s.question.topic?.name || `Topic ${topicId}`;
      if (!perTopic.has(topicId)) {
        perTopic.set(topicId, { topicId, topicName, total: 0, correct: 0 });
      }
      const entry = perTopic.get(topicId);
      entry.total += 1;
      if (s.isCorrect) entry.correct += 1;
    }

    const byTopic = Array.from(perTopic.values()).map((t) => ({
      ...t,
      accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Daily trend
    const byDayMap = new Map();
    for (let i = 0; i <= days; i++) {
      const d = new Date(sinceDate);
      d.setDate(sinceDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDayMap.set(key, { date: key, total: 0, correct: 0, accuracy: 0 });
    }
    for (const s of solved) {
      const key = s.solvedAt.toISOString().slice(0, 10);
      const entry = byDayMap.get(key);
      if (entry) {
        entry.total += 1;
        if (s.isCorrect) entry.correct += 1;
      }
    }
    const byDay = Array.from(byDayMap.values()).map((d) => ({
      ...d,
      accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
    }));

    const totalSolved = solved.length;
    const totalCorrect = solved.filter((s) => s.isCorrect).length;
    const accuracy = totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0;

    return NextResponse.json({ success: true, data: { byTopic, byDay, totals: { totalSolved, totalCorrect, accuracy } } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


