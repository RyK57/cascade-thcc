import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <Link href={ROUTES.home} className="inline-flex items-center" aria-label={BRAND.name}>
          <Image src="/logo.png" alt="" width={24} height={24} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        {children}
      </main>
    </div>
  );
}
