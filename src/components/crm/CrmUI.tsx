import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { CrmDashboard, CrmLead, CRM_STATUS_LABELS, formatCrmDate, whatsappPitchUrl } from "@/lib/crm/api";

export function StatusBadge({ status }: { status: string }) {
  const color = status === "CONVERTED" ? "bg-[#d1fae5]" :
    status === "LOST" || status === "DO_NOT_CONTACT" ? "bg-[#fee2e2]" :
    status === "QUALIFIED" || status === "NEGOTIATION" ? "bg-[#e2e8ff]" :
    status === "PROPOSAL_SENT" ? "bg-[#fef3c7]" : "bg-[#e2e8ff]";
  return <span className={`inline-flex border border-[#111111] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#111111] ${color}`}>
    {CRM_STATUS_LABELS[status] || status}
  </span>;
}

export function MetricCard({ label, value, detail, accent = "blue" }: {
  label: string; value: number | string; detail?: string; accent?: "blue" | "amber" | "emerald" | "violet";
}) {
  const colors = { blue: "#e2e8ff", amber: "#fef3c7", emerald: "#d1fae5", violet: "#edf2ff" };
  return <div className="crm-panel flex min-h-40 flex-col justify-between p-5" style={{ backgroundColor: colors[accent] }}>
    <div className="crm-kicker uppercase">{label}</div>
    <div className="mt-5 text-4xl font-normal tracking-tight text-[#111111]">{value}</div>
    {detail && <div className="mt-2 border-t border-[#111111]/35 pt-2 text-xs text-[#4b5563]">{detail}</div>}
  </div>;
}

export function FunnelChart({ dashboard }: { dashboard: CrmDashboard }) {
  const stages = dashboard.funnel.filter(({ status }) => status !== "DO_NOT_CONTACT" && status !== "LOST");
  const max = Math.max(1, ...stages.map((stage) => stage.count));
  return <div className="crm-panel p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4 border-b border-[#111111] pb-4"><div>
      <div className="crm-kicker">01 / FUNNEL</div>
      <h2 className="crm-section-title mt-2">Progreso comercial</h2>
      <p className="mt-1 text-sm text-[#4b5563]">Distribución de prospectos por etapa</p>
    </div><span className="border border-[#111111] bg-[#34D399] px-2 py-1 font-mono text-[10px] font-bold uppercase">EN VIVO</span></div>
    <div className="mt-6 space-y-5">
      {stages.map(({ status, count }, index) => <div key={status} className="grid grid-cols-[110px_minmax(0,1fr)_28px] items-center gap-3 sm:grid-cols-[145px_minmax(0,1fr)_28px]">
        <div className="truncate text-xs font-medium text-[#4b5563] sm:text-sm">{CRM_STATUS_LABELS[status] || status}</div>
        <div className="h-3 overflow-hidden border border-[#111111] bg-[#f8f9fc]"><div className={`h-full ${index % 3 === 0 ? "bg-[#4A63E7]" : index % 3 === 1 ? "bg-[#34D399]" : "bg-[#023373]"}`} style={{ width: `${(count / max) * 100}%` }} /></div>
        <div className="text-right font-mono text-sm font-bold">{count}</div>
      </div>)}
    </div>
    <div className="mt-6 border-t border-[#111111] pt-4 font-mono text-[11px] text-[#4b5563]">PERDIDOS {dashboard.funnel.find((row) => row.status === "LOST")?.count || 0} · NO CONTACTAR {dashboard.funnel.find((row) => row.status === "DO_NOT_CONTACT")?.count || 0}</div>
  </div>;
}

export function LeadTable({ leads, showAdvisor = false, showWhatsApp = false, advisorName, empty = "No hay prospectos para mostrar." }: {
  leads: CrmLead[]; showAdvisor?: boolean; showWhatsApp?: boolean; advisorName?: string; empty?: string;
}) {
  return <div className="crm-panel overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left">
      <thead className="bg-[#eef0f4] font-mono text-[10px] font-semibold uppercase tracking-wider text-[#4b5563]"><tr>
        <th className="border-b border-[#111111] px-5 py-4">Prospecto</th><th className="border-b border-[#111111] px-5 py-4">Estado</th>
        {showAdvisor && <th className="border-b border-[#111111] px-5 py-4">Asesor</th>}
        <th className="border-b border-[#111111] px-5 py-4">Último contacto</th><th className="border-b border-[#111111] px-5 py-4">Seguimiento</th><th className="border-b border-[#111111] px-5 py-4" />
      </tr></thead>
      <tbody className="divide-y divide-[#e5e7eb]">
        {leads.map((lead) => {
          const whatsapp = showWhatsApp && lead.status !== "DO_NOT_CONTACT" ? whatsappPitchUrl(lead, advisorName) : null;
          return <tr key={lead.uuid} className="transition-colors hover:bg-[#eef2ff]">
          <td className="px-5 py-4"><div className="font-semibold text-[#111111]">{lead.fullName || lead.email || "Sin nombre"}</div><div className="mt-1 text-xs text-[#4b5563]">{lead.email || `${lead.countryPrefix} ${lead.phone}` || "Sin contacto"}</div></td>
          <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
          {showAdvisor && <td className="px-5 py-4 text-sm text-[#4b5563]">{lead.advisorEmail || "Sin asignar"}</td>}
          <td className="px-5 py-4 text-sm text-[#4b5563]">{formatCrmDate(lead.lastContactedAt)}</td>
          <td className="px-5 py-4 text-sm text-[#4b5563]">{formatCrmDate(lead.nextFollowupAt, true)}</td>
          <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-3">
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`Contactar por WhatsApp a ${lead.fullName || lead.email || "este prospecto"}`} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#111111] hover:underline"><MessageCircle size={16} /> WhatsApp</a>}
            {showWhatsApp && lead.status !== "DO_NOT_CONTACT" && !whatsapp && <span className="whitespace-nowrap text-xs text-slate-500" title="Registra un teléfono con prefijo internacional para contactar por WhatsApp">Sin teléfono válido</span>}
            <Link href={`/leads/${lead.uuid}`} className="crm-link inline-flex items-center gap-1 whitespace-nowrap">VER FICHA <ArrowUpRight size={15} /></Link>
          </div></td>
        </tr>;
        })}
        {!leads.length && <tr><td colSpan={showAdvisor ? 6 : 5} className="px-5 py-12 text-center text-sm text-[#4b5563]">{empty}</td></tr>}
      </tbody>
    </table></div>
  </div>;
}
