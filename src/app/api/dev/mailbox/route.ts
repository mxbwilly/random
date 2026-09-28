import { NextResponse, type NextRequest } from "next/server";
import { devMailbox } from "@/lib/email/send";

/** Test-only: returns emails sent to an address. Disabled unless DEV_MAILBOX=1 (never set it in a real deployment). */
export async function GET(request: NextRequest) {
  if (process.env.DEV_MAILBOX !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const to = request.nextUrl.searchParams.get("to")?.toLowerCase();
  const mails = devMailbox.filter((m) => !to || m.to.toLowerCase() === to).map(({ to, subject, text, at }) => ({ to, subject, text, at }));
  return NextResponse.json({ mails });
}
