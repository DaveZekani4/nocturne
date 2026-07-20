import Link from "next/link";
import { Ticket, ShoppingBag } from "lucide-react";
import CountdownTimer from "@/components/shared/CountdownTimer";

export default function HeroLandingPage() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden px-6 pb-10 pt-11 noise-overlay"
      style={{
        backgroundImage:
          "radial-gradient(120% 60% at 50% 0%, rgba(109,40,217,0.35), transparent 60%)",
      }}
    >
      <p className="mb-4 flex items-center gap-2 font-glitch text-[10.5px] tracking-[0.2em] text-neon-purple">
        <span className="" />
        Welcome To
      </p>

      <h1
        data-text="NOCTURNE"
        className="glitch-text font-display font-800 text-6xl leading-[0.86] tracking-tight text-electric-white"
      >
        NOCTURNE
      </h1>
      <div className="mt-2 font-glitch text-base font-700 tracking-[0.3em] text-foreground/50">
        <span className="text-electric-white">RAVE</span> {"V1.0"}
      </div>

      <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-foreground/70">
        The semester&apos;s gone. So should MU&apos;s boring routine.{" "}
        Nobody needs to tell you twice, you have to be there.
      </p>

      <CountdownTimer />

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <div className="border border-border-subtle bg-surface p-3.5">
          <div className="font-glitch text-[9.5px] uppercase tracking-wider text-foreground/50">
            Doors Open?
          </div>
          <div className="mt-1 font-display font-700 text-lg text-neon-purple">
            5PM
          </div>
        </div>
        <div className="border border-border-subtle bg-surface p-3.5">
          <div className="font-glitch text-[9.5px] uppercase tracking-wider text-foreground/50">
           How Long?
          </div>
          <div className="mt-1 font-display font-700 text-lg">
            Till Mama Calls
          </div>
        </div>
      </div>

      <div className="mt-7 flex gap-2.5">
        <Link
          href="/tickets"
          className="flex flex-1 items-center justify-center gap-1.5 border border-neon-purple bg-neon-purple py-3.5 font-display font-700 text-[13.5px] text-background border-glow"
        >
          <Ticket size={16} /> Claim Access
        </Link>
        <Link
          href="/merch"
          className="flex flex-1 items-center justify-center gap-1.5 border border-border-subtle py-3.5 font-display font-700 text-[13.5px]"
        >
          <ShoppingBag size={16} /> View Gear
        </Link>
      </div>
    </section>
  );
}
