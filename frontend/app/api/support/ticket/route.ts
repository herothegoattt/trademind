import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR     = join(process.cwd(), "data");
const TICKETS_FILE = join(DATA_DIR, "support-tickets.json");

interface Ticket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: "open" | "replied" | "closed";
}

function getTickets(): Ticket[] {
  try {
    if (!existsSync(TICKETS_FILE)) return [];
    return JSON.parse(readFileSync(TICKETS_FILE, "utf8"));
  } catch { return []; }
}

function saveTicket(ticket: Ticket): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tickets = getTickets();
  tickets.push(ticket);
  writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from:    "TradeMind Support <noreply@trademind.ai>",
      to:      [to],
      subject,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ detail: "Name, email, and message are required." }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ detail: "Invalid email address." }, { status: 400 });
    }

    const tickets = getTickets();
    const ticket: Ticket = {
      id:         tickets.length > 0 ? Math.max(...tickets.map((t) => t.id)) + 1 : 1,
      name:       name.trim(),
      email:      email.trim().toLowerCase(),
      subject:    subject?.trim() || "Support Request",
      message:    message.trim(),
      created_at: new Date().toISOString(),
      status:     "open",
    };

    saveTicket(ticket);

    const supportEmail = process.env.SUPPORT_EMAIL ?? "support@trademind.ai";

    // ── Notify support team ──────────────────────────────────────────────────
    await sendEmail(
      supportEmail,
      `[#${ticket.id}] New ticket — ${ticket.subject}`,
      `
        <div style="font-family:sans-serif;max-width:560px;color:#1e293b">
          <h2 style="color:#7C6FE0;margin:0 0 20px">New Support Ticket #${ticket.id}</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:100px">From</td>
                <td style="padding:8px 0;font-weight:500">${ticket.name} &lt;${ticket.email}&gt;</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Subject</td>
                <td style="padding:8px 0">${ticket.subject}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Date</td>
                <td style="padding:8px 0">${new Date(ticket.created_at).toLocaleString()}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;border-left:3px solid #7C6FE0">
            <p style="margin:0;white-space:pre-wrap">${ticket.message}</p>
          </div>
          <p style="margin-top:20px;color:#94a3b8;font-size:12px">
            Reply directly to ${ticket.email} to respond.
          </p>
        </div>
      `,
    );

    // ── Confirm to user ──────────────────────────────────────────────────────
    await sendEmail(
      ticket.email,
      `We received your message — TradeMind Support`,
      `
        <div style="font-family:sans-serif;max-width:560px;color:#1e293b">
          <h2 style="color:#7C6FE0;margin:0 0 8px">We got your message, ${ticket.name.split(" ")[0]}.</h2>
          <p style="color:#64748b;margin:0 0 24px">Our team typically replies within 24 hours.</p>
          <div style="padding:16px;background:#f8fafc;border-radius:8px;border-left:3px solid #e2e8f0">
            <p style="margin:0;color:#64748b;font-size:13px">Your message:</p>
            <p style="margin:8px 0 0;white-space:pre-wrap">${ticket.message}</p>
          </div>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px">
            Ticket #${ticket.id} · TradeMind AI Support
          </p>
        </div>
      `,
    );

    return NextResponse.json({ success: true, ticket_id: ticket.id });
  } catch (err) {
    console.error("Support ticket error:", err);
    return NextResponse.json({ detail: "Internal server error." }, { status: 500 });
  }
}

/** GET — list all tickets (admin use, unprotected for now) */
export async function GET() {
  return NextResponse.json(getTickets());
}
