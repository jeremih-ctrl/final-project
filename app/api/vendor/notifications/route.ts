import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbGetNotifications, dbMarkNotificationRead } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await dbGetNotifications(userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const success = await dbMarkNotificationRead(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
