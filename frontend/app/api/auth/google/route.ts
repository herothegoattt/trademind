import { NextRequest, NextResponse } from "next/server";
import {
  getUsers,
  saveUsers,
  createToken,
  updateUser,
  userToResponse,
  type StoredUser,
} from "@/lib/auth-server";

interface GoogleUserInfo {
  sub: string;       // google_id
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/** POST /api/auth/google — exchange Google access_token for our JWT */
export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();
    if (!access_token || typeof access_token !== "string") {
      return NextResponse.json({ detail: "Missing access_token" }, { status: 400 });
    }

    // Verify with Google and get user info
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!infoRes.ok) {
      return NextResponse.json({ detail: "Invalid Google token" }, { status: 401 });
    }

    const info: GoogleUserInfo = await infoRes.json();
    const { sub: google_id, email, name, picture, email_verified } = info;

    if (!email || !google_id) {
      return NextResponse.json({ detail: "Incomplete Google profile" }, { status: 400 });
    }

    if (email_verified === false) {
      return NextResponse.json({ detail: "Google email not verified" }, { status: 401 });
    }

    const users = getUsers();

    // Try to find by google_id first, then by email
    let user = users.find((u) => u.google_id === google_id)
      ?? users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      // Merge: update google_id / avatar if missing
      const updates: Partial<StoredUser> = {};
      if (!user.google_id)                   updates.google_id  = google_id;
      if (!user.avatar_url && picture)        updates.avatar_url = picture;
      if (Object.keys(updates).length > 0)   updateUser(user.id, updates);
      user = { ...user, ...updates };
    } else {
      // New user
      const newUser: StoredUser = {
        id:            users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
        email:         email.toLowerCase().trim(),
        name:          name ?? email.split("@")[0],
        password_hash: "",           // Google-only — no password
        created_at:    new Date().toISOString(),
        is_active:     true,
        avatar_url:    picture,
        google_id,
        is_onboarded:  false,
      };
      users.push(newUser);
      saveUsers(users);
      user = newUser;
    }

    const access_token_jwt = createToken(user.id);
    return NextResponse.json({
      access_token: access_token_jwt,
      token_type:   "bearer",
      user:         userToResponse(user),
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
