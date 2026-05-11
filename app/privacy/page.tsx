import Link from "next/link";
import { Shield } from "lucide-react";
import NavMenu from "@/components/NavMenu";

export const metadata = {
  title: "Privacy Policy · The Inquiry Engine",
  description: "How the Inquiry Engine collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Header />

      <article className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex items-center gap-2.5 mb-3" style={{ color: "#2563eb" }}>
          <Shield size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Privacy Policy</span>
        </div>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#0f172a" }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: "#64748b" }}>Effective: May 11, 2026 · Inquiry Engine</p>

        <Section title="1. The short version">
          <p>
            The Inquiry Engine (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;the service&rdquo;) is an AI tutoring product. We collect what we need to make the product work — your account, your classes, and the conversations you have with our AI tutor — and we don&apos;t sell any of it. We never sell student data, ever. This page explains exactly what we collect, why, and who else touches it.
          </p>
        </Section>

        <Section title="2. What we collect">
          <p><strong>Account information.</strong> When you sign up, our authentication provider Clerk stores your email, name, and a hashed password. We see this through Clerk; we do not store passwords ourselves.</p>
          <p><strong>Subscription information.</strong> If you subscribe to a paid plan, Stripe processes the payment. Stripe stores your card details on their secure infrastructure. We never see or store full card numbers. We do record which plan you are on and a Stripe customer ID.</p>
          <p><strong>Class membership.</strong> When you create or join a class, we store the class name, your role (teacher/student), and a join code.</p>
          <p><strong>Chat conversations.</strong> When you chat with the AI tutor, your messages are sent to Anthropic&apos;s Claude API to generate a response. We do not store the full transcripts of these chats in our database after the session ends.</p>
          <p><strong>Learning DNA snapshots.</strong> After each meaningful conversation, we run a second analysis pass that extracts structured signals — concepts discussed, mastery level, misconceptions, and growth observations. <em>These structured signals are stored</em>; the raw transcript is not.</p>
        </Section>

        <Section title="3. How we use it">
          <p>We use your data only to operate the product:</p>
          <ul>
            <li>To let you sign in and access your classes</li>
            <li>To deliver AI tutoring responses</li>
            <li>To compute the Learning DNA profile that teachers and students see in the dashboard</li>
            <li>To process subscription payments</li>
            <li>To debug errors and improve the product</li>
          </ul>
          <p><strong>We do not sell your data. We do not share it with advertisers. We do not use student data to train AI models.</strong></p>
        </Section>

        <Section title="4. Who else touches your data">
          <p>We use the following third-party services (&ldquo;subprocessors&rdquo;) to run the product. Each is bound by their own privacy policy:</p>
          <ul>
            <li><strong>Anthropic</strong> — processes chat messages to generate tutor responses. <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Privacy policy</a>. Anthropic&apos;s API does not retain user prompts for training by default.</li>
            <li><strong>Supabase</strong> — hosts our Postgres database where Learning DNA snapshots and class data are stored. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Privacy policy</a>.</li>
            <li><strong>Clerk</strong> — handles user accounts and authentication. <a href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Privacy policy</a>.</li>
            <li><strong>Stripe</strong> — processes payments. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Privacy policy</a>.</li>
            <li><strong>Vercel</strong> — hosts the application. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Privacy policy</a>.</li>
          </ul>
        </Section>

        <Section title="5. Children & COPPA">
          <p>
            The Inquiry Engine is designed for use in K-12 schools, which means some users will be under 13. We comply with the Children&apos;s Online Privacy Protection Act (COPPA).
          </p>
          <p>
            For users under 13, we rely on the <strong>school&apos;s authority</strong> (under COPPA&apos;s school-consent exception) to consent to data collection on behalf of parents, as long as the data is used solely for educational purposes — which is what we do. We collect the minimum necessary information to provide tutoring: an account, class membership, and Learning DNA signals from study sessions. We do not collect home addresses, phone numbers, photos, or unnecessary personal information.
          </p>
          <p>
            A parent of a child under 13 can email us at <a href="mailto:inquiryengine1@gmail.com" style={{ color: "#2563eb" }}>inquiryengine1@gmail.com</a> to review, correct, or delete their child&apos;s information.
          </p>
        </Section>

        <Section title="6. FERPA & school records">
          <p>
            When the Inquiry Engine is used by a school, we operate under the &ldquo;school official&rdquo; exception of the Family Educational Rights and Privacy Act (FERPA). We treat student data as confidential education records. We do not disclose student information to anyone except (a) the teachers of that student&apos;s class, (b) the school itself on request, or (c) where required by law.
          </p>
        </Section>

        <Section title="7. Data retention & deletion">
          <p>
            <strong>We will delete student data within 30 days of an account or class deletion, or upon written request from the school.</strong>
          </p>
          <p>
            To request deletion at any time, email <a href="mailto:inquiryengine1@gmail.com" style={{ color: "#2563eb" }}>inquiryengine1@gmail.com</a> from the email address associated with the account, or from a school administrator email if requesting on behalf of a class. We will confirm deletion in writing.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>You can:</p>
          <ul>
            <li><strong>Access</strong> your data — sign in to your dashboard to see your Learning DNA, classes, and account info</li>
            <li><strong>Correct</strong> it — update your name and class memberships at any time</li>
            <li><strong>Delete</strong> it — email us and we&apos;ll wipe your account and associated data within 30 days</li>
            <li><strong>Export</strong> it — teachers can export their class roster as CSV from the dashboard; for full Learning DNA export, email us</li>
            <li><strong>Object</strong> to specific uses — email us if you have concerns about how we process your data</li>
          </ul>
        </Section>

        <Section title="9. Security">
          <p>
            All data transmitted to and from the Inquiry Engine is encrypted in transit (HTTPS). Stored data is encrypted at rest by our database provider. We use industry-standard authentication (Clerk), payment processing (Stripe), and infrastructure (Vercel) to keep your information secure. We do not store payment card numbers ourselves.
          </p>
        </Section>

        <Section title="10. International users">
          <p>
            The Inquiry Engine operates from the United States. If you use the service from outside the US, your information will be transferred to and processed in the US. By using the service, you consent to that transfer.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this policy as the product evolves. Material changes — anything that meaningfully changes how we handle student data — will be announced to active users by email before they take effect. The &ldquo;Effective&rdquo; date at the top will reflect the latest revision.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions, requests, or complaints? Email us at <a href="mailto:inquiryengine1@gmail.com" style={{ color: "#2563eb" }}>inquiryengine1@gmail.com</a>. We typically respond within 2 business days.
          </p>
        </Section>

        <hr style={{ margin: "3rem 0 1.5rem", border: "none", borderTop: "1px solid #e2e8f0" }} />
        <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
          See also: <Link href="/terms" style={{ color: "#2563eb" }}>Terms of Service</Link>
        </p>
      </article>
    </div>
  );
}

function Header() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 30 }}>
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 max-w-6xl mx-auto gap-2">
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
            🔍
          </div>
          <span className="font-bold text-sm" style={{ color: "#0f172a" }}>Inquiry Engine</span>
        </Link>
        <NavMenu />
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="font-extrabold text-lg mb-3" style={{ color: "#0f172a" }}>{title}</h2>
      <div className="prose-legal text-sm leading-relaxed" style={{ color: "#374151" }}>
        {children}
      </div>
    </section>
  );
}
