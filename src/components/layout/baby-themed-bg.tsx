"use client";

import Image from "next/image";

export function BabyThemedBg() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Teddy — top-right */}
      <div className="absolute -top-6 -right-6">
        <Image
          src="/teddy.png"
          alt=""
          width={240}
          height={240}
          className="opacity-[0.18]"
          unoptimized
        />
      </div>

      {/* Children — bottom-left */}
      <div className="absolute -bottom-10 -left-8">
        <Image
          src="/children.png"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.18]"
          unoptimized
        />
      </div>
    </div>
  );
}
