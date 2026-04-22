import Link from "next/link";
import { Heart, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: branding + support */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">CHMP</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Child Health Management Platform — digitising Sri Lanka&apos;s Child Health Development Record.
            </p>
            <a
              href="mailto:support@chmp.lk"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              support@chmp.lk
            </a>
          </div>

          {/* Right: links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/tos" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {currentYear} CHMP. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for healthier children
          </p>
        </div>
      </div>
    </footer>
  );
}
