"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, UserPlus } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import { CrmLead, createCrmLead, whatsappPitchUrl } from "@/lib/crm/api";

export default function NewCrmLeadPage() {
  const { actor } = useCrm();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryPrefix, setCountryPrefix] = useState("+51");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState<CrmLead | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone.trim() && !email.trim()) {
      setError("Ingresa al menos un teléfono o un correo.");
      return;
    }
    setSaving(true); setError("");
    try {
      const lead = await createCrmLead({ fullName: fullName.trim(), phone: phone.trim(), countryPrefix: countryPrefix.trim(), email: email.trim(), notes: notes.trim() });
      setCreated(lead);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear el prospecto.");
    } finally { setSaving(false); }
  }

  if (actor?.role !== "ADVISOR") return <div className="crm-panel p-8 text-sm text-slate-600">La creación manual está disponible para asesores CRM.</div>;
  const whatsapp = created ? whatsappPitchUrl(created, actor.name) : null;
  return <div className="max-w-3xl space-y-6">
    <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#111111]"><ArrowLeft size={16} /> Volver a prospectos</Link>
    <div><div className="crm-kicker">Prospectos / Nuevo</div><h1 className="mt-2 crm-title">Crear prospecto</h1><p className="mt-2 text-sm text-slate-500">Quedará asignado a tu cartera con origen Manual.</p></div>
    {created ? <section className="crm-panel bg-[#d1fae5] p-6" role="status">
      <h2 className="crm-section-title">Prospecto creado</h2>
      <p className="mt-2 text-sm text-slate-700">{created.fullName} ya está en tu cartera. Puedes abrir la conversación con un mensaje inicial preparado y registrar después la gestión realizada.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="crm-button crm-button-green inline-flex items-center gap-2"><MessageCircle size={17} /> Contactar por WhatsApp</a>}
        <Link href={`/leads/${created.uuid}`} className="crm-button crm-button-secondary inline-flex items-center gap-2">Ver ficha <ArrowRight size={16} /></Link>
      </div>
      {!whatsapp && <p className="mt-3 text-xs text-slate-600">Este prospecto no tiene teléfono; puedes contactarlo por correo desde su ficha.</p>}
    </section> : <form onSubmit={submit} className="crm-panel space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold">Nombre completo *<input required maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 font-normal" placeholder="Nombre del prospecto" /></label>
        <label className="text-sm font-semibold">Prefijo<select value={countryPrefix} onChange={(event) => setCountryPrefix(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 font-normal"><option value="+51">Perú (+51)</option><option value="+1">Estados Unidos (+1)</option><option value="+57">Colombia (+57)</option><option value="+56">Chile (+56)</option><option value="+52">México (+52)</option><option value="+34">España (+34)</option></select></label>
        <label className="text-sm font-semibold">Teléfono<input type="tel" inputMode="tel" maxLength={25} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 font-normal" placeholder="Sin el prefijo del país" /></label>
        <label className="sm:col-span-2 text-sm font-semibold">Correo<input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full crm-field px-3 font-normal" placeholder="cliente@ejemplo.com" /></label>
        <label className="sm:col-span-2 text-sm font-semibold">Notas iniciales<textarea rows={4} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 w-full crm-field p-3 font-normal" placeholder="Contexto de cómo conociste al prospecto" /></label>
      </div>
      <p className="text-xs text-slate-500">* Nombre y al menos un teléfono o correo. Antes de guardarlo, revisaremos si el contacto ya existe.</p>
      {error && <div role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-end border-t border-[#111111] pt-4"><button type="submit" disabled={saving} className="crm-button inline-flex items-center gap-2 disabled:opacity-50"><UserPlus size={17} /> {saving ? "Creando…" : "Crear prospecto"}</button></div>
    </form>}
  </div>;
}
