import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Supabase Auth</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900">
          Sign in with a magic link
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          This keeps auth simple for the assignment and still gives each user their own saved dashboard preferences.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
