import Link from "next/link";
import { Plane } from "lucide-react";

// Public Terms of Service. A solid, honest baseline for an India-based SaaS that
// uses the Meta Platform. Review with a lawyer before real commercial launch.
export default function TermsPage() {
  const sections: { h: string; p: string[] }[] = [
    {
      h: "1. Acceptance",
      p: [
        "By creating an account or using SocialPilot AI (“the Service”, “we”, “us”), you agree to these Terms of Service and to our Privacy Policy. If you use the Service on behalf of a business, you confirm you are authorised to bind that business.",
      ],
    },
    {
      h: "2. The Service",
      p: [
        "SocialPilot AI helps businesses generate, schedule and publish social-media content, connect their own Facebook Page (and optionally a linked Instagram account), view engagement insights, and manage leads. Features and plans may change over time.",
      ],
    },
    {
      h: "3. Your account",
      p: [
        "You are responsible for your login credentials and for all activity under your account. Keep your password secure. Notify us promptly of any unauthorised use. You must provide accurate information and keep it up to date.",
      ],
    },
    {
      h: "4. Connecting Facebook & Instagram (Meta)",
      p: [
        "You may connect only Pages/accounts you own or are authorised to manage. When you connect, you grant us permission to publish the content you create and read that Page’s engagement on your behalf. You can disconnect at any time from Settings, or remove the app from your Facebook settings. Your use of Facebook and Instagram through the Service is also subject to Meta’s own terms and policies.",
      ],
    },
    {
      h: "5. Acceptable use",
      p: [
        "You must not use the Service to publish unlawful, misleading, infringing, hateful or spam content, to violate Meta Platform Terms or Community Standards, or to attempt to disrupt or reverse-engineer the Service. You are responsible for the content you create and publish.",
      ],
    },
    {
      h: "6. AI-generated content",
      p: [
        "The Service uses AI (Google Gemini) to help draft content. AI output may be inaccurate — you are responsible for reviewing and approving anything before it is published. We do not guarantee any particular result, reach or engagement.",
      ],
    },
    {
      h: "7. Plans & payments",
      p: [
        "Paid plans and their prices are shown in the app. Payments are currently handled manually (e.g. UPI); a plan is activated after we confirm payment. Unless required by law, fees are non-refundable. We may change prices with reasonable notice.",
      ],
    },
    {
      h: "8. Availability & changes",
      p: [
        "We aim to keep the Service available but do not guarantee uninterrupted operation. We may add, change or remove features, and may suspend accounts that breach these Terms.",
      ],
    },
    {
      h: "9. Disclaimers & liability",
      p: [
        "The Service is provided “as is”, without warranties of any kind to the extent permitted by law. To the maximum extent permitted by law, we are not liable for indirect or consequential losses, and our total liability is limited to the fees you paid us in the three months before the claim.",
      ],
    },
    {
      h: "10. Termination",
      p: [
        "You may stop using the Service and delete your account at any time (see the Privacy Policy for deletion). We may suspend or terminate accounts that violate these Terms. On termination, your access ends and your data is handled per the Privacy Policy.",
      ],
    },
    {
      h: "11. Governing law",
      p: [
        "These Terms are governed by the laws of India, and disputes are subject to the courts of Kolkata, West Bengal, unless a mandatory law provides otherwise.",
      ],
    },
    {
      h: "12. Contact",
      p: [
        "Questions about these Terms? Contact us at sarkarsantanu69@gmail.com.",
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
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: 2026. Please also read our <Link href="/privacy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link>.</p>
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
