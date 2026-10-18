"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, CalendarPlus, CheckCircle2, FilePlus2, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { CrmModal } from "@/components/crm/CrmModal";
import { StatusBadge } from "@/components/crm/CrmUI";
import {
  CrmLead, CRM_OUTCOME_LABELS, CRM_STATUS_LABELS, formatCrmDate,
  getCrmLead, recordCrmInteraction, whatsappUrl, uploadCrmAttachment,
  crmAttachmentUrl, createCrmAppointment, updateCrmAppointment,
  createCrmProposal, updateCrmProposal,
} from "@/lib/crm/api";

const channels = [
  ["WHATSAPP", "WhatsApp"], ["CALL", "Llamada"], ["EMAIL", "Correo"],
  ["MEETING", "Reunión"], ["MESSAGE", "Mensaje"], ["OTHER", "Otro"],
];

type LeadModal = "interaction" | "appointment" | "proposal" | null;

export default function CrmLeadDetailPage() {
  const { actor } = useCrm();
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [outcome, setOutcome] = useState("INTERESTED");
  const [summary, setSummary] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [details, setDetails] = useState("");
  const [transcript, setTranscript] = useState("");
  const [interactionFile, setInteractionFile] = useState<File | null>(null);
  const [followup, setFollowup] = useState("");
  const [status, setStatus] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalCurrency, setProposalCurrency] = useState("PEN");
  const [proposalTerm, setProposalTerm] = useState("");
  const [proposalUntil, setProposalUntil] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [activityError, setActivityError] = useState("");
  const [activityBusy, setActivityBusy] = useState(false);
  const [activeModal, setActiveModal] = useState<LeadModal>(null);
  const [notice, setNotice] = useState("");
  const [noticeWarning, setNoticeWarning] = useState(false);

  function openModal(modal: Exclude<LeadModal, null>) {
    setSaveError(""); setActivityError(""); setNotice(""); setNoticeWarning(false);
    setActiveModal(modal);
  }

  useEffect(() => {
    if (!actor || !params.id) return;
    setLoading(true);
    getCrmLead(params.id)
      .then(setLead)
      .catch((reason) => setLoadError(reason?.message || "No se pudo cargar el prospecto."))
      .finally(() => setLoading(false));
  }, [actor, params.id]);

  function setFollowupWeeksFromNow(weeks: number) {
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    const pad = (value: number) => String(value).padStart(2, "0");
    setFollowup(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!lead) return;
    setSaving(true); setSaveError(""); setNotice("");
    try {
      const recorded = await recordCrmInteraction({
        leadId: lead.uuid,
        interactionType: channel,
        outcome,
        summary: summary.trim(),
        nextAction: nextAction.trim(),
        details: details.trim(),
        transcriptText: transcript.trim(),
        nextFollowupAt: followup ? new Date(followup).toISOString() : null,
        status: status || null,
      });
      let uploadWarning = "";
      if (interactionFile) {
        try {
          await uploadCrmAttachment(interactionFile, { interactionId: recorded.interactionId });
        } catch (uploadError: unknown) {
          uploadWarning = `La gestión se guardó, pero el archivo no se pudo subir: ${uploadError instanceof Error ? uploadError.message : "error desconocido"}`;
        }
      }
      try { setLead(await getCrmLead(lead.uuid)); }
      catch { uploadWarning = [uploadWarning, "Actualiza la ficha para ver la gestión nueva."].filter(Boolean).join(" "); }
      setSummary(""); setNextAction(""); setDetails(""); setTranscript(""); setInteractionFile(null); setFollowup(""); setStatus("");
      setNotice(uploadWarning || "Gestión guardada correctamente.");
      setNoticeWarning(Boolean(uploadWarning));
      setActiveModal(null);
    } catch (reason: unknown) {
      setSaveError(reason instanceof Error ? reason.message : "No se pudo guardar la gestión.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAppointment(event: React.FormEvent) {
    event.preventDefault();
    if (!lead || !appointmentAt) return;
    setActivityBusy(true); setActivityError("");
    try {
      await createCrmAppointment({ leadId: lead.uuid, scheduledAt: new Date(appointmentAt).toISOString(), notes: appointmentNotes.trim() });
      let refreshWarning = "";
      try { setLead(await getCrmLead(lead.uuid)); }
      catch { refreshWarning = "La cita se guardó. Actualiza la ficha para verla."; }
      setAppointmentAt(""); setAppointmentNotes("");
      setNotice(refreshWarning || "Cita programada correctamente."); setNoticeWarning(Boolean(refreshWarning)); setActiveModal(null);
    } catch (error: unknown) {
      setActivityError(error instanceof Error ? error.message : "No se pudo guardar la cita.");
    } finally { setActivityBusy(false); }
  }

  async function saveProposal(event: React.FormEvent) {
    event.preventDefault();
    if (!lead) return;
    setActivityBusy(true); setActivityError("");
    try {
      const proposalId = await createCrmProposal({
        leadId: lead.uuid, amount: proposalAmount, currency: proposalCurrency,
        termMonths: proposalTerm ? Number(proposalTerm) : null,
        validUntil: proposalUntil || null, notes: proposalNotes.trim(),
      });
      let uploadWarning = "";
      if (proposalFile) {
        try { await uploadCrmAttachment(proposalFile, { proposalId }); }
        catch (uploadError: unknown) { uploadWarning = `Propuesta guardada; el PDF no se pudo subir: ${uploadError instanceof Error ? uploadError.message : "error desconocido"}`; }
      }
      try { setLead(await getCrmLead(lead.uuid)); }
      catch { uploadWarning = [uploadWarning, "Actualiza la ficha para ver la propuesta nueva."].filter(Boolean).join(" "); }
      setProposalAmount(""); setProposalTerm(""); setProposalUntil(""); setProposalNotes(""); setProposalFile(null);
      setNotice(uploadWarning || "Propuesta guardada correctamente."); setNoticeWarning(Boolean(uploadWarning)); setActiveModal(null);
    } catch (error: unknown) {
      setActivityError(error instanceof Error ? error.message : "No se pudo guardar la propuesta.");
    } finally { setActivityBusy(false); }
  }

  async function changeActivity(kind: "appointment" | "proposal", id: string, status: string) {
    if (!lead) return;
    setActivityBusy(true); setActivityError("");
    try {
      if (kind === "appointment") await updateCrmAppointment(id, status);
      else await updateCrmProposal(id, status);
      setLead(await getCrmLead(lead.uuid));
    } catch (error: unknown) {
      setActivityError(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
    } finally { setActivityBusy(false); }
  }

  if (loading) return <div className="crm-panel p-8 text-sm text-slate-500">Cargando ficha del prospecto…</div>;
  if (loadError || !lead) return <div className="crm-panel p-8"><p className="text-sm text-slate-600">{loadError || "No tienes acceso a este prospecto o ya no existe."}</p><Link href="/leads" className="mt-4 inline-block text-sm font-semibold text-[#111111]">Volver a prospectos</Link></div>;

  const whatsapp = lead.status !== "DO_NOT_CONTACT" ? whatsappUrl(lead) : null;
  const latest = lead.latestSimulation;
  const amount = latest ? new Intl.NumberFormat("es-PE", { style: "currency", currency: latest.currency }).format(Number(latest.capitalAmount)) : "—";

  return <div className="space-y-7">
    <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#111111]"><ArrowLeft size={16} /> Volver a prospectos</Link>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><div className="crm-kicker">Ficha del prospecto</div>
        <h1 className="mt-2 crm-title">{lead.fullName || lead.email || "Prospecto sin nombre"}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3"><StatusBadge status={lead.status} /><span className="text-sm text-slate-500">Ingresó el {formatCrmDate(lead.createdAt)}</span></div>
      </div>
      {actor?.role === "ADVISOR" && lead.status !== "DO_NOT_CONTACT" && <div className="flex flex-wrap gap-2">
        <button type="button" aria-haspopup="dialog" onClick={() => openModal("interaction")} className="inline-flex items-center gap-2 crm-button"><Send size={16} /> Registrar gestión</button>
        <button type="button" aria-haspopup="dialog" onClick={() => openModal("appointment")} className="inline-flex items-center gap-2 crm-button crm-button-secondary"><CalendarPlus size={16} /> Programar cita</button>
        <button type="button" aria-haspopup="dialog" onClick={() => openModal("proposal")} className="inline-flex items-center gap-2 crm-button crm-button-secondary"><FilePlus2 size={16} /> Crear propuesta</button>
      </div>}
    </div>
    {notice && <div role="status" className={`flex items-start gap-2 border border-[#111111] p-4 text-sm ${noticeWarning ? "bg-[#fef3c7] text-amber-900" : "bg-[#d1fae5] text-emerald-800"}`}><CheckCircle2 size={18} className="shrink-0" />{notice}</div>}
    {activityError && !activeModal && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{activityError}</div>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
      <div className="space-y-6">
        <section className="crm-panel p-6">
          <h2 className="crm-section-title">Datos de contacto</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#111111] bg-[#eef2ff] p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Phone size={15} /> Teléfono</div><div className="mt-2 text-sm font-semibold text-slate-800">{lead.phone ? `${lead.countryPrefix} ${lead.phone}` : "No registrado"}</div></div>
            <div className="border border-[#111111] bg-[#eef2ff] p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Mail size={15} /> Correo</div><div className="mt-2 break-all text-sm font-semibold text-slate-800">{lead.email || "No registrado"}</div></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 crm-button crm-button-green"><MessageCircle size={17} /> Abrir WhatsApp</a>}
            {lead.email && lead.status !== "DO_NOT_CONTACT" && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 crm-button crm-button-secondary"><Mail size={17} /> Enviar correo</a>}
            {lead.phone && lead.status !== "DO_NOT_CONTACT" && <a href={`tel:${lead.countryPrefix}${lead.phone}`} className="inline-flex items-center gap-2 crm-button crm-button-secondary"><Phone size={17} /> Llamar</a>}
          </div>
          {lead.status === "DO_NOT_CONTACT" && <p className="mt-4 text-sm font-medium text-rose-700">Este prospecto está marcado como «No contactar».</p>}
        </section>

        <section className="crm-panel p-6">
          <h2 className="crm-section-title">Contexto comercial</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><div className="text-xs text-slate-500">Origen</div><div className="mt-1 text-sm font-semibold text-slate-800">{lead.source || "—"}</div></div>
            <div><div className="text-xs text-slate-500">Campaña</div><div className="mt-1 text-sm font-semibold text-slate-800">{lead.campaign || "—"}</div></div>
            <div><div className="text-xs text-slate-500">Asesor responsable</div><div className="mt-1 text-sm font-semibold text-slate-800">{lead.advisorEmail || "Sin asignar"}</div></div>
            <div><div className="text-xs text-slate-500">Simulaciones</div><div className="mt-1 text-sm font-semibold text-slate-800">{lead.simulationsCount}</div></div>
          </div>
          {latest && <div className="mt-5 border border-[#111111] bg-[#e2e8ff] p-4"><div className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Última simulación</div><div className="mt-2 crm-section-title">{amount}</div><div className="mt-1 text-sm text-slate-600">{latest.fundPlanNameSnapshot || "Plan de inversión"} · {latest.termMonths} meses</div><div className="mt-1 text-xs text-slate-500">{formatCrmDate(latest.createdAt)}</div></div>}
          {lead.notes && <div className="mt-5 border-t border-[#e5e7eb] pt-4"><div className="text-xs text-slate-500">Notas del prospecto</div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p></div>}
        </section>

        <section className="crm-panel p-6">
          <h2 className="crm-section-title">Historial de gestiones</h2>
          <div className="mt-5 space-y-4">
            {lead.interactions?.map((item) => <div key={item.uuid} className="relative border-l-2 border-[#111111] pl-5"><div className="absolute -left-[6px] top-1 h-2.5 w-2.5 rounded-full bg-[#34D399]" />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><div className="text-sm font-semibold text-slate-800">{item.summary}</div><span className="text-xs text-slate-400">{formatCrmDate(item.occurredAt, true)}</span></div>
              <div className="mt-1 text-xs text-slate-500">{item.interactionType} · {CRM_OUTCOME_LABELS[item.outcome] || item.outcome} · {item.advisorEmail}</div>
              {item.details && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.details}</p>}
              {item.transcriptText && <details className="mt-2 border border-[#d1d5db] bg-[#f8f9fc] p-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Transcripción importada</summary><p className="mt-2 whitespace-pre-wrap">{item.transcriptText}</p></details>}
              {item.attachments?.map((file) => <a key={file.uuid} href={crmAttachmentUrl(file.uuid)} className="mt-2 block text-xs font-semibold text-[#111111]">Descargar {file.filename}</a>)}
              {item.nextAction && <div className="mt-2 text-xs font-semibold text-[#023373]">Siguiente acción: {item.nextAction}</div>}
              {item.nextFollowupAt && <div className="mt-2 flex items-center gap-1 text-xs text-[#111111]"><CalendarClock size={14} /> Seguimiento: {formatCrmDate(item.nextFollowupAt, true)}</div>}
            </div>)}
            {!lead.interactions?.length && <p className="text-sm text-slate-500">Aún no hay gestiones registradas.</p>}
          </div>
        </section>

        <section className="crm-panel p-6"><h2 className="crm-section-title">Historial del funnel</h2><div className="mt-4 space-y-3">{lead.statusHistory?.map((event, index) => <div key={`${event.changedAt}-${index}`} className="border-l-2 border-[#4A63E7] pl-4 text-sm"><div className="font-semibold">{CRM_STATUS_LABELS[event.status] || event.status}</div><div className="text-xs text-slate-500">{event.isBaseline ? "Estado al iniciar el historial" : `Desde ${CRM_STATUS_LABELS[event.previousStatus] || event.previousStatus}`} · {formatCrmDate(event.changedAt, true)}{event.advisorEmail ? ` · ${event.advisorEmail}` : ""}</div></div>)}{!lead.statusHistory?.length && <p className="text-sm text-slate-500">Sin cambios registrados.</p>}</div></section>

        <section className="crm-panel p-6">
          <h2 className="crm-section-title">Citas</h2>
          <div className="mt-4 space-y-3">{lead.appointments?.map((item) => <div key={item.uuid} className="border border-[#d1d5db] p-4">
            <div className="text-sm font-semibold text-slate-800">{formatCrmDate(item.scheduledAt, true)} · {item.status === "SCHEDULED" ? "Programada" : item.status === "COMPLETED" ? "Realizada" : "Cancelada"}</div>
            {item.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p>}
            <div className="mt-2 text-xs text-slate-400">{item.advisorEmail}</div>
            {actor?.role === "ADVISOR" && item.status === "SCHEDULED" && <div className="mt-3 flex gap-3 text-xs font-semibold text-[#111111]"><button disabled={activityBusy} onClick={() => changeActivity("appointment", item.uuid, "COMPLETED")}>Marcar realizada</button><button disabled={activityBusy} onClick={() => changeActivity("appointment", item.uuid, "CANCELLED")}>Cancelar</button></div>}
          </div>)}{!lead.appointments?.length && <p className="text-sm text-slate-500">Aún no hay citas.</p>}</div>
        </section>

        <section className="crm-panel p-6">
          <h2 className="crm-section-title">Propuestas</h2>
          <div className="mt-4 space-y-3">{lead.proposals?.map((item) => <div key={item.uuid} className="border border-[#d1d5db] p-4">
            <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-800">{new Intl.NumberFormat("es-PE", { style: "currency", currency: item.currency }).format(Number(item.amount))}</strong><span className="text-xs font-semibold text-[#111111]">{({ DRAFT: "Borrador", SENT: "Enviada", ACCEPTED: "Aceptada", REJECTED: "Rechazada" } as Record<string, string>)[item.status] || item.status}</span></div>
            <p className="mt-1 text-xs text-slate-500">{item.termMonths ? `${item.termMonths} meses` : "Sin plazo"} · Vigencia: {item.validUntil ? formatCrmDate(item.validUntil) : "Sin fecha"}</p>
            {item.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p>}
            {item.attachments?.map((file) => <a key={file.uuid} href={crmAttachmentUrl(file.uuid)} className="mt-2 block text-xs font-semibold text-[#111111]">Descargar {file.filename}</a>)}
            {actor?.role === "ADVISOR" && (item.status === "DRAFT" || item.status === "SENT") && <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#111111]">
              {item.status === "DRAFT" && <button disabled={activityBusy} onClick={() => changeActivity("proposal", item.uuid, "SENT")}>Marcar enviada</button>}
              {item.status === "SENT" && <><button disabled={activityBusy} onClick={() => changeActivity("proposal", item.uuid, "ACCEPTED")}>Aceptada</button><button disabled={activityBusy} onClick={() => changeActivity("proposal", item.uuid, "REJECTED")}>Rechazada</button></>}
            </div>}
          </div>)}{!lead.proposals?.length && <p className="text-sm text-slate-500">Aún no hay propuestas.</p>}</div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="crm-panel p-6"><h2 className="crm-section-title">Próximo paso</h2>
          <div className="mt-4 flex items-center gap-3 border border-[#111111] bg-[#fef3c7] p-4"><CalendarClock size={21} className="text-amber-600" /><div><div className="text-xs font-medium text-amber-700">Seguimiento programado</div><div className="mt-1 text-sm font-semibold text-slate-800">{formatCrmDate(lead.nextFollowupAt, true)}</div></div></div>
          <p className="mt-4 text-xs text-slate-500">Último contacto registrado: {formatCrmDate(lead.lastContactedAt, true)}</p>
        </section>

        {actor?.role === "ADMIN" && <div className="border border-[#111111] bg-[#e2e8ff] p-5 text-sm text-[#111111]">Vista de supervisión. El asesor asignado registra las gestiones de este prospecto.</div>}
      </div>
    </div>
    {actor?.role === "ADVISOR" && lead.status !== "DO_NOT_CONTACT" && activeModal === "interaction" && <CrmModal title="Registrar gestión" description="Completa el resultado después de contactar al prospecto." busy={saving} onClose={() => setActiveModal(null)}>
      <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">Canal<select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]">{channels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-600">Resultado<select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]">{Object.entries(CRM_OUTCOME_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Resumen breve<input required maxLength={220} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ej. Solicitó información del plan en soles" className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]" /><span className="mt-1 block text-right text-[11px] font-normal text-slate-400">{summary.length}/220</span></label>
            <label className="block text-xs font-semibold text-slate-600">Siguiente acción<input required maxLength={220} value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Ej. Enviar propuesta y llamar el viernes" className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal" /></label>
            <label className="block text-xs font-semibold text-slate-600">Detalles y acuerdos<textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Puntos relevantes, objeciones y siguiente acción" className="mt-1.5 w-full resize-y crm-field p-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]" /></label>
            <label className="block text-xs font-semibold text-slate-600">Transcripción de WhatsApp (opcional)<textarea rows={5} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Pega aquí la conversación exportada o un fragmento relevante" className="mt-1.5 w-full resize-y crm-field p-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]" /></label>
            <label className="block text-xs font-semibold text-slate-600">Captura o archivo de conversación (opcional)<input type="file" accept="image/png,image/jpeg,application/pdf,text/plain" onChange={(event) => setInteractionFile(event.target.files?.[0] || null)} className="mt-1.5 block w-full text-xs font-normal" /><span className="mt-1 block font-normal text-slate-400">PNG, JPG, PDF o TXT · máximo 5 MB.</span></label>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Próximo seguimiento<input type="datetime-local" value={followup} onChange={(event) => setFollowup(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]" /></label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-slate-600">ACCESOS RÁPIDOS</span>
                <button type="button" onClick={() => setFollowupWeeksFromNow(1)} className="crm-button crm-button-secondary crm-quick-action" aria-label="Programar seguimiento dentro de una semana">1 semana</button>
                <button type="button" onClick={() => setFollowupWeeksFromNow(2)} className="crm-button crm-button-secondary crm-quick-action" aria-label="Programar seguimiento dentro de dos semanas">2 semanas</button>
              </div>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Cambiar etapa del funnel<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#a5b4fc]"><option value="">Mantener etapa actual</option>{Object.entries(CRM_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {saveError && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-700">{saveError}</div>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#d1d5db] pt-4"><button type="button" disabled={saving} onClick={() => setActiveModal(null)} className="crm-button crm-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 crm-button"><Send size={16} /> {saving ? "Guardando…" : "Guardar gestión"}</button></div>
          </form>
    </CrmModal>}
    {actor?.role === "ADVISOR" && lead.status !== "DO_NOT_CONTACT" && activeModal === "appointment" && <CrmModal title="Programar cita" description="Agenda el próximo encuentro con el prospecto." busy={activityBusy} onClose={() => setActiveModal(null)}>
      <form onSubmit={saveAppointment} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-600">Fecha y hora<input required type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal" /></label>
              <label className="block text-xs font-semibold text-slate-600">Notas<textarea rows={3} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} className="mt-1.5 w-full crm-field p-3 text-sm font-normal" /></label>
              {activityError && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-700">{activityError}</div>}
              <div className="flex flex-wrap justify-end gap-3 border-t border-[#d1d5db] pt-4"><button type="button" disabled={activityBusy} onClick={() => setActiveModal(null)} className="crm-button crm-button-secondary">Cancelar</button><button type="submit" disabled={activityBusy} className="inline-flex items-center gap-2 crm-button"><CalendarPlus size={16} /> {activityBusy ? "Guardando…" : "Guardar cita"}</button></div>
            </form>
    </CrmModal>}
    {actor?.role === "ADVISOR" && lead.status !== "DO_NOT_CONTACT" && activeModal === "proposal" && <CrmModal title="Crear propuesta" description="Registra el borrador y adjunta el PDF si ya está listo." busy={activityBusy} onClose={() => setActiveModal(null)}>
      <form onSubmit={saveProposal} className="space-y-4">
              <div className="grid grid-cols-[1fr_100px] gap-3"><label className="text-xs font-semibold text-slate-600">Monto<input required type="number" min="0.01" step="0.01" value={proposalAmount} onChange={(event) => setProposalAmount(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">Moneda<select value={proposalCurrency} onChange={(event) => setProposalCurrency(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal"><option>PEN</option><option>USD</option></select></label></div>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Plazo (meses)<input type="number" min="1" max="600" value={proposalTerm} onChange={(event) => setProposalTerm(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">Vigencia<input type="date" value={proposalUntil} onChange={(event) => setProposalUntil(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 text-sm font-normal" /></label></div>
              <label className="block text-xs font-semibold text-slate-600">Notas<textarea rows={3} value={proposalNotes} onChange={(event) => setProposalNotes(event.target.value)} className="mt-1.5 w-full crm-field p-3 text-sm font-normal" /></label>
              <label className="block text-xs font-semibold text-slate-600">PDF de la propuesta<input type="file" accept="application/pdf" onChange={(event) => setProposalFile(event.target.files?.[0] || null)} className="mt-1.5 block w-full text-xs font-normal" /><span className="mt-1 block font-normal text-slate-400">Máximo 5 MB.</span></label>
              {activityError && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-700">{activityError}</div>}
              <div className="flex flex-wrap justify-end gap-3 border-t border-[#d1d5db] pt-4"><button type="button" disabled={activityBusy} onClick={() => setActiveModal(null)} className="crm-button crm-button-secondary">Cancelar</button><button type="submit" disabled={activityBusy} className="inline-flex items-center gap-2 crm-button"><FilePlus2 size={16} /> {activityBusy ? "Guardando…" : "Guardar borrador"}</button></div>
            </form>
    </CrmModal>}
  </div>;
}
