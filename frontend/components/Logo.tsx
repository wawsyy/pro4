import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-slate-100">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
        <Image src="/ess-mark.svg" alt="Encrypted Survey Shield" width={40} height={40} priority />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Encrypted
        </span>
        <span className="text-lg font-semibold text-white">Survey System</span>
      </div>
    </Link>
  );
}

