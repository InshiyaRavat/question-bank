import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Get subscription for a specific user
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userid');
  console.log('userId: ', userId);

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userid is required' }, { status: 400 });
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    console.log('subscription: ', subscription);

    if (!subscription) {
      return NextResponse.json({ success: false, subscription: null });
    }

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create new subscription
export async function POST(req) {
  try {
    const body = await req.json();
    const { userid, status, duration } = body;

    const subscription = await prisma.subscription.create({
      data: {
        userId: userid,
        status,
        duration,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update existing inactive subscription
export async function PUT(req) {
  try {
    const body = await req.json();
    const { userid, status, duration } = body;

    const updated = await prisma.subscription.updateMany({
      where: {
        userId: userid,
        status: 'inactive', // only update if currently inactive
      },
      data: {
        status,
        duration,
        updatedAt: new Date(),
      },
    });

    if (updated.count > 0) {
      return NextResponse.json({ success: true, message: 'Subscription updated' });
    } else {
      return NextResponse.json({ success: false, message: 'No inactive subscription found for update' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
