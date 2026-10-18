"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { FunnelChart, LeadTable, MetricCard } from "@/components/crm/CrmUI";
import { CrmAdvisor, CrmDashboard, CrmLead, getCrmAdvisors, getCrmDashboard, getCrmLeads } from "@/lib/crm/api";

export default function CrmAdminPage() {
  const { actor } = useCrm();
  const [advisors, setAdvisors] = useState<CrmAdvisor[]>([]);
  const [selected, setSelected] = useState("");
  const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (actor?.role !== "ADMIN") return;
    getCrmAdvisors().then(setAdvisors).catch((reason) => setError(reason?.message || "No se pudo cargar a los asesores."));
  }, [actor]);
  useEffect(() => {
    if (actor?.role !== "ADMIN") return;
    Promise.all([getCrmDashboard(selected || undefined), getCrmLeads({ advisorId: selected || undefined, limit: 100 })])
      .then(([summary, rows]) => { setDashboard(summary); setLeads(rows.slice(0, 6)); setError(""); })
      .catch((reason) => setError(reason?.message || "No se pudo cargar el dashboard."));
  }, [actor, selected]);

  if (actor?.role !== "ADMIN") return <div className="rounded-2xl bg-white p-8 text-sm text-slate-600">Esta vista es solo para administradores del CRM.</div>;

  const name = selected ? advisors.find((item) => item.uuid === selected)?.name : null;
  const conversion = dashboard?.totalLeads ? Math.round((dashboard.convertedLeads / dashboard.totalLeads) * 100) : 0;

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4364dd]">Supervisión</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#132451]">Avance comercial</h1>
      <p className="mt-2 text-sm text-slate-500">Sigue el trabajo de los asesores y la evolución del funnel.</p>
    </div><label className="text-sm font-medium text-slate-600">Asesor
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-1 block h-11 min-w-56 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#4268e8]">
        <option value="">Todo el equipo</option>
        {advisors.map((advisor) => <option key={advisor.uuid} value={advisor.uuid}>{advisor.name || advisor.email}</option>)}
      </select>
    </label></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {dashboard ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Prospectos" value={dashboard.totalLeads} detail={name || "Todo el equipo"} />
        <MetricCard label="Sin contactar" value={dashboard.neverContacted} accent="violet" />
        <MetricCard label="Seguimientos vencidos" value={dashboard.dueFollowups} accent="amber" />
        <MetricCard label="Gestiones registradas" value={dashboard.interactionsCount} />
        <MetricCard label="Conversión" value={`${conversion}%`} detail={`${dashboard.convertedLeads} convertidos`} accent="emerald" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FunnelChart dashboard={dashboard} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><TrendingUp size={20} className="text-[#4268e8]" /><h2 className="text-lg font-semibold text-[#132451]">Rendimiento del equipo</h2></div>
          <p className="mt-1 text-sm text-slate-500">Cartera activa, contacto e inversión por asesor</p>
          <div className="mt-5 divide-y divide-slate-100">
            {advisors.map((advisor) => <button key={advisor.uuid} onClick={() => setSelected(advisor.uuid)} className={`flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50 ${selected === advisor.uuid ? "bg-blue-50" : ""}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-[#3458d8]">{advisor.name?.[0] || advisor.email[0]}</div>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{advisor.name || advisor.email}</div><div className="text-xs text-slate-500">{advisor.interactionsCount} gestiones</div></div>
              <div className="text-right"><div className="text-sm font-semibold text-slate-800">{advisor.contactedLeads}/{advisor.activeLeads}</div><div className="text-xs text-slate-500">contactados</div></div>
              <div className="w-14 text-right"><div className="text-sm font-semibold text-emerald-700">{advisor.convertedLeads}</div><div className="text-xs text-slate-500">convertidos</div></div>
            </button>)}
            {!advisors.length && <div className="py-6 text-sm text-slate-500">Todavía no hay perfiles de asesores.</div>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#132451]">Prospectos recientes</h2><p className="mt-1 text-sm text-slate-500">{name ? `Cartera de ${name}` : "Vista del equipo"}</p></div>
        <Link href={selected ? `/leads?advisor=${selected}` : "/leads"} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3458d8] hover:underline">Ver todos <ArrowRight size={15} /></Link></div>
      <LeadTable leads={leads} showAdvisor={!selected} />
    </> : !error && <div className="rounded-2xl bg-white p-8 text-sm text-slate-500">Cargando indicadores…</div>}
  </div>;
}
