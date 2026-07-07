import Link from "next/link";
import { Plane } from "lucide-react";

// Public privacy policy, written to be DPDP Act (India, 2023) aware. Review the
// details with a lawyer before real launch — this is a solid, honest baseline.
export default function PrivacyPage() {
  const sections: { h: string; p: string[] }[] = [
    {
      h: "1. Who we are",
      p: [
        "SocialPilot AI (“we”, “us”) helps small businesses manage their Facebook marketing. When a business uses SocialPilot to collect enquiries/leads, that business is the Data Fiduciary for its customers’ data; SocialPilot acts as a Data Processor on its behalf.",
      ],
    },
    {
      h: "2. What we collect",
      p: [
        "Account data: your name, business name, username, email (optional), and a hashed password.",
        "Business profile & brand: business type, city, tone, language and brand colours you provide.",
        "Facebook connection: a Page access token (stored encrypted) that you grant so we can publish and read insights for your Page. We never see or store your Facebook password.",
        "Content & leads: posts you create, and lead/enquiry details (name, phone, email, interest) captured through your Page or entered by you.",
        "Payments: UPI reference details you submit for plan activation.",
      ],
    },
    {
      h: "3. Why we use it (purpose)",
      p: [
        "To provide the service: generate and publish content, show analytics, manage leads, and process plan activations. We do not sell your data or your customers’ data.",
      ],
    },
    {
      h: "4. AI processing",
      p: [
        "Post text is generated using Google Gemini. Prompts include your business profile (name, city, tone, language) but not your customers’ personal data. On a free AI tier, prompts may be used by the AI provider to improve their models — avoid putting sensitive data in prompts.",
      ],
    },
    {
      h: "5. Storage & security",
      p: [
        "Data is stored on managed cloud infrastructure. Facebook and ad tokens are encrypted at rest (AES-256-GCM). Passwords are hashed with bcrypt. Access is scoped per organization and center.",
      ],
    },
    {
      h: "6. Your rights (DPDP Act, 2023)",
      p: [
        "You can access, correct, export or delete your data and your captured leads. Lead data can be exported (CSV) and deleted from the Leads screen at any time. To delete your whole account, contact us and we will erase your data.",
      ],
    },
    {
      h: "7. Data retention",
      p: [
        "We keep data while your account is active. Test leads, rejected recommendations and expired trials are cleaned up periodically. On account deletion, we remove your data within a reasonable period.",
      ],
    },
    {
      h: "8. Contact",
      p: [
        "For any privacy request or grievance, contact the SocialPilot AI team at the email associated with your account manager. We respond to DPDP requests within the timelines the law requires.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white"><Plane className="h-5 w-5 -rotate-45" /></span>
          <span className="text-lg font-bold tracking-tight">SocialPilot<span className="text-brand-600"> AI</span></span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: 2026. This baseline is written to be India DPDP Act (2023) aware.</p>
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-ink-600">{para}</p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-ink-100 pt-6">
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">&larr; Back to home</Link>
        </div>
      </main>
    </div>
  );
}
