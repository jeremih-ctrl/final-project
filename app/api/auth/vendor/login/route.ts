import { NextResponse } from "next/server";

/**
 * Legacy vendor login handler discontinued in favor of Clerk unified authentication.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy custom login has been discontinued. Please sign in through the Clerk authentication portal at /login.",
    },
    { status: 410 }
  );
}
