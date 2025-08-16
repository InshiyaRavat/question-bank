import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const { duration, subscribedAt, status } = body;

  try {
    const updated = await prisma.subscription.update({
      where: { id: Number(id) },
      data: {
        ...(duration && { duration }),
        ...(subscribedAt && { subscribedAt: new Date(subscribedAt) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
