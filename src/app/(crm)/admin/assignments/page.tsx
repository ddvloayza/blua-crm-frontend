"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCrm } from "@/context/CrmContext";
import { CrmAdvisor, CrmLead, assignCrmLead, getCrmAdvisors, getCrmLeads } from "@/lib/crm/api";
import { StatusBadge } from "@/components/crm/CrmUI";

export default function AssignmentsPage() {
  const { actor } = useCrm();
  const [advisors, setAdvisors] = useState<CrmAdvisor[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [unassigned, setUnassigned] = useState(true);
  const [search, setSearch] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => { if (actor?.role === "ADMIN") getCrmAdvisors().then(setAdvisors).catch((e) => setError(e.message)); }, [actor?.role]);
  useEffect(() => {
    if (actor?.role !== "ADMIN") return;
    let active = true;
    const timer = setTimeout(() => getCrmLeads({ unassigned, search: search || undefined, limit: 200 })
      .then((rows) => { if (active) { setLeads(rows); setError(""); } })
      .catch((e) => { if (active) setError(e.message); }), search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [actor?.role, unassigned, search, reload]);
  async function assign(lead: CrmLead) {
    const advisorId = choices[lead.uuid];
    if (!advisorId) { setError("Selecciona un asesor."); return; }
    setBusy(lead.uuid); setError(""); setNotice("");
    try { await assignCrmLead(lead.uuid, advisorId, reason[lead.uuid] || "Asignación manual CRM"); setNotice(`Se asignó ${lead.fullName || lead.email} correctamente.`); setReload((n) => n + 1); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo asignar."); }
    finally { setBusy(""); }
  }
  if (actor?.role !== "ADMIN") return <div className="crm-panel p-8">Solo administradores CRM.</div>;
  return <div className="space-y-6"><div><div className="crm-kicker">Cartera comercial</div><h1 className="mt-2 crm-title">Asignar prospectos</h1><p className="mt-2 text-sm text-slate-500">Consulta leads sin dueño y reasigna la cartera conservando el historial.</p></div>
    <div className="crm-panel flex flex-wrap gap-3 p-4"><button type="button" onClick={() => setUnassigned(true)} aria-pressed={unassigned} className={`crm-button ${unassigned ? "" : "crm-button-secondary"}`}>Sin asignar</button><button type="button" onClick={() => setUnassigned(false)} aria-pressed={!unassigned} className={`crm-button ${!unassigned ? "" : "crm-button-secondary"}`}>Todos</button><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, correo o teléfono" className="h-11 min-w-60 flex-1 crm-field px-3 text-sm" /></div>
    {error && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{error}</div>}{notice && <div role="status" className="border border-[#111111] bg-[#d1fae5] p-4 text-sm">{notice}</div>}
    <div className="space-y-3">{leads.map((lead) => <div key={lead.uuid} className="crm-panel p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={`/leads/${lead.uuid}`} className="font-semibold underline">{lead.fullName || lead.email || "Sin nombre"}</Link><div className="mt-1 text-xs text-slate-500">{lead.email} · Actual: {lead.advisorEmail || "Sin asignar"}</div></div><StatusBadge status={lead.status} /></div><div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-slate-600">Asesor<select value={choices[lead.uuid] || ""} onChange={(e) => setChoices((value) => ({ ...value, [lead.uuid]: e.target.value }))} className="mt-1 block h-10 min-w-52 crm-field px-3 text-sm"><option value="">Seleccionar</option>{advisors.filter((a) => a.status === "ACTIVE").map((a) => <option key={a.uuid} value={a.uuid}>{a.name || a.email} · {a.activeLeads}/{a.maxActiveLeads} leads</option>)}</select></label><label className="min-w-52 flex-1 text-xs font-semibold text-slate-600">Motivo<input value={reason[lead.uuid] || ""} onChange={(e) => setReason((value) => ({ ...value, [lead.uuid]: e.target.value }))} placeholder="Asignación manual CRM" className="mt-1 h-10 w-full crm-field px-3 text-sm" /></label><button type="button" disabled={busy === lead.uuid} onClick={() => assign(lead)} className="crm-button h-10 disabled:opacity-50">{busy === lead.uuid ? "Guardando…" : "Asignar"}</button></div></div>)}{!leads.length && <div className="crm-panel p-8 text-sm text-slate-500">No hay prospectos en esta vista.</div>}</div><p className="text-xs text-slate-500">Mostrando {leads.length} leads{leads.length === 200 ? "; usa la búsqueda para acotar" : ""}.</p>
  </div>;
}
