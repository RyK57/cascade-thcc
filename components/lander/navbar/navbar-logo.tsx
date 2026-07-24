import Image from "next/image";
import Link from "next/link";
import { FOCUS_RING } from "@/components/lander/shell";
import { BRAND } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

/**
 * The mark is 28px optically, but the hit area is a full 44px square with the
 * gutter pulled back so the logo still sits flush to the sheet edge.
 */
export function NavbarLogo() {
  return (
    <Link
      href="/"
      aria-label={`${BRAND.name} — home`}
      className={cn(
        "-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full",
        FOCUS_RING
      )}
    >
      <Image
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        priority
        className="size-7 rounded-full"
      />
    </Link>
  );
}
