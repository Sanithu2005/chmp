import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service — CHMP",
  description: "Terms of service for the Child Health Management Platform",
};

export default function TOSPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Terms of Service</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Child Health Management Platform (&ldquo;CHMP&rdquo;, &ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
              <p>
                CHMP is a digital health management platform that enables parents and medical professionals to record, track, and manage child health information including vaccinations, growth records, prescriptions, and appointments.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
              <p className="mb-2">To use CHMP, you must create an account. You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. User Responsibilities</h2>
              <p className="mb-2">As a user of CHMP, you agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the Platform for any illegal or unauthorized purpose</li>
                <li>Share your account credentials with third parties</li>
                <li>Upload false, misleading, or fraudulent health information</li>
                <li>Attempt to access records that do not belong to you</li>
                <li>Interfere with or disrupt the operation of the Platform</li>
                <li>Reverse engineer or attempt to extract the source code of the Platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Medical Disclaimer</h2>
              <p>
                CHMP is a record-keeping tool and does not provide medical advice. The information on the Platform is for informational purposes only and should not replace professional medical judgment. Always consult a qualified healthcare provider for medical decisions.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Data Ownership and Privacy</h2>
              <p>
                You retain ownership of the data you input into the Platform. By using CHMP, you grant us a license to store, process, and display your data as necessary to provide the service. We handle all data in accordance with our Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion. You may also delete your account at any time by contacting support.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, CHMP and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform. Our total liability shall not exceed the amount you paid to use the service in the preceding 12 months.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Modifications to Terms</h2>
              <p>
                We may modify these Terms of Service at any time. We will notify users of significant changes by posting an updated version on the Platform. Continued use after changes constitutes acceptance of the revised terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Sri Lanka. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">11. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
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
