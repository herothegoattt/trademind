import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, hashPassword, createToken, userToResponse } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ detail: "Email, password, and name are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ detail: "Password must be at least 6 characters" }, { status: 400 });
    }

    const users = getUsers();

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ detail: "Email already registered" }, { status: 409 });
    }

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: hashPassword(password),
      created_at: new Date().toISOString(),
      is_active: true,
    };

    users.push(newUser);
    saveUsers(users);

    return NextResponse.json(userToResponse(newUser), { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
