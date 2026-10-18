import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CrmDashboard, CrmLead, CRM_STATUS_LABELS, formatCrmDate } from "@/lib/crm/api";

export function StatusBadge({ status }: { status: string }) {
  const color = status === "CONVERTED" ? "bg-[#c8f3e8]" :
    status === "LOST" || status === "DO_NOT_CONTACT" ? "bg-[#f8d8d0]" :
    status === "QUALIFIED" || status === "NEGOTIATION" ? "bg-[#e6d8fa]" :
    status === "PROPOSAL_SENT" ? "bg-[#fce0be]" : "bg-[#dcebf9]";
  return <span className={`inline-flex border border-[#383632] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#32302d] ${color}`}>
    {CRM_STATUS_LABELS[status] || status}
  </span>;
}

export function MetricCard({ label, value, detail, accent = "blue" }: {
  label: string; value: number | string; detail?: string; accent?: "blue" | "amber" | "emerald" | "violet";
}) {
  const colors = { blue: "#d9ebfb", amber: "#fce0be", emerald: "#c8f3e8", violet: "#e6d8fa" };
  return <div className="crm-panel flex min-h-40 flex-col justify-between p-5" style={{ backgroundColor: colors[accent] }}>
    <div className="crm-kicker uppercase">{label}</div>
    <div className="mt-5 text-4xl font-normal tracking-tight text-[#32302d]">{value}</div>
    {detail && <div className="mt-2 border-t border-[#383632]/35 pt-2 text-xs text-[#615d57]">{detail}</div>}
  </div>;
}

export function FunnelChart({ dashboard }: { dashboard: CrmDashboard }) {
  const stages = dashboard.funnel.filter(({ status }) => status !== "DO_NOT_CONTACT" && status !== "LOST");
  const max = Math.max(1, ...stages.map((stage) => stage.count));
  return <div className="crm-panel p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4 border-b border-[#383632] pb-4"><div>
      <div className="crm-kicker">01 / FUNNEL</div>
      <h2 className="crm-section-title mt-2">Progreso comercial</h2>
      <p className="mt-1 text-sm text-[#615d57]">Distribución de prospectos por etapa</p>
    </div><span className="border border-[#383632] bg-[#f4ed52] px-2 py-1 font-mono text-[10px] font-bold uppercase">EN VIVO</span></div>
    <div className="mt-6 space-y-5">
      {stages.map(({ status, count }, index) => <div key={status} className="grid grid-cols-[110px_minmax(0,1fr)_28px] items-center gap-3 sm:grid-cols-[145px_minmax(0,1fr)_28px]">
        <div className="truncate text-xs font-medium text-[#55514c] sm:text-sm">{CRM_STATUS_LABELS[status] || status}</div>
        <div className="h-3 overflow-hidden border border-[#383632] bg-[#f3f0ea]"><div className={`h-full ${index % 3 === 0 ? "bg-[#acd3f7]" : index % 3 === 1 ? "bg-[#f4ed52]" : "bg-[#f2a35e]"}`} style={{ width: `${(count / max) * 100}%` }} /></div>
        <div className="text-right font-mono text-sm font-bold">{count}</div>
      </div>)}
    </div>
    <div className="mt-6 border-t border-[#383632] pt-4 font-mono text-[11px] text-[#615d57]">PERDIDOS {dashboard.funnel.find((row) => row.status === "LOST")?.count || 0} · NO CONTACTAR {dashboard.funnel.find((row) => row.status === "DO_NOT_CONTACT")?.count || 0}</div>
  </div>;
}

export function LeadTable({ leads, showAdvisor = false, empty = "No hay prospectos para mostrar." }: {
  leads: CrmLead[]; showAdvisor?: boolean; empty?: string;
}) {
  return <div className="crm-panel overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left">
      <thead className="bg-[#e7e2d9] font-mono text-[10px] font-semibold uppercase tracking-wider text-[#55514c]"><tr>
        <th className="border-b border-[#383632] px-5 py-4">Prospecto</th><th className="border-b border-[#383632] px-5 py-4">Estado</th>
        {showAdvisor && <th className="border-b border-[#383632] px-5 py-4">Asesor</th>}
        <th className="border-b border-[#383632] px-5 py-4">Último contacto</th><th className="border-b border-[#383632] px-5 py-4">Seguimiento</th><th className="border-b border-[#383632] px-5 py-4" />
      </tr></thead>
      <tbody className="divide-y divide-[#d2cdc4]">
        {leads.map((lead) => <tr key={lead.uuid} className="transition-colors hover:bg-[#edf6fd]">
          <td className="px-5 py-4"><div className="font-semibold text-[#32302d]">{lead.fullName || lead.email || "Sin nombre"}</div><div className="mt-1 text-xs text-[#615d57]">{lead.email || `${lead.countryPrefix} ${lead.phone}` || "Sin contacto"}</div></td>
          <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
          {showAdvisor && <td className="px-5 py-4 text-sm text-[#55514c]">{lead.advisorEmail || "Sin asignar"}</td>}
          <td className="px-5 py-4 text-sm text-[#55514c]">{formatCrmDate(lead.lastContactedAt)}</td>
          <td className="px-5 py-4 text-sm text-[#55514c]">{formatCrmDate(lead.nextFollowupAt, true)}</td>
          <td className="px-5 py-4"><Link href={`/leads/${lead.uuid}`} className="crm-link inline-flex items-center gap-1 whitespace-nowrap">VER FICHA <ArrowUpRight size={15} /></Link></td>
        </tr>)}
        {!leads.length && <tr><td colSpan={showAdvisor ? 6 : 5} className="px-5 py-12 text-center text-sm text-[#615d57]">{empty}</td></tr>}
      </tbody>
    </table></div>
  </div>;
}
