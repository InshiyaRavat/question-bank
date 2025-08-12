import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/reports/tests?userId=...&gap=30
// Groups a user's solved questions into sessions using an inactivity gap (minutes)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const gapMin = parseInt(searchParams.get("gap") || "30", 10);
    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    const solved = await prisma.solvedQuestion.findMany({
      where: { userId },
      select: { isCorrect: true, solvedAt: true, question: { select: { id: true, topicId: true, topic: { select: { name: true } } } } },
      orderBy: { solvedAt: "asc" },
    });

    const sessions = [];
    if (solved.length === 0) {
      return NextResponse.json({ success: true, data: { sessions } });
    }

    let current = { items: [], start: solved[0].solvedAt, end: solved[0].solvedAt };
    const gapMs = gapMin * 60 * 1000;

    for (let i = 0; i < solved.length; i++) {
      const item = solved[i];
      if (current.items.length === 0) {
        current.items.push(item);
        current.start = item.solvedAt;
        current.end = item.solvedAt;
        continue;
      }
      const prev = current.items[current.items.length - 1];
      const delta = item.solvedAt.getTime() - prev.solvedAt.getTime();
      if (delta <= gapMs) {
        current.items.push(item);
        current.end = item.solvedAt;
      } else {
        sessions.push(current);
        current = { items: [item], start: item.solvedAt, end: item.solvedAt };
      }
    }
    if (current.items.length) sessions.push(current);

    const results = sessions.map((s, idx) => {
      const total = s.items.length;
      const correct = s.items.filter((x) => x.isCorrect).length;
      const accuracy = total ? Math.round((correct / total) * 100) : 0;
      const topicMap = new Map();
      for (const it of s.items) {
        const tId = it.question.topicId;
        const tName = it.question.topic?.name || `Topic ${tId}`;
        if (!topicMap.has(tId)) topicMap.set(tId, { topicId: tId, topicName: tName, total: 0, correct: 0 });
        const e = topicMap.get(tId);
        e.total += 1; if (it.isCorrect) e.correct += 1;
      }
      const topics = Array.from(topicMap.values()).map(t => ({ ...t, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }));
      return {
        id: idx + 1,
        start: s.start,
        end: s.end,
        total,
        correct,
        accuracy,
        topics,
      };
    });

    return NextResponse.json({ success: true, data: { sessions: results } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


