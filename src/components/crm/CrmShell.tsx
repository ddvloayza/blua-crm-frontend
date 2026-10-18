"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, BarChart3, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
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

  if (loading) return <div className="crm-app flex min-h-screen items-center justify-center text-sm">Cargando CRM…</div>;
  if (!actor) return <div className="crm-app flex min-h-screen items-center justify-center p-6">
    <div className="crm-panel max-w-md p-8 text-center">
      <div className="crm-kicker">BLUA / CRM</div>
      <h1 className="mt-4 text-2xl font-medium uppercase tracking-tight">Acceso al CRM no disponible</h1>
      <p className="mt-4 text-sm text-[#6b6862]">{error || "Tu cuenta no tiene acceso al módulo comercial."}</p>
      <Link className="crm-button mt-7 inline-flex items-center gap-2" href="/signin">Iniciar sesión con otra cuenta <ArrowUpRight size={16} /></Link>
    </div>
  </div>;

  const items = [
    { href: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/leads", label: "Prospectos", icon: Users, exact: false },
    ...(actor.role === "ADMIN" ? [{ href: "/admin", label: "Supervisión", icon: BarChart3, exact: false }] : []),
  ];

  const nav = <>
    <div className="flex h-[92px] items-center gap-3 border-b border-[#383632] px-6">
      <div className="flex h-10 w-10 items-center justify-center bg-[#f2a35e] text-2xl font-bold text-[#32302d]">b</div>
      <div><div className="text-xl font-semibold leading-none tracking-tight">blua<span className="font-normal"> crm</span></div>
        <div className="crm-kicker mt-1.5 text-[10px]">GESTIÓN COMERCIAL</div>
      </div>
    </div>
    <div className="px-4 py-7">
      <div className="crm-kicker px-3 pb-3">ESPACIO DE TRABAJO</div>
      <nav className="space-y-2" aria-label="Navegación CRM">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border px-3 py-3 text-sm font-medium transition-colors ${active ? "border-[#383632] bg-[#acd3f7]" : "border-transparent hover:border-[#383632] hover:bg-[#fffdfa]"}`}>
            <Icon size={18} strokeWidth={1.8} />{item.label}{active && <ArrowUpRight size={15} className="ml-auto" />}
          </Link>;
        })}
      </nav>
    </div>
    <div className="mt-auto border-t border-[#383632] p-4">
      <div className="flex items-center gap-3 border border-[#383632] bg-[#fffdfa] p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f2ec66] font-semibold">{actor.name?.[0]?.toUpperCase() || "B"}</div>
        <div className="min-w-0"><div className="truncate text-sm font-medium">{actor.name}</div>
          <div className="truncate text-xs text-[#6b6862]">{actor.role === "ADMIN" ? "Administrador CRM" : "Asesor comercial"}</div>
        </div>
      </div>
      <button onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide hover:underline"><LogOut size={15} /> Cerrar sesión</button>
      {logoutError && <p role="alert" className="px-3 text-xs text-red-700">No se pudo cerrar sesión.</p>}
    </div>
  </>;

  return <div className="crm-app min-h-screen text-[#32302d]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#383632] bg-[#f3f0ea] lg:flex">{nav}</aside>
    {menuOpen && <div className="fixed inset-0 z-40 lg:hidden">
      <button aria-label="Cerrar menú" className="absolute inset-0 bg-[#32302d]/50" onClick={() => setMenuOpen(false)} />
      <aside className="relative flex h-full w-64 flex-col border-r border-[#383632] bg-[#f3f0ea]">{nav}</aside>
    </div>}
    <div className="lg:pl-64">
      <div className="flex min-h-8 items-center justify-between border-b border-[#383632] bg-[#f4ed52] px-5 text-[10px] font-semibold uppercase tracking-[0.13em] sm:px-8">
        <span>BLUA INVESTMENT / CRM</span><span className="hidden sm:inline">GESTIÓN COMERCIAL EN UN SOLO LUGAR ↗</span>
      </div>
      <header className="flex h-[72px] items-center justify-between border-b border-[#383632] bg-[#f3f0ea] px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} className="border border-[#383632] p-2 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div><div className="crm-kicker">PLATAFORMA COMERCIAL</div><div className="text-base font-medium">{pathname.startsWith("/admin") ? "Supervisión" : pathname.startsWith("/leads") ? "Prospectos" : "Panel principal"}</div></div>
        </div>
        <div className="hidden text-right sm:block"><div className="text-sm font-medium">{actor.name}</div><div className="text-xs text-[#6b6862]">{actor.email}</div></div>
      </header>
      <main className="mx-auto max-w-[1450px] px-5 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  </div>;
}
