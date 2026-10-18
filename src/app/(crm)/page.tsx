"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useCrm } from "@/context/CrmContext";
import { FunnelChart, LeadTable, MetricCard } from "@/components/crm/CrmUI";
import { CrmDashboard, CrmLead, getCrmDashboard, getCrmLeads } from "@/lib/crm/api";

export default function CrmHomePage() {
  const { actor } = useCrm();
  const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actor) return;
    Promise.all([getCrmDashboard(), getCrmLeads({ limit: 100 })])
      .then(([summary, rows]) => { setDashboard(summary); setLeads(rows); })
      .catch((reason) => setError(reason?.message || "No se pudo cargar el panel."));
  }, [actor]);

  const due = leads.filter((lead) => lead.nextFollowupAt && new Date(lead.nextFollowupAt) <= new Date() && !["LOST", "CONVERTED", "DO_NOT_CONTACT"].includes(lead.status));
  const priority = [...due, ...leads.filter((lead) => !due.some((item) => item.uuid === lead.uuid) && ["NEW", "ASSIGNED"].includes(lead.status))].slice(0, 6);

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4364dd]">Tu espacio comercial</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#132451]">Hola, {actor?.name?.split(" ")[0] || "equipo"}</h1>
        <p className="mt-2 text-sm text-slate-500">{actor?.role === "ADMIN" ? "Vista general de la gestión comercial." : "Organiza tus prospectos y registra cada gestión."}</p>
      </div>
      <Link href="/leads" className="inline-flex items-center gap-2 rounded-xl bg-[#3458d8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#274ac4]">Ver prospectos <ArrowRight size={17} /></Link>
    </div>

    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {!dashboard && !error && <div className="rounded-2xl bg-white p-8 text-sm text-slate-500">Cargando indicadores…</div>}
    {dashboard && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Prospectos" value={dashboard.totalLeads} detail="En todas las etapas" />
        <MetricCard label="Por contactar" value={dashboard.neverContacted} detail="Sin gestión registrada" accent="violet" />
        <MetricCard label="Seguimientos vencidos" value={dashboard.dueFollowups} detail="Requieren atención" accent="amber" />
        <MetricCard label="Convertidos" value={dashboard.convertedLeads} detail="Marcados como convertidos" accent="emerald" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <div><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#132451]">Atención prioritaria</h2><p className="mt-1 text-sm text-slate-500">Seguimientos vencidos y prospectos nuevos</p></div><Clock3 size={19} className="text-amber-500" /></div>
          <LeadTable leads={priority} showAdvisor={actor?.role === "ADMIN"} empty="No tienes gestiones pendientes en este momento." />
        </div>
        <FunnelChart dashboard={dashboard} />
      </div>
      <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3458d8] hover:underline"><Users size={16} /> Explorar todos los prospectos <ArrowRight size={15} /></Link>
    </>}
  </div>;
}
