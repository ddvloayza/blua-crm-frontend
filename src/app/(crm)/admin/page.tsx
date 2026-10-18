"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { FunnelChart, MetricCard } from "@/components/crm/CrmUI";
import { CrmAdvisor, CrmDashboard, getCrmAdvisors, getCrmDashboard } from "@/lib/crm/api";

export default function CrmAdminPage() {
  const { actor } = useCrm();
  const [advisors, setAdvisors] = useState<CrmAdvisor[]>([]);
  const [selected, setSelected] = useState("");
  const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
  const [advisorError, setAdvisorError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [advisorsLoaded, setAdvisorsLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (actor?.role !== "ADMIN") return;
    let active = true;
    getCrmAdvisors()
      .then((rows) => { if (active) { setAdvisors(rows); setAdvisorsLoaded(true); setAdvisorError(""); } })
      .catch((reason) => { if (active) setAdvisorError(reason?.message || "No se pudo cargar a los asesores."); });
    return () => { active = false; };
  }, [actor?.role]);
  useEffect(() => {
    if (actor?.role !== "ADMIN") return;
    let active = true;
    getCrmDashboard(selected || undefined)
      .then((summary) => { if (active) { setDashboard(summary); setDashboardError(""); } })
      .catch((reason) => { if (active) setDashboardError(reason?.message || "No se pudo cargar el dashboard."); });
    return () => { active = false; };
  }, [actor?.role, selected]);

  async function exportProgress() {
    if (!dashboard || !advisorsLoaded) return;
    setExporting(true);
    setExportError("");
    try {
      const selectedAdvisor = advisors.find((item) => item.uuid === selected);
      const { downloadCrmProgressExcel } = await import("@/lib/crm/exportProgress");
      await downloadCrmProgressExcel({
        dashboard,
        advisors: selectedAdvisor ? [selectedAdvisor] : advisors,
        scope: selectedAdvisor ? selectedAdvisor.name || selectedAdvisor.email : "Todo el equipo",
        selectedAdvisor: Boolean(selectedAdvisor),
        exportedAt: new Date(),
      });
    } catch (reason) {
      setExportError(reason instanceof Error ? reason.message : "No se pudo generar el Excel.");
    } finally {
      setExporting(false);
    }
  }

  if (actor?.role !== "ADMIN") return <div className="crm-panel p-8 text-sm text-slate-600">Esta vista es solo para administradores del CRM.</div>;

  const name = selected ? advisors.find((item) => item.uuid === selected)?.name : null;
  const conversion = dashboard?.totalLeads ? Math.round((dashboard.convertedLeads / dashboard.totalLeads) * 100) : 0;

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div>
      <div className="crm-kicker">Supervisión</div>
      <h1 className="mt-2 crm-title">Avance comercial</h1>
      <p className="mt-2 text-sm text-slate-500">Sigue el trabajo de los asesores y la evolución del funnel.</p>
    </div><div className="flex flex-wrap items-end gap-3"><label className="text-sm font-medium text-slate-600">Asesor
      <select value={selected} onChange={(event) => { setDashboard(null); setSelected(event.target.value); }} className="mt-1 block h-11 min-w-56 crm-field px-4 text-sm outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]">
        <option value="">Todo el equipo</option>
        {advisors.map((advisor) => <option key={advisor.uuid} value={advisor.uuid}>{advisor.name || advisor.email}</option>)}
      </select>
    </label><button type="button" onClick={exportProgress} disabled={!dashboard || !advisorsLoaded || exporting} className="crm-button h-11 gap-2 disabled:cursor-not-allowed disabled:opacity-50"><Download size={17} />{exporting ? "Generando…" : "Exportar Excel"}</button></div></div>
    {(advisorError || dashboardError || exportError) && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{advisorError || dashboardError || exportError}</div>}
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
        <div className="crm-panel p-6">
          <div className="flex items-center gap-2"><TrendingUp size={20} className="text-[#4A63E7]" /><h2 className="crm-section-title">Rendimiento del equipo</h2></div>
          <p className="mt-1 text-sm text-slate-500">Cartera, contacto y conversiones por asesor</p>
          <div className="mt-5 divide-y divide-[#e5e7eb]">
            {advisors.map((advisor) => {
              const contactRate = advisor.activeLeads ? Math.round((advisor.contactedLeads / advisor.activeLeads) * 100) : 0;
              return <button key={advisor.uuid} onClick={() => { setDashboard(null); setSelected(advisor.uuid); }} aria-pressed={selected === advisor.uuid} className={`w-full px-2 py-4 text-left hover:bg-[#eef2ff] ${selected === advisor.uuid ? "bg-[#e2e8ff]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#111111] bg-[#34D399] text-sm font-semibold text-[#111111]">{advisor.name?.[0] || advisor.email[0]}</div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{advisor.name || advisor.email}</div><div className="text-xs text-slate-500">{advisor.interactionsCount} gestiones · {advisor.convertedLeads} convertidos</div></div>
                  <div className="text-right"><div className="text-sm font-semibold text-slate-800">{contactRate}%</div><div className="text-xs text-slate-500">{advisor.contactedLeads}/{advisor.activeLeads} contactados</div></div>
                </div>
                <div className="mt-3 h-2 overflow-hidden border border-[#111111] bg-white" role="progressbar" aria-label={`Contactados por ${advisor.name || advisor.email}`} aria-valuenow={contactRate} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[#4A63E7]" style={{ width: `${Math.min(contactRate, 100)}%` }} />
                </div>
              </button>;
            })}
            {!advisors.length && <div className="py-6 text-sm text-slate-500">Todavía no hay perfiles de asesores.</div>}
          </div>
        </div>
      </div>
    </> : !dashboardError && <div className="crm-panel p-8 text-sm text-slate-500">Cargando indicadores…</div>}
  </div>;
}
