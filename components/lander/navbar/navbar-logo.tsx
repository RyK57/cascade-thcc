import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants/branding";

export function NavbarLogo() {
  return (
    <Link href="/" className="flex items-center" aria-label={BRAND.name}>
      <Image
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        className="rounded-full"
      />
    </Link>
  );
}
