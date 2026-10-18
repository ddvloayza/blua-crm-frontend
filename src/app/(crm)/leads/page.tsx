"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { LeadTable } from "@/components/crm/CrmUI";
import { CrmLead, CRM_STATUS_LABELS, getCrmLeads } from "@/lib/crm/api";

function CrmLeadList() {
  const { actor } = useCrm();
  const params = useSearchParams();
  const advisorId = params.get("advisor") || undefined;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actor) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      getCrmLeads({ search: search.trim() || undefined, status: status || undefined, advisorId, limit: 200 })
        .then((rows) => { if (active) { setLeads(rows); setError(""); } })
        .catch((reason) => { if (active) setError(reason?.message || "No se pudieron cargar los prospectos."); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [actor, search, status, advisorId]);

  return <div className="space-y-6">
    <div><div className="crm-kicker">Prospectos</div>
      <h1 className="mt-2 crm-title">{advisorId ? "Prospectos del asesor" : actor?.role === "ADMIN" ? "Todos los prospectos" : "Mis prospectos"}</h1>
      <p className="mt-2 text-sm text-slate-500">Abre una ficha para ver sus datos de contacto y registrar la gestión realizada.</p>
    </div>
    <div className="flex flex-col gap-3 crm-panel p-4 sm:flex-row">
      <label className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o teléfono" className="h-11 w-full crm-field pl-11 pr-4 text-sm outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]" />
      </label>
      <select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 crm-field px-4 text-sm text-slate-700 outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc] sm:w-56">
        <option value="">Todos los estados</option>
        {Object.entries(CRM_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    {error && <div className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="crm-panel p-8 text-sm text-slate-500">Cargando prospectos…</div> : <LeadTable leads={leads} showAdvisor={actor?.role === "ADMIN"} />}
    {!loading && <p className="text-xs text-slate-400">Mostrando {leads.length} prospectos{leads.length === 200 ? " (límite de la vista; usa los filtros para acotar)" : ""}.</p>}
  </div>;
}

export default function CrmLeadsPage() {
  return <Suspense fallback={<div className="text-sm text-slate-500">Cargando prospectos…</div>}><CrmLeadList /></Suspense>;
}
