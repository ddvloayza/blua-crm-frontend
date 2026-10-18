"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
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

  return <main className="crm-signin flex min-h-screen flex-col bg-[#f3f0ea] text-[#32302d]">
    <div className="border-b border-[#383632] bg-[#f4ed52] px-6 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em]">BLUA INVESTMENT / ESPACIO COMERCIAL</div>
    <header className="mx-auto flex w-full max-w-6xl items-center gap-3 border-b border-[#383632] px-6 py-5">
      <span className="flex h-10 w-10 items-center justify-center bg-[#f2a35e] text-2xl font-bold">b</span>
      <span className="text-xl font-semibold tracking-tight">blua <span className="font-normal">crm</span></span>
    </header>
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
      <div>
        <div className="crm-kicker">TU ESPACIO DE TRABAJO / 01</div>
        <h1 className="crm-title mt-5 max-w-xl">Cada conversación cuenta.</h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-[#615d57]">Consulta tus prospectos, registra cada gestión y sigue el avance comercial desde un solo lugar.</p>
        <div className="mt-10 inline-flex border border-[#383632] bg-[#acd3f7] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">PROSPECTOS → CONTACTO → SEGUIMIENTO → CIERRE</div>
      </div>
      <form onSubmit={submit} className="crm-panel w-full max-w-md justify-self-end p-6 sm:p-8">
        <div className="crm-kicker">ACCESO / CRM</div>
        <h2 className="mt-3 text-2xl font-normal uppercase tracking-tight">Ingreso comercial</h2>
        <p className="mt-2 text-sm text-[#615d57]">Usa tu cuenta de Blua con acceso al CRM.</p>
        <div className="mt-7 space-y-5">
          <label className="block text-xs font-semibold uppercase tracking-wide">Correo electrónico<input autoComplete="username" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="crm-field mt-2 block h-12 w-full px-4 text-sm font-normal normal-case" /></label>
          <label className="block text-xs font-semibold uppercase tracking-wide">Contraseña<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="crm-field mt-2 block h-12 w-full px-4 text-sm font-normal normal-case" /></label>
          {error && <p role="alert" className="border border-red-700 bg-[#f8d8d0] p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={busy} className="crm-button w-full gap-2 py-3">{busy ? "Ingresando…" : "Iniciar sesión"} <ArrowRight size={17} /></button>
        </div>
      </form>
    </div>
    <footer className="border-t border-[#383632] px-6 py-3 font-mono text-[10px] uppercase tracking-wide text-[#615d57]"><div className="mx-auto max-w-6xl">BLUA CRM · GESTIÓN COMERCIAL</div></footer>
  </main>;
}
