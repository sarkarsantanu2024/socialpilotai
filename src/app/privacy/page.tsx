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
        "Facebook & Instagram connection: when you choose to connect a Page, a Page access token (stored encrypted) that you grant so we can publish content and read insights for that Page. We never see or store your Facebook password — connection happens through Facebook Login only.",
        "Content & leads: posts you create, and lead/enquiry details (name, phone, email, interest) captured through your Page or entered by you.",
        "Payments: UPI reference details you submit for plan activation.",
      ],
    },
    {
      h: "3. Facebook & Instagram (Meta) data",
      p: [
        "SocialPilot AI uses the Meta (Facebook & Instagram) Platform. When you connect your Page, and only with your consent, we request the following permissions and use them solely as described:",
        "• pages_show_list — to show you the list of Pages you manage so you can choose which one to connect.",
        "• pages_manage_posts — to publish or schedule the posts you create to the Page you selected.",
        "• pages_read_engagement — to show you your Page’s reach, reactions, comments and shares so you can see how your content performed.",
        "• instagram_basic — to identify the Instagram Business account linked to your Page (if any).",
        "• instagram_content_publish — to publish, with your consent, the same post to that linked Instagram account.",
        "We use Meta data only to provide these features for you. We do not sell it, use it for advertising to third parties, or share it except with the infrastructure providers that run our service. Our use of information received from Meta APIs follows the Meta Platform Terms and Developer Policies.",
      ],
    },
    {
      h: "4. Why we use it (purpose)",
      p: [
        "To provide the service: generate and publish content, show analytics, manage leads, and process plan activations. We do not sell your data or your customers’ data.",
      ],
    },
    {
      h: "5. AI processing",
      p: [
        "Post text is generated using Google Gemini. Prompts include your business profile (name, city, tone, language) but not your customers’ personal data. On a free AI tier, prompts may be used by the AI provider to improve their models — avoid putting sensitive data in prompts.",
      ],
    },
    {
      h: "6. Storage & security",
      p: [
        "Data is stored on managed cloud infrastructure. Facebook and ad tokens are encrypted at rest (AES-256-GCM). Passwords are hashed with bcrypt. Access is scoped per organization and center.",
      ],
    },
    {
      h: "7. Revoking access & deleting your data",
      p: [
        "Disconnect any time: in the app go to Settings → Connections → Disconnect Facebook. This deletes the stored Page access token for that center immediately; we can no longer publish to or read that Page.",
        "You can also remove SocialPilot AI from your Facebook account at any time under Facebook → Settings & Privacy → Settings → Apps and Websites.",
        "Delete your data: to delete your whole account and all associated data (including any stored Meta tokens, posts and leads), email us at the address in the Contact section with the subject “Delete my account”. We verify the request and erase your data within 30 days. This page is our Data Deletion Instructions for Meta App Review purposes.",
      ],
    },
    {
      h: "8. Your rights (DPDP Act, 2023)",
      p: [
        "You can access, correct, export or delete your data and your captured leads. Lead data can be exported (CSV) and deleted from the Leads screen at any time. To delete your whole account, use the deletion steps above.",
      ],
    },
    {
      h: "9. Data retention",
      p: [
        "We keep data while your account is active. Test leads, rejected recommendations and expired trials are cleaned up periodically. On account deletion, we remove your data within 30 days.",
      ],
    },
    {
      h: "10. Contact",
      p: [
        "For any privacy request, data-deletion request or grievance, contact the SocialPilot AI team at systems@webspiders.com. We respond to DPDP and Meta data requests within the timelines the law requires.",
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
