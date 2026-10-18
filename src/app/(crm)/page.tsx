"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Clock3, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useCrm } from "@/context/CrmContext";
import { FunnelChart, MetricCard, StatusBadge } from "@/components/crm/CrmUI";
import { CrmDashboard, CrmGoal, CrmWorkItem, CrmUpcomingAppointment, formatCrmDate, getCrmDashboard, getCrmGoals, getCrmWorklist } from "@/lib/crm/api";

const reasons = { OVERDUE: "Vencido", TODAY: "Para hoy", NEW: "Primer contacto" };

export default function CrmHomePage() {
  const { actor } = useCrm();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
  const [worklist, setWorklist] = useState<CrmWorkItem[]>([]);
  const [appointments, setAppointments] = useState<CrmUpcomingAppointment[]>([]);
  const [goal, setGoal] = useState<CrmGoal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { if (actor?.role === "ADMIN") router.replace("/admin"); }, [actor?.role, router]);
  useEffect(() => {
    if (actor?.role !== "ADVISOR") return;
    Promise.all([getCrmDashboard(), getCrmWorklist(), getCrmGoals()])
      .then(([summary, work, goals]) => { setDashboard(summary); setWorklist(work.items); setAppointments(work.appointments); setGoal(goals[0] || null); })
      .catch((reason) => setError(reason?.message || "No se pudo cargar el panel."));
  }, [actor?.role]);

  if (actor?.role === "ADMIN") return <div className="crm-panel p-8 text-sm text-slate-500">Abriendo dashboard de supervisión…</div>;
  const overdue = worklist.filter((item) => item.reason === "OVERDUE").length;
  const today = worklist.filter((item) => item.reason === "TODAY").length;
  const newLeads = worklist.filter((item) => item.reason === "NEW").length;
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="crm-kicker">Tu espacio comercial</div><h1 className="mt-2 crm-title">Mi día</h1><p className="mt-2 text-sm text-slate-500">Hola, {actor?.name?.split(" ")[0] || "equipo"}. Prioriza tus contactos y registra el siguiente paso.</p></div><Link href="/leads" className="inline-flex items-center gap-2 crm-button">Ver prospectos <ArrowRight size={17} /></Link></div>
    {error && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{error}</div>}
    {!dashboard && !error && <div className="crm-panel p-8 text-sm text-slate-500">Cargando indicadores…</div>}
    {dashboard && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Pendientes vencidos" value={overdue} accent="amber" /><MetricCard label="Para hoy" value={today} /><MetricCard label="Primer contacto" value={newLeads} accent="violet" /><MetricCard label="Convertidos" value={dashboard.convertedLeads} accent="emerald" /></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]"><section className="crm-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="crm-kicker">01 / PRIORIDAD</div><h2 className="mt-2 crm-section-title">Próximas acciones</h2></div><Clock3 size={20} className="text-[#4A63E7]" /></div><div className="mt-5 space-y-3">{worklist.map((item) => <Link key={item.lead.uuid} href={`/leads/${item.lead.uuid}`} className="block border border-[#111111] bg-[#f8f9fc] p-4 transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_#111111]"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.lead.fullName || item.lead.email || "Prospecto sin nombre"}</strong><span className="font-mono text-[10px] font-semibold uppercase text-[#023373]">{reasons[item.reason]}</span></div><p className="mt-2 text-sm text-slate-600">{item.nextAction}</p><div className="mt-2 flex items-center gap-3"><StatusBadge status={item.lead.status} />{item.dueAt && <span className="text-xs text-slate-500">{formatCrmDate(item.dueAt, true)}</span>}</div></Link>)}{!worklist.length && <p className="py-5 text-sm text-slate-500">No tienes leads nuevos ni seguimientos pendientes.</p>}</div></section><div className="space-y-6"><section className="crm-panel p-5 sm:p-6"><div className="flex items-center gap-2"><CalendarClock size={18} /><h2 className="crm-section-title">Próximas citas</h2></div><div className="mt-4 space-y-3">{appointments.map(({ lead, appointment }) => <Link key={appointment.uuid} href={`/leads/${lead.uuid}`} className="block border-b border-slate-200 pb-3 text-sm"><strong>{lead.fullName || lead.email}</strong><div className="mt-1 text-slate-600">{formatCrmDate(appointment.scheduledAt, true)}</div></Link>)}{!appointments.length && <p className="text-sm text-slate-500">Sin citas programadas en los próximos 14 días.</p>}</div></section><section className="crm-panel p-5 sm:p-6"><h2 className="crm-section-title">Meta del mes</h2>{goal ? <div className="mt-4 space-y-3 text-sm">{[["Contactos", goal.actualContacts, goal.targetContacts], ["Gestiones", goal.actualInteractions, goal.targetInteractions], ["Conversiones", goal.actualConversions, goal.targetConversions]].map(([label, actual, target]) => <div key={label}><div className="flex justify-between"><span>{label}</span><strong>{actual}/{target}</strong></div><div className="mt-1 h-2 border border-[#111111] bg-white"><div className="h-full bg-[#34D399]" style={{ width: `${Number(target) ? Math.min(100, Number(actual) / Number(target) * 100) : 0}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Aún no tienes una meta configurada.</p>}</section></div></div>
      <div className="grid gap-6 lg:grid-cols-2"><FunnelChart dashboard={dashboard} /><div className="crm-panel p-6"><h2 className="crm-section-title">Tu cartera</h2><p className="mt-3 text-sm text-slate-600">{dashboard.totalLeads} prospectos asignados · {dashboard.neverContacted} sin contactar.</p><Link href="/leads" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline"><Users size={16} /> Explorar todos los prospectos <ArrowRight size={15} /></Link></div></div>
    </>}
  </div>;
}
