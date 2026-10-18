"use client";

import { FormEvent, useState } from "react";
import { loginUser } from "@/lib/auth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginUser(email, password);
      window.location.assign("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6 text-slate-900">
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1632a6] text-xl font-bold text-white">b</span><span className="text-xl font-semibold">blua <span className="font-normal">crm</span></span></div>
      <div><h1 className="text-2xl font-semibold">Ingreso comercial</h1><p className="mt-1 text-sm text-slate-500">Usa tu cuenta de Blua con acceso al CRM.</p></div>
      <label className="block text-sm font-medium">Correo electrónico<input autoComplete="username" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#3458d7]" /></label>
      <label className="block text-sm font-medium">Contraseña<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#3458d7]" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#3458d7] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Ingresando…" : "Iniciar sesión"}</button>
    </form>
  </main>;
}
