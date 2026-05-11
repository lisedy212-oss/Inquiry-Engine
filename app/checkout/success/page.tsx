"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"verifying" | "ok" | "error">("verifying");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    (async () => {
      try {
        const r = await fetch(`/api/stripe/checkout/verify?session_id=${sessionId}`);
        const data = await r.json();
        if (r.ok && data.plan) { setPlan(data.plan); setStatus("ok"); }
        else setStatus("error");
      } catch { setStatus("error"); }
    })();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "linear-gradient(180deg,#eff6ff,#fff)" }}>
      <div className="max-w-md w-full rounded-3xl p-8 text-center"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>

        {status === "verifying" && (
          <>
            <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "#2563eb" }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Confirming your subscription…</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>Just a moment.</p>
          </>
        )}

        {status === "ok" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}>
              <Check size={32} style={{ color: "#fff" }} />
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#0f172a" }}>You&apos;re upgraded! 🎉</h1>
            <p className="text-sm mb-6 capitalize" style={{ color: "#64748b" }}>
              Welcome to the <strong style={{ color: "#0f172a" }}>{plan}</strong> plan. Unlimited questions, full Learning DNA, and all the good stuff.
            </p>
            <button onClick={() => router.push("/chat")}
              className="w-full rounded-xl py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              Open Chat
            </button>
            <Link href="/dashboard" className="block mt-3 text-xs" style={{ color: "#94a3b8" }}>
              or go to Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-3">😕</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Something went wrong</h1>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>
              We couldn&apos;t verify your subscription. If you were charged, contact support.
            </p>
            <Link href="/pricing" className="inline-block rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#2563eb", textDecoration: "none" }}>
              Back to Pricing
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
