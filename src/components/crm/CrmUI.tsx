import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CrmDashboard, CrmLead, CRM_STATUS_LABELS, formatCrmDate } from "@/lib/crm/api";

export function StatusBadge({ status }: { status: string }) {
  const color = status === "CONVERTED" ? "bg-emerald-50 text-emerald-700" :
    status === "LOST" || status === "DO_NOT_CONTACT" ? "bg-rose-50 text-rose-700" :
    status === "QUALIFIED" || status === "NEGOTIATION" ? "bg-violet-50 text-violet-700" :
    status === "PROPOSAL_SENT" ? "bg-amber-50 text-amber-700" :
    "bg-blue-50 text-blue-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
    {CRM_STATUS_LABELS[status] || status}
  </span>;
}

export function MetricCard({ label, value, detail, accent = "blue" }: {
  label: string; value: number | string; detail?: string; accent?: "blue" | "amber" | "emerald" | "violet";
}) {
  const colors = {
    blue: "border-l-[#4268e8]", amber: "border-l-amber-400",
    emerald: "border-l-emerald-500", violet: "border-l-violet-500",
  };
  return <div className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${colors[accent]}`}>
    <div className="text-sm text-slate-500">{label}</div>
    <div className="mt-3 text-3xl font-semibold tracking-tight text-[#132451]">{value}</div>
    {detail && <div className="mt-2 text-xs text-slate-400">{detail}</div>}
  </div>;
}

export function FunnelChart({ dashboard }: { dashboard: CrmDashboard }) {
  const stages = dashboard.funnel.filter(({ status }) => status !== "DO_NOT_CONTACT" && status !== "LOST");
  const max = Math.max(1, ...stages.map((stage) => stage.count));
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4"><div>
      <h2 className="text-lg font-semibold text-[#132451]">Progreso del funnel</h2>
      <p className="mt-1 text-sm text-slate-500">Distribución actual de prospectos por etapa</p>
    </div><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">En vivo</span></div>
    <div className="mt-7 space-y-4">
      {stages.map(({ status, count }) => <div key={status} className="grid grid-cols-[120px_minmax(0,1fr)_28px] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)_28px]">
        <div className="truncate text-xs font-medium text-slate-600 sm:text-sm">{CRM_STATUS_LABELS[status] || status}</div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#3c5ee3] to-[#8aa2ff]" style={{ width: `${(count / max) * 100}%` }} /></div>
        <div className="text-right text-sm font-semibold text-slate-700">{count}</div>
      </div>)}
    </div>
    <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">Perdidos: {dashboard.funnel.find((row) => row.status === "LOST")?.count || 0} · No contactar: {dashboard.funnel.find((row) => row.status === "DO_NOT_CONTACT")?.count || 0}</div>
  </div>;
}

export function LeadTable({ leads, showAdvisor = false, empty = "No hay prospectos para mostrar." }: {
  leads: CrmLead[]; showAdvisor?: boolean; empty?: string;
}) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left">
      <thead className="bg-[#f8faff] text-xs font-semibold uppercase tracking-wider text-slate-500"><tr>
        <th className="px-5 py-4">Prospecto</th><th className="px-5 py-4">Estado</th>
        {showAdvisor && <th className="px-5 py-4">Asesor</th>}
        <th className="px-5 py-4">Último contacto</th><th className="px-5 py-4">Seguimiento</th><th className="px-5 py-4" />
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {leads.map((lead) => <tr key={lead.uuid} className="hover:bg-blue-50/30">
          <td className="px-5 py-4"><div className="font-semibold text-[#132451]">{lead.fullName || lead.email || "Sin nombre"}</div><div className="mt-1 text-xs text-slate-500">{lead.email || `${lead.countryPrefix} ${lead.phone}` || "Sin contacto"}</div></td>
          <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
          {showAdvisor && <td className="px-5 py-4 text-sm text-slate-600">{lead.advisorEmail || "Sin asignar"}</td>}
          <td className="px-5 py-4 text-sm text-slate-600">{formatCrmDate(lead.lastContactedAt)}</td>
          <td className="px-5 py-4 text-sm text-slate-600">{formatCrmDate(lead.nextFollowupAt, true)}</td>
          <td className="px-5 py-4"><Link href={`/leads/${lead.uuid}`} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#365bd8] hover:underline">Ver ficha <ArrowUpRight size={15} /></Link></td>
        </tr>)}
        {!leads.length && <tr><td colSpan={showAdvisor ? 6 : 5} className="px-5 py-12 text-center text-sm text-slate-500">{empty}</td></tr>}
      </tbody>
    </table></div>
  </div>;
}
