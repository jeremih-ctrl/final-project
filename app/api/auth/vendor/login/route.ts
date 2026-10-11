import { NextResponse } from "next/server";
import { verifyVendorCredentials } from "@/lib/server/vendor-auth-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const genericError = "Invalid email or password. Please check your credentials and try again.";

    if (!email || !password) {
      return NextResponse.json(
        { error: genericError },
        { status: 401 }
      );
    }

    const result = verifyVendorCredentials(email, password);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || genericError },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("API error in vendor login:", err);
    return NextResponse.json(
      { error: "Invalid email or password. Please check your credentials and try again." },
      { status: 401 }
    );
  }
}
