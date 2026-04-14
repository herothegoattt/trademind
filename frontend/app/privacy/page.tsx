import Link from "next/link";
import { LegalLayout, LegalSection } from "../../components/LegalLayout";

export const metadata = {
  title: "Privacy Policy — TradeMind AI",
  description: "TradeMind AI Privacy Policy",
};

const sections: LegalSection[] = [
  {
    id: "overview",
    num: "01",
    title: "Overview",
    content: (
      <p>
        TradeMind AI ("we", "us", "our") is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, disclose, and safeguard
        your information when you use the TradeMind AI platform. By using the Service
        you consent to the practices described here. If you do not agree, please
        discontinue use of the Service.
      </p>
    ),
  },
  {
    id: "collection",
    num: "02",
    title: "Information We Collect",
    content: (
      <>
        <div className="space-y-6">
          {[
            {
              label: "Account Information",
              items: [
                "Full name and email address",
                "Password (stored as a one-way hash — never plain text)",
                "Profile details you voluntarily provide",
              ],
            },
            {
              label: "Trading & Activity Data",
              items: [
                "Trade journal entries and notes you submit",
                "AI analysis requests and results returned to you",
                "Decisions, setups, and bias assessments you log",
                "Community posts, comments, and votes",
              ],
            },
            {
              label: "Technical & Usage Data",
              items: [
                "IP address, browser type, and operating system",
                "Pages visited and feature interactions (via PostHog analytics)",
                "Session timestamps and device identifiers",
                "Cookies and similar tracking technologies",
              ],
            },
          ].map(({ label, items }) => (
            <div key={label}>
              <p
                className="text-[10px] font-mono tracking-[0.15em] mb-2.5"
                style={{ color: "rgba(139,92,246,0.5)" }}
              >
                {label.toUpperCase()}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "use",
    num: "03",
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="mt-3 space-y-2">
          {[
            "Provide, maintain, and improve the Service",
            "Generate personalized AI analysis and insights from your trading data",
            "Authenticate your identity and secure your account",
            "Send transactional communications (password resets, account notices)",
            "Analyze usage patterns to improve features and fix bugs",
            "Detect and prevent fraud, abuse, and security threats",
            "Comply with applicable legal obligations",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div
          className="mt-5 rounded-xl px-4 py-3"
          style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)" }}
        >
          <p className="text-xs" style={{ color: "rgba(167,139,250,0.7)" }}>
            We do not sell your personal trading data to third parties for advertising purposes.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "ai-processing",
    num: "04",
    title: "AI Processing of Your Data",
    content: (
      <p>
        To deliver AI-powered features — trade analysis, bias detection, coaching —
        your journal entries and queries may be transmitted to third-party AI providers
        (such as Google Gemini or Anthropic Claude). These providers process data on
        our behalf under data processing agreements and are contractually prohibited
        from using your data to train their own models without explicit consent.
        Avoid submitting sensitive personal or financial account details in AI inputs.
      </p>
    ),
  },
  {
    id: "sharing",
    num: "05",
    title: "Data Sharing & Disclosure",
    content: (
      <>
        <p>We may share your information only in the following circumstances:</p>
        <ul className="mt-3 space-y-3">
          {[
            {
              label: "Service providers",
              desc: "Vendors who assist in operating the Service (hosting, analytics, AI APIs) under confidentiality agreements",
            },
            {
              label: "Legal requirements",
              desc: "When required by law, court order, or governmental authority",
            },
            {
              label: "Business transfers",
              desc: "In connection with a merger, acquisition, or asset sale — with advance notice to affected users",
            },
            {
              label: "Safety & security",
              desc: "To protect the rights, safety, or property of TradeMind AI, its users, or the public",
            },
          ].map(({ label, desc }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
              <span>
                <span className="text-white/60 font-medium">{label}</span>
                {" — "}
                {desc}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Community posts you make publicly are visible to other users of the Platform.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    num: "06",
    title: "Cookies & Analytics",
    content: (
      <p>
        We use cookies and similar technologies to authenticate sessions, remember
        preferences, and collect analytics data. We use PostHog for product analytics,
        which may record usage events such as page views and feature interactions.
        You can disable cookies in your browser settings; however, some functionality
        may be degraded. We do not use cookies to serve third-party advertising.
      </p>
    ),
  },
  {
    id: "retention",
    num: "07",
    title: "Data Retention",
    content: (
      <p>
        We retain your account and trading data for as long as your account is active
        or as needed to provide the Service. Upon account deletion, we will delete or
        anonymize your personal data within 30 days, except where retention is required
        for legal, tax, or compliance reasons. Anonymized, aggregated data may be
        retained indefinitely for analytics and service improvement purposes.
      </p>
    ),
  },
  {
    id: "security",
    num: "08",
    title: "Data Security",
    content: (
      <p>
        We implement industry-standard security measures including encrypted data
        storage, HTTPS for all data in transit, and bcrypt password hashing. Access
        to personal data is restricted to authorized personnel on a need-to-know basis.
        Despite these measures, no transmission over the internet is 100% secure.
        You are responsible for securing your account credentials. Notify us immediately
        if you suspect unauthorized access.
      </p>
    ),
  },
  {
    id: "rights",
    num: "09",
    title: "Your Rights & Choices",
    content: (
      <>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul className="mt-3 space-y-2">
          {[
            "Access the personal data we hold about you",
            "Correct inaccurate or incomplete data",
            "Request deletion of your personal data (right to erasure)",
            "Object to or restrict certain processing activities",
            "Receive your data in a portable, machine-readable format",
            "Withdraw consent where processing is based on consent",
            "Lodge a complaint with a supervisory authority",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          To exercise any of these rights, contact us via the Platform's support
          channel. We will respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "children",
    num: "10",
    title: "Children's Privacy",
    content: (
      <p>
        The Service is not directed to individuals under 18 years of age. We do not
        knowingly collect personal data from children. If we learn we have
        inadvertently collected such data, we will delete it promptly. If you believe
        a minor has provided us with personal information, please contact us immediately.
      </p>
    ),
  },
  {
    id: "transfers",
    num: "11",
    title: "International Data Transfers",
    content: (
      <p>
        Your information may be transferred to and processed in countries other than
        your own, where data protection laws may differ. We ensure appropriate
        safeguards — such as standard contractual clauses — are in place for such
        transfers in accordance with applicable data protection regulations, including
        GDPR where applicable.
      </p>
    ),
  },
  {
    id: "changes",
    num: "12",
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of
        material changes by updating the "Last updated" date and, where appropriate,
        by sending a notification via email or in-app alert. Your continued use of
        the Service after changes take effect constitutes acceptance of the revised
        policy.
      </p>
    ),
  },
  {
    id: "contact",
    num: "13",
    title: "Contact Us",
    content: (
      <p>
        If you have questions, concerns, or requests relating to this Privacy Policy
        or the handling of your personal data, please contact us through the Platform's
        support channel or community page. For formal data subject requests, include
        your registered email address so we can verify your identity.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      type="privacy"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal data."
      updated="Effective April 5, 2026 · Last updated April 5, 2026"
      sections={sections}
    />
  );
}
