"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, Lock } from "lucide-react";

const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "/month",
    features: ["5 questions per day", "PDF uploads", "Photo uploads", "Socratic guidance"],
    locked: ["Unlimited questions", "Learning DNA tracking", "File uploads", "Link references"], highlight: false, cta: "Continue Free" },
  { id: "individual", name: "Individual", price: "$15", period: "/month",
    features: ["Unlimited questions", "Personal Learning DNA", "File & link uploads", "All AI models (Thinking)", "Priority responses", "Custom AI tutor settings"],
    locked: [], highlight: true, cta: "Select Plan" },
  { id: "classes", name: "Classes", price: "$100", period: "/month",
    features: ["Everything in Individual", "Class Learning DNA Dashboard", "Up to 35 students", "Misconception alerts", "Per-student growth tracking", "Assignment-aware tutoring"],
    locked: [], highlight: false, cta: "Select Plan" },
  { id: "schools", name: "Schools", price: "$1,500", period: "/month",
    features: ["Everything in Classes", "Unlimited students & teachers", "School-wide DNA Analytics", "Admin dashboard", "LMS integration", "Custom branding", "Dedicated support & SLA"],
    locked: [], highlight: false, cta: "Select Plan" },
];

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const currentPlan = (user?.publicMetadata?.plan as string) ?? "free";

  async function selectPlan(planId: string) {
    setLoading(planId);
    try {
      // Free plan: just record the choice and go to chat
      if (planId === "free") {
        await fetch("/api/set-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId }),
        });
        router.push("/chat");
        return;
      }
      // Paid plans: send to Stripe Checkout
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Could not start checkout. Try again.");
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
      else { alert(data.error ?? "Could not open portal."); setLoading(null); }
    } catch { setLoading(null); }
  }

  const isPaid = currentPlan !== "free" && currentPlan !== undefined;

  return (
    <div className="min-h-screen px-6 py-16" style={{ background: "#f0f7ff" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-4xl mb-3">💳</div>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#0f172a" }}>
            {currentPlan !== "free" ? "Change your plan" : "Pick a plan to get started"}
          </h1>
          <p style={{ color: "#9ca3af" }}>Powered by Stripe · Cancel anytime.</p>
          {isPaid && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl px-5 py-3"
              style={{ background: "#fff", border: "1.5px solid #bfdbfe", boxShadow: "0 2px 12px rgba(37,99,235,0.08)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#16a34a" }}>Active</span>
                <span className="text-sm font-bold capitalize" style={{ color: "#0f172a" }}>{currentPlan} plan</span>
              </div>
              <button onClick={openPortal} disabled={loading === "portal"}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", cursor: loading ? "wait" : "pointer" }}>
                {loading === "portal" ? "Opening…" : "Manage Subscription →"}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className="rounded-2xl p-6 flex flex-col" style={{
                background: plan.highlight ? "linear-gradient(145deg,#2563eb,#1d4ed8)" : "#fff",
                border: plan.highlight ? "none" : isCurrent ? "2px solid #2563eb" : "1.5px solid #dbeafe",
                boxShadow: plan.highlight ? "0 12px 40px rgba(37,99,235,0.35)" : "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                {plan.highlight && (
                  <div className="text-xs font-bold rounded-full px-3 py-1 mb-3 w-fit"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>⭐ Most Popular</div>
                )}
                <div className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{plan.name}</div>
                <div className="text-3xl font-extrabold mb-1" style={{ color: plan.highlight ? "#fff" : "#0f172a" }}>
                  {plan.price}<span className="text-sm font-normal" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>{plan.period}</span>
                </div>
                <div className="my-4 border-t" style={{ borderColor: plan.highlight ? "rgba(255,255,255,0.15)" : "#dbeafe" }} />
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <Check size={12} style={{ color: plan.highlight ? "#fff" : "#2563eb", flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.35)" : "#d1d5db" }}>
                      <Lock size={11} style={{ flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => selectPlan(plan.id)}
                  disabled={!!loading || isCurrent}
                  className="w-full rounded-xl py-2.5 text-sm font-bold transition-all"
                  style={{
                    background: isCurrent ? (plan.highlight ? "rgba(255,255,255,0.1)" : "#dbeafe") : plan.highlight ? "rgba(255,255,255,0.2)" : "#eff6ff",
                    color: isCurrent ? "#9ca3af" : plan.highlight ? "#fff" : "#2563eb",
                    border: plan.highlight ? "1px solid rgba(255,255,255,0.3)" : "1px solid #bfdbfe",
                    cursor: isCurrent || loading ? "not-allowed" : "pointer",
                  }}>
                  {loading === plan.id ? "Saving…" : isCurrent ? "Current Plan ✓" : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
