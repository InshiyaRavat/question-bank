import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function buildCsv() {
  const headers = [
    'subjectName','topicName','questionText',
    'optionA','optionB','optionC','optionD','optionE',
    'correctOptionIdx','explanation','difficulty','tags'
  ];
  const sample = [
    'Biology','Allergic Contact Dermatitis','What is the gold standard diagnostic test for allergic contact dermatitis?',
    'Auto-antibody screen','Patch testing','Serum IgE levels','RAST','Skin prick testing',
    '1','Patch testing is the most reliable diagnostic tool.','medium','dermatology,allergy'
  ];
  const lines = [headers.join(','), sample.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')];
  return lines.join('\n');
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csv = buildCsv();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="questions-template.csv"'
    }
  });
}


