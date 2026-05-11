// Server-only email client wrapping Resend.

import { Resend } from "resend";

let cached: Resend | null = null;
function client(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.EMAIL_FROM || "Inquiry Engine <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  className: string;
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const acceptUrl = `${APP_URL}/join/${opts.token}`;
  const subject = `${opts.inviterName} invited you to join "${opts.className}"`;
  const html = renderInviteHtml({ ...opts, acceptUrl });
  const text = renderInviteText({ ...opts, acceptUrl });

  try {
    const r = await client().emails.send({
      from: FROM,
      to: opts.to,
      subject,
      html,
      text,
    });
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function renderInviteHtml(opts: { inviterName: string; className: string; acceptUrl: string }): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Class invitation</title></head>
<body style="margin:0;padding:0;background:#f0f7ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(37,99,235,0.08);">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;font-size:24px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);">🔍</div>
        </td></tr>
        <tr><td style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;padding-bottom:8px;text-align:center;">CLASS INVITATION</td></tr>
        <tr><td style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.3;padding-bottom:16px;text-align:center;">
          ${escapeHtml(opts.inviterName)} invited you to join <span style="color:#2563eb;">${escapeHtml(opts.className)}</span>
        </td></tr>
        <tr><td style="font-size:15px;color:#475569;line-height:1.6;padding-bottom:28px;text-align:center;">
          The Inquiry Engine is an AI study partner that guides you through problems by asking questions, not just handing over answers. Click below to accept the invite and join your class.
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${opts.acceptUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">Accept Invite →</a>
        </td></tr>
        <tr><td style="font-size:13px;color:#94a3b8;text-align:center;padding-bottom:8px;">
          Or copy this link into your browser:
        </td></tr>
        <tr><td style="font-size:12px;color:#64748b;text-align:center;word-break:break-all;padding-bottom:24px;">
          <a href="${opts.acceptUrl}" style="color:#2563eb;">${opts.acceptUrl}</a>
        </td></tr>
        <tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.5;">
          If you weren&apos;t expecting this email, you can ignore it. The link expires in 30 days.
        </td></tr>
      </table>
      <p style="font-size:11px;color:#94a3b8;margin-top:16px;">© 2026 Inquiry Engine</p>
    </td></tr>
  </table>
</body></html>`;
}

function renderInviteText(opts: { inviterName: string; className: string; acceptUrl: string }): string {
  return `${opts.inviterName} invited you to join "${opts.className}" on the Inquiry Engine.

Accept the invite here:
${opts.acceptUrl}

If you weren't expecting this email, you can ignore it. The link expires in 30 days.

— The Inquiry Engine`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]!);
}
