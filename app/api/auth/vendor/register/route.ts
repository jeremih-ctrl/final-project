import { NextResponse } from "next/server";
import { registerVendorAccount } from "@/lib/server/vendor-auth-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = registerVendorAccount(email, password, name);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to register vendor account." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        account: result.account,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API error in vendor register:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during account creation." },
      { status: 500 }
    );
  }
}
