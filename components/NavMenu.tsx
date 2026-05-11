"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Menu, X, Home, MessageSquare, LayoutDashboard, BookOpen,
  CreditCard, Shield, FileText, LogOut, LogIn, UserPlus,
} from "lucide-react";

interface Props {
  dark?: boolean; // dark variant (for the chat page header)
}

export default function NavMenu({ dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const wrapRef = useRef<HTMLDivElement>(null);

  // close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() { setOpen(false); }

  const btnColor = dark ? "var(--text-muted)" : "#64748b";
  const btnHover = dark ? "var(--surface)" : "#f1f5f9";
  const panelBg = dark ? "var(--settings-bg)" : "#fff";
  const panelBorder = dark ? "var(--settings-border)" : "#e2e8f0";
  const itemColor = dark ? "var(--text-primary)" : "#0f172a";
  const subColor = dark ? "var(--text-muted)" : "#64748b";

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
        className="flex items-center justify-center rounded-lg p-2 transition-all"
        style={{
          color: btnColor,
          border: `1px solid ${open ? panelBorder : "transparent"}`,
          background: open ? btnHover : "transparent",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = btnHover; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 rounded-2xl overflow-hidden"
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            boxShadow: dark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(15,23,42,0.18)",
            minWidth: 260,
          }}>

          {/* User header — if signed in */}
          {isSignedIn && user && (
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${panelBorder}` }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: subColor }}>Signed in as</div>
              <div className="text-sm font-bold truncate" style={{ color: itemColor }}>
                {user.firstName ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
              </div>
              <div className="text-xs truncate" style={{ color: subColor }}>
                {user.emailAddresses?.[0]?.emailAddress}
              </div>
            </div>
          )}

          {/* Main links */}
          <div className="py-1">
            <Item icon={<Home size={15} />}            label="Home"      href="/"          onClick={close} {...{ dark }} />
            {isSignedIn && <Item icon={<MessageSquare size={15} />}    label="Chat"      href="/chat"      onClick={close} {...{ dark }} />}
            {isSignedIn && <Item icon={<LayoutDashboard size={15} />}  label="Dashboard" href="/dashboard" onClick={close} {...{ dark }} />}
            <Item icon={<BookOpen size={15} />}        label="Guide"     href="/guide"     onClick={close} {...{ dark }} />
            <Item icon={<CreditCard size={15} />}      label="Pricing"   href="/pricing"   onClick={close} {...{ dark }} />
          </div>

          {/* Legal/footer links */}
          <div className="py-1" style={{ borderTop: `1px solid ${panelBorder}` }}>
            <Item icon={<Shield size={15} />}   label="Privacy"  href="/privacy"  onClick={close} subtle {...{ dark }} />
            <Item icon={<FileText size={15} />} label="Terms"    href="/terms"    onClick={close} subtle {...{ dark }} />
          </div>

          {/* Auth actions */}
          <div className="py-1" style={{ borderTop: `1px solid ${panelBorder}` }}>
            {isSignedIn ? (
              <button onClick={async () => { close(); await signOut({ redirectUrl: "/" }); }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: "#dc2626" }}
                onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(220,38,38,0.08)" : "#fef2f2")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <>
                <Item icon={<LogIn size={15} />}    label="Sign in"  href="/sign-in" onClick={close} {...{ dark }} />
                <Item icon={<UserPlus size={15} />} label="Sign up"  href="/sign-up" onClick={close} highlight {...{ dark }} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Item({ icon, label, href, onClick, subtle, highlight, dark }: {
  icon: React.ReactNode; label: string; href: string; onClick: () => void;
  subtle?: boolean; highlight?: boolean; dark?: boolean;
}) {
  const baseColor = subtle ? (dark ? "var(--text-muted)" : "#64748b") : (dark ? "var(--text-primary)" : "#0f172a");
  const highlightColor = "#2563eb";
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
      style={{
        color: highlight ? highlightColor : baseColor,
        fontWeight: highlight ? 700 : 500,
        textDecoration: "none",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = dark ? "var(--surface)" : "#f8fafc")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <span style={{ color: highlight ? highlightColor : (dark ? "var(--text-muted)" : "#94a3b8") }}>{icon}</span>
      {label}
    </Link>
  );
}
