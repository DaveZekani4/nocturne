"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        RESTRICTED ACCESS
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Admin Login</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex w-full max-w-xs flex-col gap-3"
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border-subtle bg-surface px-4 py-3 text-sm outline-none focus:border-neon-purple"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border-subtle bg-surface px-4 py-3 text-sm outline-none focus:border-neon-purple"
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 bg-neon-purple py-3.5 font-display font-700 text-sm text-background disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
        </button>
      </form>
    </section>
  );
}
