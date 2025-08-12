import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/reports/test?userId=...&start=ISO&end=ISO&limit=...
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    const where = { userId };
    if (start || end) {
      where.solvedAt = {};
      if (start) where.solvedAt.gte = new Date(start);
      if (end) where.solvedAt.lte = new Date(end);
    }

    let solved = await prisma.solvedQuestion.findMany({
      where,
      select: { id: true, isCorrect: true, solvedAt: true, question: { select: { id: true, topicId: true, topic: { select: { name: true } } } } },
      orderBy: { solvedAt: "asc" },
      take: limit > 0 ? limit : undefined,
    });

    if (solved.length === 0) {
      return NextResponse.json({ success: true, data: { items: [], totals: { total: 0, correct: 0, accuracy: 0 }, byTopic: [] } });
    }

    const totals = { total: solved.length, correct: solved.filter((s) => s.isCorrect).length };
    totals.accuracy = Math.round((totals.correct / totals.total) * 100);

    const byTopicMap = new Map();
    for (const s of solved) {
      const topicId = s.question.topicId;
      const topicName = s.question.topic?.name || `Topic ${topicId}`;
      if (!byTopicMap.has(topicId)) byTopicMap.set(topicId, { topicId, topicName, total: 0, correct: 0 });
      const entry = byTopicMap.get(topicId);
      entry.total += 1;
      if (s.isCorrect) entry.correct += 1;
    }
    const byTopic = Array.from(byTopicMap.values()).map((t) => ({ ...t, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }));

    const items = solved.map((s, idx) => ({
      index: idx + 1,
      questionId: s.question.id,
      topicId: s.question.topicId,
      topicName: s.question.topic?.name || `Topic ${s.question.topicId}`,
      isCorrect: s.isCorrect,
      solvedAt: s.solvedAt,
    }));

    return NextResponse.json({ success: true, data: { items, totals, byTopic } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


