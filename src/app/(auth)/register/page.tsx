import type { Metadata } from "next";
import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account — CHMP",
  description: "Create your Child Health Management Platform account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: "var(--color-primary)" }}
            >
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Create Account
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Join CHMP to manage child health records
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Secure health records powered by CHMP
        </p>
      </div>
    </div>
  );
}
