import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy — CHMP",
  description: "Privacy policy for the Child Health Management Platform",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
              <p>
                CHMP (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Child Health Management Platform.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, and role (parent or medical professional).</li>
                <li><strong>Patient Information:</strong> Name, date of birth, gender, blood type, and photograph (if uploaded).</li>
                <li><strong>Health Records:</strong> Appointment details, prescriptions, growth measurements, and vaccination records.</li>
                <li><strong>Usage Data:</strong> Log data, device information, and cookies for analytics and security.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and maintain the CHMP platform</li>
                <li>Enable parents to manage their children&apos;s health records</li>
                <li>Allow medical professionals to access and update patient records</li>
                <li>Send appointment reminders and health alerts</li>
                <li>Improve our services and user experience</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing and Disclosure</h2>
              <p className="mb-2">We do not sell your personal information. We may share data only in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>With Healthcare Providers:</strong> Medical professionals involved in your child&apos;s care can access relevant records.</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation.</li>
                <li><strong>Service Providers:</strong> Trusted third-party vendors who assist in operating our platform, bound by confidentiality agreements.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Children&apos;s Privacy</h2>
              <p>
                CHMP is designed to manage health records for children under parental supervision. We do not knowingly collect personal information directly from children under 13. All data is entered and managed by parents or authorized medical professionals.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated effective date.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:support@chmp.lk" className="text-primary hover:underline">support@chmp.lk</a>.
              </p>
            </div>

            <p className="text-xs text-muted-foreground pt-4 border-t">
              Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
