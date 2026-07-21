"use client";

import { useEffect, useState } from "react";

// Aug 7, 2026, 5PM WAT (UTC+1)
const EVENT_DATE = new Date("2026-08-07T17:00:00+01:00");

function getTimeLeft() {
  const diff = EVENT_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

export default function CountdownTimer() {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only timer init, avoids SSR/client mismatch
    setTime(getTimeLeft());
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Avoid a server/client mismatch flash — render nothing until mounted
  if (!time) {
    return <div className="mt-6 h-[74px]" />;
  }

  if (time.done) {
    return (
      <p className="mt-6 font-glitch text-sm uppercase tracking-[0.2em] text-neon-purple">
        It's live, hope to see you on the floor.
      </p>
    );
  }

  const units = [
    { label: "Days", value: time.days },
    { label: "Hrs", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className="mt-6">
      <p className="font-glitch text-[9.5px] uppercase tracking-[0.2em] text-foreground/50">
        Countdown to the Rave, Hope you anticipatin?
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="border border-border-subtle bg-surface py-2.5 text-center"
          >
            <div className="font-display font-800 text-xl text-neon-purple">
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="font-glitch text-[8.5px] uppercase tracking-wider text-foreground/40">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
