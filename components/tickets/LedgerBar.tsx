type Props = {
  claimed: number;
  cap: number;
};

export default function LedgerBar({ claimed, cap }: Props) {
  const pct = cap > 0 ? Math.min(100, Math.round((claimed / cap) * 100)) : 0;

  return (
    <div className="mt-4">
      <div className="flex justify-between font-glitch text-[11px] tracking-wider text-foreground/60">
        <span>
          {claimed} / {cap} CLAIMED
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden bg-surface-raised">
        <div
          className="h-full bg-gradient-to-r from-neon-violet to-neon-purple transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
