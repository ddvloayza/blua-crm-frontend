"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ChevronRight, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { logoutUser } from "@/lib/graphql/mutations/logoutUser";

export function CrmShell({ children }: { children: React.ReactNode }) {
  const { actor, loading, error } = useCrm();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  async function handleLogout() {
    setLogoutError(false);
    if (await logoutUser()) window.location.assign("/signin");
    else setLogoutError(true);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">Cargando CRM…</div>;
  }
  if (!actor) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Acceso al CRM no disponible</h1>
        <p className="mt-3 text-sm text-slate-500">{error || "Tu cuenta no tiene acceso al módulo comercial."}</p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-[#3458d7]" href="/signin">Iniciar sesión con otra cuenta</Link>
      </div>
    </div>;
  }

  const items = [
    { href: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/leads", label: "Prospectos", icon: Users, exact: false },
    ...(actor.role === "ADMIN" ? [{ href: "/admin", label: "Supervisión", icon: BarChart3, exact: false }] : []),
  ];

  const nav = <>
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#1632a6]">b</div>
      <div><div className="text-lg font-semibold tracking-tight">blua<span className="font-light"> crm</span></div>
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200">Gestión comercial</div>
      </div>
    </div>
    <div className="px-4 py-7">
      <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/70">Espacio de trabajo</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? "bg-white/15 font-semibold text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={18} strokeWidth={1.8} />{item.label}{active && <ChevronRight size={15} className="ml-auto" />}
          </Link>;
        })}
      </nav>
    </div>
    <div className="mt-auto border-t border-white/10 p-5">
      <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8fa5ff] font-semibold text-[#152967]">{actor.name?.[0]?.toUpperCase() || "B"}</div>
        <div className="min-w-0"><div className="truncate text-sm font-medium">{actor.name}</div>
          <div className="truncate text-xs text-blue-200">{actor.role === "ADMIN" ? "Administrador" : "Asesor comercial"}</div>
        </div>
      </div>
      <button onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-100 hover:bg-white/10"><LogOut size={16} /> Cerrar sesión</button>
      {logoutError && <p role="alert" className="px-3 text-xs text-rose-200">No se pudo cerrar sesión.</p>}
    </div>
  </>;

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#102b78] text-white lg:flex">{nav}</aside>
    {menuOpen && <div className="fixed inset-0 z-40 lg:hidden">
      <button aria-label="Cerrar menú" className="absolute inset-0 bg-slate-950/45" onClick={() => setMenuOpen(false)} />
      <aside className="relative flex h-full w-64 flex-col bg-[#102b78] text-white">{nav}</aside>
    </div>}
    <div className="lg:pl-64">
      <header className="flex h-20 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button aria-label="Abrir menú" className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div><div className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">Blua investment</div>
            <div className="text-sm font-semibold text-slate-800">Panel comercial</div></div>
        </div>
        <div className="hidden text-right sm:block"><div className="text-sm font-semibold">{actor.name}</div><div className="text-xs text-slate-500">{actor.email}</div></div>
      </header>
      <main className="mx-auto max-w-[1450px] px-5 py-8 sm:px-8">{children}</main>
    </div>
  </div>;
}
