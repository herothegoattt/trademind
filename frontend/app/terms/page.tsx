import Link from "next/link";
import { LegalLayout, LegalSection } from "../../components/LegalLayout";

export const metadata = {
  title: "Terms of Service — TradeMind AI",
  description: "TradeMind AI Terms of Service",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    num: "01",
    title: "Acceptance of Terms",
    content: (
      <p>
        By accessing or using TradeMind AI ("Service", "Platform", "we", "us", or "our"),
        you agree to be bound by these Terms of Service ("Terms"). If you do not agree,
        do not use the Service. These Terms apply to all visitors, users, and others
        who access or use the Service. You may not use the Service if you are barred from
        doing so under applicable law.
      </p>
    ),
  },
  {
    id: "service",
    num: "02",
    title: "Description of Service",
    content: (
      <p>
        TradeMind AI is an AI-powered trading intelligence platform providing tools
        including trade journaling, decision analysis, psychological bias detection,
        market intelligence, daily bias summaries, and community features.
        The Service is intended for informational and educational purposes only.
        Features and availability may change without notice.
      </p>
    ),
  },
  {
    id: "not-advice",
    num: "03",
    title: "Not Financial Advice",
    content: (
      <>
        <div
          className="rounded-xl px-4 py-3.5 mb-4"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <p className="text-xs font-semibold tracking-wide" style={{ color: "rgba(252,211,77,0.8)" }}>
            ⚠ IMPORTANT DISCLAIMER
          </p>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgba(252,211,77,0.6)" }}>
            TradeMind AI does not provide financial, investment, tax, or legal advice.
          </p>
        </div>
        <p>
          All content, analysis, AI-generated outputs, market commentary, and community
          posts on the Platform are provided for informational and educational purposes
          only and must not be construed as professional financial advice. You should
          not make any financial decision based solely on information provided by
          TradeMind AI. Always consult a qualified financial advisor before making
          investment decisions. Past performance is not indicative of future results.
          Trading involves significant risk of loss and may not be suitable for all individuals.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    num: "04",
    title: "Eligibility",
    content: (
      <p>
        You must be at least 18 years of age and have the legal capacity to enter into
        binding contracts to use the Service. By using the Service, you represent and
        warrant that these conditions are met. Use of the Service is void where
        prohibited by applicable law. We reserve the right to verify eligibility and
        suspend accounts that do not meet these requirements.
      </p>
    ),
  },
  {
    id: "accounts",
    num: "05",
    title: "User Accounts",
    content: (
      <>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account. You agree to:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Provide accurate and complete registration information",
            "Notify us immediately of any unauthorized account access",
            "Maintain only one personal account",
            "Not share your credentials with third parties",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We reserve the right to terminate accounts, remove content, or cancel
          access at our sole discretion.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    num: "06",
    title: "Acceptable Use",
    content: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul className="mt-3 space-y-2">
          {[
            "Violate any applicable law, regulation, or third-party rights",
            "Reverse-engineer, decompile, or disassemble any part of the Service",
            "Upload or transmit viruses, malware, or malicious code",
            "Attempt unauthorized access to the Service or its infrastructure",
            "Harass, abuse, or harm other users through community features",
            "Share false, misleading, or manipulative market information",
            "Use automated bots or scrapers without written permission",
            "Resell or commercially exploit the Service without consent",
            "Circumvent any rate limiting, security, or access controls",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-white/20" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Violation of these restrictions may result in immediate termination of your
          account and, where applicable, legal action.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    num: "07",
    title: "Intellectual Property",
    content: (
      <p>
        The Service and its original content, features, branding, and functionality
        are the exclusive property of TradeMind AI and its licensors and are protected
        by applicable intellectual property laws. You retain ownership of trade journal
        entries you create. By submitting content to public community features, you
        grant us a non-exclusive, worldwide, royalty-free license to display, distribute,
        and promote that content within the Platform. This license terminates when you
        delete the content or close your account.
      </p>
    ),
  },
  {
    id: "ai-content",
    num: "08",
    title: "AI-Generated Content",
    content: (
      <p>
        The Platform uses artificial intelligence to generate analysis, commentary,
        and recommendations. AI-generated outputs are probabilistic in nature — they
        may be inaccurate, incomplete, or outdated. You acknowledge that all AI outputs
        require independent verification before being acted upon. TradeMind AI assumes
        no liability for any decisions or losses arising from reliance on AI-generated
        content.
      </p>
    ),
  },
  {
    id: "privacy-ref",
    num: "09",
    title: "Privacy",
    content: (
      <p>
        Your use of the Service is governed by our{" "}
        <Link
          href="/privacy"
          style={{ color: "#2dd4bf", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Privacy Policy
        </Link>
        , which is incorporated by reference into these Terms. By using the Service,
        you consent to the collection and use of your information as described in the
        Privacy Policy.
      </p>
    ),
  },
  {
    id: "third-party",
    num: "10",
    title: "Third-Party Services",
    content: (
      <p>
        The Service may integrate with or display content from third-party providers
        (market data feeds, news APIs, AI model providers). We do not endorse or assume
        responsibility for any third-party content, products, or services. Your
        interactions with third parties are governed by their own terms and privacy
        policies. We are not liable for any loss or damage caused by third-party services.
      </p>
    ),
  },
  {
    id: "disclaimers",
    num: "11",
    title: "Disclaimers & Limitation of Liability",
    content: (
      <>
        <p className="uppercase text-[11px] tracking-wide text-white/30 font-medium">
          The service is provided "as is" and "as available" without warranties of any
          kind, express or implied, including merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
        <p className="mt-4">
          To the maximum extent permitted by law, TradeMind AI shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages —
          including loss of profits, data, or goodwill — arising out of or in connection
          with your use of the Service. Our total liability shall not exceed the greater
          of (a) $100 USD or (b) the amount you paid us in the twelve months preceding
          the claim.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    num: "12",
    title: "Indemnification",
    content: (
      <p>
        You agree to indemnify and hold harmless TradeMind AI, its officers, directors,
        employees, and agents from any claims, damages, losses, liabilities, and expenses
        (including reasonable legal fees) arising out of your use of the Service,
        violation of these Terms, or infringement of any third-party rights.
      </p>
    ),
  },
  {
    id: "modifications",
    num: "13",
    title: "Modifications to Terms",
    content: (
      <p>
        We reserve the right to modify these Terms at any time. Material changes will
        be communicated by updating the "Last updated" date at the top of this page
        and, where appropriate, via in-app notification or email. Your continued use
        of the Service after changes take effect constitutes acceptance of the revised
        Terms. If you do not agree to the revised Terms, you must stop using the Service.
      </p>
    ),
  },
  {
    id: "termination",
    num: "14",
    title: "Termination",
    content: (
      <p>
        We may terminate or suspend your access immediately, without prior notice or
        liability, for any reason including breach of these Terms. Upon termination,
        your right to use the Service ceases. Provisions that by their nature should
        survive termination will survive — including IP rights, warranty disclaimers,
        indemnification, and limitations of liability.
      </p>
    ),
  },
  {
    id: "governing-law",
    num: "15",
    title: "Governing Law",
    content: (
      <p>
        These Terms shall be governed by and construed in accordance with applicable
        laws. Any disputes arising under these Terms shall be subject to the exclusive
        jurisdiction of competent courts. If any provision of these Terms is found
        to be unenforceable, the remaining provisions will remain in full force and effect.
      </p>
    ),
  },
  {
    id: "contact",
    num: "16",
    title: "Contact",
    content: (
      <p>
        If you have questions, concerns, or requests regarding these Terms, please
        contact us through the Platform's support channel or community page. We aim
        to respond to all inquiries within a reasonable timeframe.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      type="terms"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using TradeMind AI."
      updated="Effective April 5, 2026 · Last updated April 5, 2026"
      sections={sections}
    />
  );
}
