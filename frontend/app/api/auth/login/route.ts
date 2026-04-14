import { NextRequest, NextResponse } from "next/server";
import { getUsers, verifyPassword, createToken } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ detail: "Account is disabled" }, { status: 403 });
    }

    const access_token = createToken(user.id);
    return NextResponse.json({ access_token, token_type: "bearer" });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
