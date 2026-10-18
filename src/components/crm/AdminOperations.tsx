"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Target, Users } from "lucide-react";
import { CrmAnalytics, CrmGoal, CRM_STATUS_LABELS, formatCrmDate, getCrmAnalytics, getCrmGoals, setCrmGoal } from "@/lib/crm/api";

function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-01`;
}

export function AdminOperations({ advisorId }: { advisorId: string }) {
  const [month, setMonth] = useState(currentMonth);
  const [fromDate, setFromDate] = useState(() => currentMonth());
  const [toDate, setToDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" }));
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null);
  const [goals, setGoals] = useState<CrmGoal[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    Promise.all([getCrmAnalytics({ fromDate, toDate, advisorId: advisorId || undefined }), getCrmGoals(month)])
      .then(([stats, rows]) => { if (active) { setAnalytics(stats); setGoals(rows); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "No se pudieron cargar las métricas."); });
    return () => { active = false; };
  }, [fromDate, toDate, advisorId, month, reload]);

  async function saveGoal(goal: CrmGoal) {
    setSaving(goal.advisorId); setError("");
    try {
      await setCrmGoal({ advisorId: goal.advisorId, month, targetContacts: goal.targetContacts, targetInteractions: goal.targetInteractions, targetConversions: goal.targetConversions });
      setReload((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la meta.");
    } finally { setSaving(null); }
  }

  function updateGoal(id: string, field: "targetContacts" | "targetInteractions" | "targetConversions", value: number) {
    setGoals((rows) => rows.map((row) => row.advisorId === id ? { ...row, [field]: Math.max(0, value || 0) } : row));
  }

  const maxWeek = Math.max(1, ...(analytics?.weeklyInteractions.map((row) => row.interactions) || []));
  return <div className="space-y-6">
    <section className="crm-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="crm-kicker">02 / PERÍODO</div><h2 className="mt-2 crm-section-title">Actividad y captación</h2><p className="mt-1 text-sm text-slate-500">Interacciones y conversiones ocurridas en las fechas elegidas.</p></div>
        <Link href="/admin/assignments" className="crm-button crm-button-secondary inline-flex items-center gap-2"><Users size={16} /> Gestionar cartera <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><label className="text-xs font-semibold text-slate-600">Desde<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 block h-10 crm-field px-3 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Hasta<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 block h-10 crm-field px-3 text-sm" /></label></div>
      {analytics && <>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[ ["Leads captados", analytics.newLeads], ["Gestiones del período", analytics.interactions], ["Conversiones del período", analytics.conversions], ["Primer contacto promedio", analytics.averageFirstContactHours === null ? "—" : `${analytics.averageFirstContactHours} h`] ].map(([label, value]) => <div key={label} className="border border-[#111111] bg-[#eef2ff] p-4"><div className="text-xs text-slate-600">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>)}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Gestiones por semana</h3><div className="mt-4 space-y-3">{analytics.weeklyInteractions.map((week) => <div key={week.weekStart} className="grid grid-cols-[85px_1fr_28px] items-center gap-3 text-xs"><span>{formatCrmDate(week.weekStart)}</span><div className="h-4 border border-[#111111] bg-white"><div className="h-full bg-[#4A63E7]" style={{ width: `${week.interactions / maxWeek * 100}%` }} /></div><strong className="text-right">{week.interactions}</strong></div>)}{!analytics.weeklyInteractions.length && <p className="text-sm text-slate-500">Sin gestiones en el período.</p>}</div></div>
          <div><h3 className="text-sm font-semibold">Conversión por origen de captación</h3><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#111111] text-xs text-slate-500"><th className="py-2">Origen</th><th>Leads</th><th>Convertidos</th><th>Tasa</th></tr></thead><tbody>{analytics.sources.map((source) => <tr key={source.source} className="border-b border-slate-200"><td className="py-2">{source.source}</td><td>{source.newLeads}</td><td>{source.convertedLeads}</td><td>{source.newLeads ? Math.round(source.convertedLeads / source.newLeads * 100) : 0}%</td></tr>)}</tbody></table>{!analytics.sources.length && <p className="py-4 text-sm text-slate-500">Sin leads captados en el período.</p>}</div></div>
        </div>
        <div className="mt-6 border-t border-[#111111] pt-5"><h3 className="text-sm font-semibold">Cambios de etapa registrados en el período</h3><div className="mt-3 flex flex-wrap gap-2">{analytics.stageChanges.map((stage) => <span key={stage.status} className="border border-[#111111] bg-[#d1fae5] px-3 py-2 text-xs">{CRM_STATUS_LABELS[stage.status] || stage.status}: <strong>{stage.count}</strong></span>)}{!analytics.stageChanges.length && <span className="text-sm text-slate-500">Sin cambios de etapa.</span>}</div></div>
        <p className="mt-5 text-xs text-slate-500">La tasa por origen cuenta solo leads captados y convertidos dentro del período. El historial anterior a esta versión no se puede reconstruir.</p>
      </>}
    </section>
    <section className="crm-panel p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="crm-kicker">03 / METAS</div><h2 className="mt-2 crm-section-title">Metas mensuales por asesor</h2><p className="mt-1 text-sm text-slate-500">Contactos = leads distintos con al menos una gestión. Conversiones = cambios registrados a convertido.</p></div><label className="text-xs font-semibold text-slate-600"><CalendarDays size={16} className="mb-1 inline" /> Mes<input type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} className="mt-1 block h-10 crm-field px-3 text-sm" /></label></div>
      <div className="mt-5 space-y-3">{goals.filter((row) => !advisorId || row.advisorId === advisorId).map((goal) => <div key={goal.advisorId} className="border border-[#111111] bg-[#f8f9fc] p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Target size={16} /> {goal.advisorEmail}</div><div className="grid gap-3 sm:grid-cols-3">{([ ["Contactos", "targetContacts", "actualContacts"], ["Gestiones", "targetInteractions", "actualInteractions"], ["Conversiones", "targetConversions", "actualConversions"] ] as const).map(([label, target, actual]) => <label key={target} className="text-xs font-medium text-slate-600">{label} · avance {goal[actual]}<input type="number" min="0" max="1000000" value={goal[target]} onChange={(e) => updateGoal(goal.advisorId, target, Number(e.target.value))} className="mt-1 h-10 w-full crm-field px-3 text-sm" /></label>)}</div><button type="button" disabled={saving === goal.advisorId} onClick={() => saveGoal(goal)} className="crm-button mt-4 disabled:opacity-50">{saving === goal.advisorId ? "Guardando…" : "Guardar meta"}</button></div>)}{!goals.length && <p className="text-sm text-slate-500">No hay asesores para mostrar.</p>}</div>
    </section>
    {error && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{error}</div>}
  </div>;
}
