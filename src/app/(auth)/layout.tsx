import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your CHMP account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-background)) 0%, var(--color-background) 50%, color-mix(in srgb, var(--color-primary) 5%, var(--color-background)) 100%)"
    }}>
      {children}
    </div>
  );
}
