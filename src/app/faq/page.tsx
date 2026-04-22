import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Baby, Shield, Calendar, Pill, TrendingUp, Syringe, User, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "FAQ — CHMP",
  description: "Frequently asked questions about the Child Health Management Platform",
};

const faqs = [
  {
    question: "What is CHMP?",
    answer:
      "CHMP (Child Health Management Platform) is a digital health platform designed to digitise Sri Lanka's Child Health Development Record (CHDR). It helps parents and medical professionals track vaccinations, growth records, prescriptions, and appointments in one place.",
    icon: <Baby className="h-5 w-5 text-primary" />,
  },
  {
    question: "Who can use CHMP?",
    answer:
      "CHMP is designed for two primary user groups: parents who want to manage their children's health records, and medical professionals (pediatricians and midwives) who provide healthcare services to children.",
    icon: <User className="h-5 w-5 text-primary" />,
  },
  {
    question: "How do I register my child?",
    answer:
      "After logging in as a parent, you can add a child from your dashboard by clicking the 'Add Child' button. You'll need to provide your child's name, date of birth, gender, and blood type.",
    icon: <FileText className="h-5 w-5 text-primary" />,
  },
  {
    question: "Can I book appointments through CHMP?",
    answer:
      "Yes. Parents can book appointments with registered pediatricians directly through the platform. Once booked, the appointment will be pending until the pediatrician confirms it.",
    icon: <Calendar className="h-5 w-5 text-primary" />,
  },
  {
    question: "How are vaccination records managed?",
    answer:
      "Medical professionals can add vaccination records for patients, including due dates, administered dates, batch numbers, and clinic information. Parents can view their child's full vaccination schedule and progress from their dashboard.",
    icon: <Syringe className="h-5 w-5 text-primary" />,
  },
  {
    question: "Can I track my child's growth?",
    answer:
      "Yes. Medical professionals can record growth measurements (weight and height), and the platform automatically calculates age-appropriate WHO z-scores. Parents can view growth charts and track their child's development over time.",
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
  },
  {
    question: "Is my data secure?",
    answer:
      "We take data security seriously. All health records are stored securely, and access is restricted based on user roles. Parents can only view their own children's records, and medical professionals can only access records for patients under their care.",
    icon: <Lock className="h-5 w-5 text-primary" />,
  },
  {
    question: "What if I forget my password?",
    answer:
      "You can reset your password from the login page by clicking 'Forgot password'. A reset link will be sent to your registered email address.",
    icon: <Shield className="h-5 w-5 text-primary" />,
  },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Frequently Asked Questions</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{faq.icon}</div>
                  <span>{faq.question}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Still have questions? Contact us at{" "}
            <a href="mailto:support@chmp.lk" className="text-primary hover:underline">
              support@chmp.lk
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
