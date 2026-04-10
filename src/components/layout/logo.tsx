"use client";

import { Baby } from "lucide-react";

export function Logo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm select-none">
      <Baby className="h-5 w-5" />
    </div>
  );
}
