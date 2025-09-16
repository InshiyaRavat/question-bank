import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const { clerkClient } = await import('@clerk/nextjs/server');
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  if (user.publicMetadata?.role !== 'admin') throw new Error("Forbidden");
  return { adminId: userId, adminName: user.fullName || user.username || 'admin' };
}

async function loadXlsx() {
  const mod = await import('xlsx');
  return mod.default || mod;
}

function normalizeRow(row) {
  // Accept header variations by trimming keys
  const get = (k) => row[k] ?? row[k?.trim?.()] ?? row[k?.toLowerCase?.()] ?? row[k?.replace(/\s+/g,'')];
  return {
    subjectName: (get('subjectName') ?? get('subject') ?? '').toString().trim(),
    topicName: (get('topicName') ?? get('topic') ?? '').toString().trim(),
    questionText: (get('questionText') ?? get('question') ?? '').toString().trim(),
    optionA: (get('optionA') ?? get('A') ?? '').toString(),
    optionB: (get('optionB') ?? get('B') ?? '').toString(),
    optionC: (get('optionC') ?? get('C') ?? '').toString(),
    optionD: (get('optionD') ?? get('D') ?? '').toString(),
    optionE: (get('optionE') ?? get('E') ?? '').toString(),
    correctOptionIdx: get('correctOptionIdx'),
    explanation: (get('explanation') ?? '').toString(),
    difficulty: (get('difficulty') ?? '').toString().toLowerCase(),
    tags: (get('tags') ?? '').toString(),
  };
}

function validateRow(nr, index) {
  const errors = [];
  if (!nr.subjectName) errors.push('subjectName required');
  if (!nr.topicName) errors.push('topicName required');
  if (!nr.questionText) errors.push('questionText required');
  const options = [nr.optionA, nr.optionB, nr.optionC, nr.optionD, nr.optionE].map(o => (o ?? '').toString().trim());
  if (options.some(o => !o)) errors.push('All options A-E required');
  const idx = Number(nr.correctOptionIdx);
  if (!Number.isInteger(idx) || idx < 0 || idx > 4) errors.push('correctOptionIdx must be 0-4');
  return { isValid: errors.length === 0, errors, options, idx };
}

async function parseFileToRows(file) {
  const xlsx = await loadXlsx();
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = xlsx.read(buf, { type: 'buffer' });
  const firstSheet = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheet];
  const rawRows = xlsx.utils.sheet_to_json(ws, { defval: '' });
  const rows = rawRows.map(normalizeRow);
  return rows;
}

async function upsertSubjectAndTopic(subjectName, topicName) {
  const subject = await prisma.subject.upsert({
    where: { name: subjectName },
    update: {},
    create: { name: subjectName }
  });
  const topic = await prisma.topic.findFirst({ where: { name: topicName, subjectId: subject.id } });
  if (topic) return { subject, topic };
  const created = await prisma.topic.create({ data: { name: topicName, subjectId: subject.id } });
  return { subject, topic: created };
}

export async function POST(req) {
  try {
    const { adminId, adminName } = await ensureAdmin();

    const contentType = req.headers.get('content-type') || '';
    let mode = 'preview';
    if (contentType.includes('application/json')) {
      // Insert mode with JSON payload
      const body = await req.json();
      mode = body.mode || 'insert';
      if (mode !== 'insert') return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) return NextResponse.json({ error: 'No items to insert' }, { status: 400 });

      // Process insert items
      const insertData = [];
      const skipped = [];

      // Cache existing subjects/topics by name
      const subjectCache = new Map();
      const topicCache = new Map(); // key: subjectId::topicName

      for (let i = 0; i < items.length; i++) {
        const nr = items[i];
        const v = validateRow(nr, i);
        if (!v.isValid) { skipped.push({ index: i, reason: v.errors.join('; ') }); continue; }
        const { subjectName, topicName, questionText, explanation, difficulty } = nr;
        const tags = nr.tags ? nr.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        let subject = subjectCache.get(subjectName);
        if (!subject) {
          subject = await prisma.subject.upsert({ where: { name: subjectName }, update: {}, create: { name: subjectName } });
          subjectCache.set(subjectName, subject);
        }

        const topicKey = `${subject.id}::${topicName}`;
        let topic = topicCache.get(topicKey);
        if (!topic) {
          topic = await prisma.topic.findFirst({ where: { name: topicName, subjectId: subject.id } });
          if (!topic) topic = await prisma.topic.create({ data: { name: topicName, subjectId: subject.id } });
          topicCache.set(topicKey, topic);
        }

        // Deduplicate by questionText within topic
        const existing = await prisma.question.findFirst({ where: { topicId: topic.id, questionText } });
        if (existing) { skipped.push({ index: i, reason: 'Duplicate question in same topic' }); continue; }

        insertData.push({
          topicId: topic.id,
          questionText,
          options: v.options,
          correctOptionIdx: v.idx,
          explanation: explanation || null,
          difficulty: difficulty || null,
          tags,
        });
      }

      let inserted = 0;
      if (insertData.length > 0) {
        const result = await prisma.question.createMany({ data: insertData, skipDuplicates: true });
        inserted = result.count || insertData.length;
        // Update topic noOfQuestions counts
        const byTopic = new Map();
        insertData.forEach(q => byTopic.set(q.topicId, (byTopic.get(q.topicId) || 0) + 1));
        await Promise.all(Array.from(byTopic.entries()).map(([topicId, inc]) =>
          prisma.topic.update({ where: { id: topicId }, data: { noOfQuestions: { increment: inc } } })
        ));
      }

      // Log activity
      await prisma.adminActivityLog.create({
        data: {
          adminId,
          adminName,
          action: 'bulk_insert_questions',
          resource: 'question',
          resourceId: null,
          details: { inserted, skipped },
        }
      });

      return NextResponse.json({ mode: 'insert', inserted, skipped });
    }

    // Multipart form-data: preview mode by default or mode=form field
    const form = await req.formData();
    const file = form.get('file');
    mode = form.get('mode') || 'preview';
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const rows = await parseFileToRows(file);
    const results = [];
    for (let i = 0; i < rows.length; i++) {
      const nr = rows[i];
      const v = validateRow(nr, i);
      results.push({ index: i, row: nr, valid: v.isValid, errors: v.errors });
    }

    return NextResponse.json({ mode: 'preview', count: rows.length, results });
  } catch (error) {
    console.error('Bulk questions error:', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (error.code === 'MODULE_NOT_FOUND') return NextResponse.json({ error: 'Missing dependency: xlsx. Please install it.' }, { status: 500 });
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}


