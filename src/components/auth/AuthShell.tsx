"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:max-w-[540px] lg:px-16 lg:py-16 xl:max-w-[580px] xl:px-20">
        <Link href="/" className="mb-10 inline-block w-fit">
          <Logo size="md" />
        </Link>
        {children}
      </div>

      <div className="relative hidden min-h-[320px] flex-1 bg-kay-surface lg:block">
        <Image
          src="/images/kay-hero-luxury-box.png"
          alt="Kay luxury gifting"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kay-fg/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="font-serif text-[28px] leading-tight text-white drop-shadow-md">
            Thoughtful gifts,
            <br />
            beautifully curated.
          </p>
        </div>
      </div>
    </div>
  );
}
