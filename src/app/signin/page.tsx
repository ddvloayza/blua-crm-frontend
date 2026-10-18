"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
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

  return <main className="crm-signin flex min-h-screen flex-col bg-[#f8f9fc] text-[#111111]">
    <div className="border-b border-[#111111] bg-[#4A63E7] px-6 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white">BLUA INVESTMENT / ESPACIO COMERCIAL</div>
    <header className="mx-auto flex w-full max-w-6xl items-center gap-3 border-b border-[#111111] px-6 py-4">
      <Image src="/brand/blua-logo-dark.png" alt="Blua Investments" width={118} height={50} className="h-auto w-[118px]" priority />
      <span className="border-l border-[#111111] pl-3 font-mono text-xs font-bold tracking-[0.12em]">CRM</span>
    </header>
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-6 py-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
      <div className="crm-signin-hero flex min-h-[420px] flex-col justify-center border border-[#111111] p-8 text-white sm:p-10">
        <div className="crm-kicker crm-kicker-light">TU ESPACIO DE TRABAJO / 01</div>
        <h1 className="crm-title mt-5 max-w-xl !text-white">Cada conversación cuenta.</h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">Consulta tus prospectos, registra cada gestión y sigue el avance comercial desde un solo lugar.</p>
        <div className="mt-10 inline-flex w-fit border border-[#111111] bg-[#34D399] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide text-[#111111]">PROSPECTOS → CONTACTO → SEGUIMIENTO → CIERRE</div>
      </div>
      <form onSubmit={submit} className="crm-panel w-full max-w-md justify-self-end p-6 sm:p-8">
        <div className="crm-kicker">ACCESO / CRM</div>
        <h2 className="mt-3 text-2xl font-normal uppercase tracking-tight">Ingreso comercial</h2>
        <p className="mt-2 text-sm text-[#4b5563]">Usa tu cuenta de Blua con acceso al CRM.</p>
        <div className="mt-7 space-y-5">
          <label className="block text-xs font-semibold uppercase tracking-wide">Correo electrónico<input autoComplete="username" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="crm-field mt-2 block h-12 w-full px-4 text-sm font-normal normal-case" /></label>
          <label className="block text-xs font-semibold uppercase tracking-wide">Contraseña<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="crm-field mt-2 block h-12 w-full px-4 text-sm font-normal normal-case" /></label>
          {error && <p role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={busy} className="crm-button w-full gap-2 py-3">{busy ? "Ingresando…" : "Iniciar sesión"} <ArrowRight size={17} /></button>
        </div>
      </form>
    </div>
    <footer className="border-t border-[#111111] px-6 py-3 font-mono text-[10px] uppercase tracking-wide text-[#4b5563]"><div className="mx-auto max-w-6xl">BLUA CRM · GESTIÓN COMERCIAL</div></footer>
  </main>;
}
