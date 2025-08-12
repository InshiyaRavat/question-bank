import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/reports/comparison?userId=...&days=30
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const userSolved = await prisma.solvedQuestion.findMany({ where: { userId, solvedAt: { gte: sinceDate } }, select: { isCorrect: true, question: { select: { topicId: true } } } });
    const allSolved = await prisma.solvedQuestion.findMany({ where: { solvedAt: { gte: sinceDate } }, select: { isCorrect: true, userId: true, question: { select: { topicId: true } } } });

    const userTotals = { total: userSolved.length, correct: userSolved.filter((s) => s.isCorrect).length };
    userTotals.accuracy = userTotals.total ? Math.round((userTotals.correct / userTotals.total) * 100) : 0;

    const allTotals = { total: allSolved.length, correct: allSolved.filter((s) => s.isCorrect).length };
    allTotals.accuracy = allTotals.total ? Math.round((allTotals.correct / allTotals.total) * 100) : 0;

    const perTopic = new Map();
    for (const s of allSolved) {
      const t = s.question.topicId;
      if (!perTopic.has(t)) perTopic.set(t, { topicId: t, total: 0, correct: 0 });
      const e = perTopic.get(t);
      e.total += 1;
      if (s.isCorrect) e.correct += 1;
    }
    const globalByTopic = Array.from(perTopic.values()).map((t) => ({ topicId: t.topicId, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }));

    const userPerTopic = new Map();
    for (const s of userSolved) {
      const t = s.question.topicId;
      if (!userPerTopic.has(t)) userPerTopic.set(t, { topicId: t, total: 0, correct: 0 });
      const e = userPerTopic.get(t);
      e.total += 1;
      if (s.isCorrect) e.correct += 1;
    }
    const userByTopic = Array.from(userPerTopic.values()).map((t) => ({ topicId: t.topicId, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }));

    return NextResponse.json({ success: true, data: { userTotals, allTotals, userByTopic, globalByTopic } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


