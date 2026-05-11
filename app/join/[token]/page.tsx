"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Loader2, GraduationCap, Check, AlertCircle } from "lucide-react";

interface InvitePreview {
  classId: string;
  className: string;
  invitedEmail: string;
  role: "student" | "teacher";
}

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/invites/preview?token=${token}`);
      const data = await r.json();
      if (r.ok) setInvite(data);
      else setError(data.error ?? "This invite is no longer valid");
    })();
  }, [token]);

  async function accept() {
    if (accepting || !isSignedIn) return;
    setAccepting(true);
    const r = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await r.json();
    setAccepting(false);
    if (!r.ok) { setError(data.error ?? "Failed to accept invite"); return; }
    setAccepted(true);
    setTimeout(() => router.push("/chat"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "linear-gradient(180deg,#eff6ff,#fff)" }}>
      <div className="max-w-md w-full rounded-3xl p-8"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>

        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}>
            🔍
          </div>
        </div>

        {!invite && !error && (
          <div className="text-center">
            <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: "#2563eb" }} />
            <p className="text-sm" style={{ color: "#64748b" }}>Looking up your invite…</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <AlertCircle size={32} style={{ color: "#dc2626", margin: "0 auto 12px" }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Invite unavailable</h1>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>{error}</p>
            <Link href="/" className="inline-block rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#2563eb", textDecoration: "none" }}>
              Go home
            </Link>
          </div>
        )}

        {invite && !accepted && (
          <>
            <div className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#2563eb" }}>
              {invite.role === "teacher" ? "Co-Teacher Invitation" : "Class Invitation"}
            </div>
            <h1 className="text-2xl font-extrabold mb-2 text-center" style={{ color: "#0f172a" }}>
              You&apos;re invited to join
            </h1>
            <div className="rounded-2xl px-4 py-3 mb-5 text-center flex items-center justify-center gap-2"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <GraduationCap size={18} style={{ color: "#1d4ed8" }} />
              <span className="font-bold text-lg" style={{ color: "#1d4ed8" }}>{invite.className}</span>
            </div>
            <p className="text-sm mb-6 text-center" style={{ color: "#64748b" }}>
              Sent to <strong style={{ color: "#0f172a" }}>{invite.invitedEmail}</strong>
            </p>

            {!isLoaded ? (
              <div className="text-center">
                <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#94a3b8" }} />
              </div>
            ) : !isSignedIn ? (
              <div className="space-y-3">
                <p className="text-sm text-center mb-4" style={{ color: "#374151" }}>
                  Sign up or sign in to accept this invite.
                </p>
                <SignUpButton mode="modal" forceRedirectUrl={`/join/${token}`}>
                  <button className="w-full rounded-xl py-3 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                    Sign Up & Accept
                  </button>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl={`/join/${token}`}>
                  <button className="w-full rounded-xl py-2.5 text-sm font-medium"
                    style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0" }}>
                    I already have an account
                  </button>
                </SignInButton>
              </div>
            ) : (
              <>
                <p className="text-xs text-center mb-4" style={{ color: "#64748b" }}>
                  Signed in as <strong>{user?.emailAddresses?.[0]?.emailAddress}</strong>
                </p>
                <button onClick={accept} disabled={accepting}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                  {accepting ? "Joining…" : "Accept Invite & Join"}
                </button>
              </>
            )}
          </>
        )}

        {accepted && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}>
              <Check size={32} style={{ color: "#fff" }} />
            </div>
            <h1 className="text-xl font-extrabold mb-1" style={{ color: "#0f172a" }}>You&apos;re in! 🎉</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>Taking you to the chat…</p>
          </div>
        )}
      </div>
    </div>
  );
}
