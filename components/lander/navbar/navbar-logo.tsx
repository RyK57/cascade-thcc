import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants/branding";

export function NavbarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.png" alt={`${BRAND.name} logo`} width={28} height={28} />
      <span className="font-secondary text-lg">{BRAND.name}</span>
    </Link>
  );
}
