"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Calculator, Printer } from "lucide-react";
import { useCrm } from "@/context/CrmContext";
import {
  createCrmSimulation, CrmSimulation, CrmSimulationPlan,
  formatCrmDate, getCrmSimulationWorkspace,
} from "@/lib/crm/api";

function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function money(amount: string, currency: string): string {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(Number(amount));
}

function calendarDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function CrmLeadSimulationsPage() {
  const { actor } = useCrm();
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<{ uuid: string; fullName: string; email: string; status: string } | null>(null);
  const [plans, setPlans] = useState<CrmSimulationPlan[]>([]);
  const [simulations, setSimulations] = useState<CrmSimulation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [frequency, setFrequency] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");
  const [fundId, setFundId] = useState("");
  const [termMonths, setTermMonths] = useState(0);
  const [capital, setCapital] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [startDate, setStartDate] = useState(localToday);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actor || !id) return;
    let alive = true;
    getCrmSimulationWorkspace(id)
      .then((workspace) => {
        if (!alive) return;
        setLead(workspace.lead);
        setPlans(workspace.plans);
        setSimulations(workspace.simulations);
        setSelectedId(workspace.simulations[0]?.uuid ?? "");
        if (workspace.plans.length) {
          const first = workspace.plans[0];
          setCurrency(first.currency);
          setFrequency(first.frequency);
          setFundId(first.fundId);
          setTermMonths(first.termMonths);
        }
      })
      .catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : "No se pudieron cargar las simulaciones."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [actor, id]);

  const funds = [...new Map(plans.map((item) => [item.fundId, item.fundName])).entries()];
  const selectedFundId = funds.some(([value]) => value === fundId) ? fundId : funds[0]?.[0] ?? "";
  const fundPlans = plans.filter((item) => item.fundId === selectedFundId);
  const currencies = [...new Set(fundPlans.map((item) => item.currency))];
  const selectedCurrency = currencies.includes(currency) ? currency : currencies[0] ?? "";
  const availableFrequencies = [...new Set(fundPlans.filter((item) => item.currency === selectedCurrency).map((item) => item.frequency))];
  const selectedFrequency = availableFrequencies.includes(frequency) ? frequency : availableFrequencies[0];
  const availableTerms = [...new Set(fundPlans.filter((item) => item.currency === selectedCurrency && item.frequency === selectedFrequency).map((item) => item.termMonths))].sort((a, b) => a - b);
  const selectedTermMonths = availableTerms.includes(termMonths) ? termMonths : availableTerms[0] ?? 0;
  const matchingPlans = fundPlans.filter((item) => item.currency === selectedCurrency && item.frequency === selectedFrequency && item.termMonths === selectedTermMonths);
  const amount = Number(capital);
  const plan = capital && Number.isFinite(amount) && amount > 0
    ? matchingPlans.find((item) => Number(item.minAmount) <= amount && (item.maxAmount === null || amount <= Number(item.maxAmount)))
    : undefined;
  const selected = simulations.find((item) => item.uuid === selectedId) ?? simulations[0];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead || !selectedFundId || !selectedCurrency || !selectedFrequency || !selectedTermMonths) return;
    if (!plan) {
      setError("No hay un plan activo para ese monto, plazo, moneda y frecuencia.");
      return;
    }
    setSaving(true); setError("");
    try {
      const result = await createCrmSimulation({
        leadId: lead.uuid, fundId: selectedFundId, currency: selectedCurrency,
        frequency: selectedFrequency, termMonths: selectedTermMonths,
        capitalAmount: capital, couponCode: couponCode.trim(), startDate,
      });
      setSimulations((current) => [result, ...current]);
      setSelectedId(result.uuid);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear la simulación.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="crm-panel p-8 text-sm text-slate-500">Cargando simulador…</div>;
  if (!lead) return <div className="crm-panel p-8 text-sm"><p>{error || "No tienes acceso a este prospecto."}</p><Link className="crm-link mt-4 inline-block" href="/leads">Volver a prospectos</Link></div>;

  return <div className="space-y-6">
    <div className="crm-print-hide">
      <Link href={`/leads/${lead.uuid}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black"><ArrowLeft size={16} /> Volver a la ficha</Link>
      <div className="crm-kicker mt-6">PROSPECTOS / SIMULACIONES</div>
      <h1 className="crm-title mt-2">Simulador comercial</h1>
      <p className="mt-2 text-sm text-slate-600">{lead.fullName || lead.email} · Crea una proyección y revisa sus pagos con el cliente.</p>
    </div>

    {actor?.role === "ADVISOR" && lead.status !== "DO_NOT_CONTACT" && <form onSubmit={submit} className="crm-panel crm-print-hide space-y-5 p-5 sm:p-6">
      <div className="flex items-center gap-2"><Calculator size={19} /><h2 className="crm-section-title">Nueva simulación</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Fondo
          <select value={selectedFundId} onChange={(event) => setFundId(event.target.value)} disabled={!funds.length} className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal disabled:opacity-50">
            {funds.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Moneda
          <select value={selectedCurrency} onChange={(event) => setCurrency(event.target.value)} disabled={!currencies.length} className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal disabled:opacity-50">
            {currencies.map((item) => <option key={item} value={item}>{item === "PEN" ? "Soles (PEN)" : item === "USD" ? "Dólares (USD)" : item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Pago de intereses
          <select value={selectedFrequency ?? ""} onChange={(event) => setFrequency(event.target.value as "MONTHLY" | "QUARTERLY")} disabled={!availableFrequencies.length} className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal disabled:opacity-50">
            {availableFrequencies.map((item) => <option key={item} value={item}>{item === "MONTHLY" ? "Mensual" : "Trimestral"}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Plazo
          <select value={selectedTermMonths || ""} onChange={(event) => setTermMonths(Number(event.target.value))} disabled={!availableTerms.length} className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal disabled:opacity-50">
            {availableTerms.map((months) => <option key={months} value={months}>{months} meses</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Capital a invertir
          <input required type="number" min="0.01" step="0.01" value={capital} onChange={(event) => setCapital(event.target.value)} placeholder="Ingresa el monto para elegir el plan" className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-slate-600">Fecha estimada de inicio
          <input required type="date" min={localToday()} value={startDate} onChange={(event) => setStartDate(event.target.value)} className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-slate-600">Cupón (opcional)
          <input type="text" maxLength={40} value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Código del cupón" className="crm-field mt-1.5 h-11 w-full px-3 text-sm font-normal uppercase" />
        </label>
      </div>
      {plan ? <div role="status" className="border border-[#111111] bg-[#e2e8ff] p-3 text-sm"><span className="font-semibold">Plan elegido automáticamente: {plan.name}</span><span className="mt-1 block text-xs text-slate-600">{plan.termMonths} meses · {plan.frequency === "MONTHLY" ? "intereses mensuales" : "intereses trimestrales"} · TEA {plan.annualRatePercent}% · tasa por pago {plan.periodRatePercent}% · rango {money(plan.minAmount, plan.currency)}{plan.maxAmount ? ` a ${money(plan.maxAmount, plan.currency)}` : " en adelante"}</span></div>
        : capital && matchingPlans.length ? <p role="status" className="border border-amber-700 bg-[#fef3c7] p-3 text-sm text-amber-900">No hay un plan activo para ese capital. Ajusta el monto, plazo o frecuencia.</p>
        : <p className="text-xs text-slate-500">El plan se elige automáticamente según el capital, plazo, moneda y frecuencia de pago.</p>}
      {couponCode && <p className="text-xs text-slate-500">El cupón se validará al crear la simulación. Su aplicación definitiva se confirma al formalizar la inversión.</p>}
      {!plans.length && <p className="text-sm text-amber-800">No hay planes de inversión activos para simular. Configúralos en Django.</p>}
      {error && <p role="alert" className="border border-red-700 bg-[#fee2e2] p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={saving || !plan || !startDate} className="crm-button inline-flex items-center gap-2 disabled:opacity-50"><Calculator size={16} />{saving ? "Calculando…" : "Crear simulación"}</button>
    </form>}

    <div className="crm-print-hide flex flex-wrap items-end justify-between gap-4">
      <div><div className="crm-kicker">HISTORIAL</div><h2 className="crm-section-title mt-1">Simulaciones del asesor</h2></div>
      {selected && <button type="button" onClick={() => window.print()} className="crm-button crm-button-secondary inline-flex items-center gap-2"><Printer size={16} /> Imprimir o guardar PDF</button>}
    </div>
    {!!simulations.length && <div className="crm-print-hide flex flex-wrap gap-2">
      {simulations.map((item) => <button key={item.uuid} type="button" onClick={() => setSelectedId(item.uuid)} aria-pressed={selected?.uuid === item.uuid} className={`border border-[#111111] px-3 py-2 text-left text-xs ${selected?.uuid === item.uuid ? "bg-[#e2e8ff] font-semibold" : "bg-white hover:bg-[#f1f5f9]"}`}>
        {formatCrmDate(item.createdAt)} · {money(item.capitalAmount, item.currency)} · {item.frequency === "MONTHLY" ? "Mensual" : "Trimestral"}
      </button>)}
    </div>}

    {selected ? <section className="crm-panel crm-simulation-print p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#111111] pb-5">
        <div><div className="crm-kicker">BLUA / PROYECCIÓN DE INVERSIÓN</div><h2 className="mt-2 text-2xl font-semibold uppercase tracking-tight">{lead.fullName || lead.email}</h2><p className="mt-1 text-sm text-slate-600">{selected.fundPlanNameSnapshot} · {selected.termMonths} meses · {selected.frequency === "MONTHLY" ? "Pagos mensuales" : "Pagos trimestrales"}</p><p className="mt-1 text-sm font-semibold text-slate-700">TEA del plan {selected.annualRatePercent}%{selected.appliedAnnualRatePercent !== selected.annualRatePercent && ` · TEA con cupón ${selected.appliedAnnualRatePercent}%`} · Tasa estimada por pago {selected.periodRatePercent}%</p>{selected.couponCodeSnapshot && <p className="mt-2 text-sm text-[#023373]">Cupón {selected.couponCodeSnapshot}: {selected.couponBenefitTypeSnapshot === "EXTRA_ANNUAL_RATE" ? `+${(Number(selected.couponBenefitValueSnapshot) * 100).toFixed(2)} puntos porcentuales de TEA` : selected.couponBenefitTypeSnapshot === "EXTRA_PERIOD_RATE" ? `+${(Number(selected.couponBenefitValueSnapshot) * 100).toFixed(2)} puntos porcentuales por pago` : selected.couponBenefitTypeSnapshot === "FEE_DISCOUNT" ? `${(Number(selected.couponBenefitValueSnapshot) * 100).toFixed(2)}% de descuento de comisión` : `bono de ${money(selected.couponBenefitValueSnapshot || "0", selected.currency)}`}</p>}</div>
        <div className="text-left text-xs text-slate-500 sm:text-right">Simulación del {formatCrmDate(selected.createdAt)}{selected.createdByEmail && <div>Preparada por {selected.createdByEmail}</div>}</div>
      </div>
      <div className={`mt-5 grid gap-3 ${Number(selected.estimatedBonus) > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div className="border border-[#111111] bg-[#e2e8ff] p-4"><div className="text-xs uppercase text-slate-600">Capital</div><strong className="mt-2 block text-xl">{money(selected.capitalAmount, selected.currency)}</strong></div>
        <div className="border border-[#111111] bg-[#d1fae5] p-4"><div className="text-xs uppercase text-slate-600">Interés bruto estimado</div><strong className="mt-2 block text-xl">{money(selected.estimatedTotalInterest, selected.currency)}</strong></div>
        {Number(selected.estimatedBonus) > 0 && <div className="border border-[#111111] bg-[#fef3c7] p-4"><div className="text-xs uppercase text-slate-600">Bono del cupón</div><strong className="mt-2 block text-xl">{money(selected.estimatedBonus, selected.currency)}</strong></div>}
        <div className="border border-[#111111] bg-white p-4"><div className="text-xs uppercase text-slate-600">Total estimado</div><strong className="mt-2 block text-xl">{money(selected.estimatedTotalReturn, selected.currency)}</strong></div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-2"><h3 className="crm-section-title">Cuadro de pagos</h3><p className="text-xs text-slate-500">Inicio estimado: {selected.startDate ? calendarDate(selected.startDate) : "No registrado"}</p></div>
      <div className="mt-3 overflow-x-auto border border-[#111111]"><table className="w-full min-w-[650px] border-collapse text-sm"><thead className="bg-[#e2e8ff] text-left text-xs uppercase"><tr><th className="p-3">Periodo</th><th className="p-3">Fecha estimada</th><th className="p-3 text-right">Interés bruto</th><th className="p-3 text-right">Capital</th><th className="p-3 text-right">Bono</th><th className="p-3 text-right">Pago total</th></tr></thead><tbody>
        {selected.schedule.map((row) => <tr key={row.number} className="border-t border-[#d1d5db]"><td className="p-3">{row.number}</td><td className="p-3">{calendarDate(row.dueDate)}</td><td className="p-3 text-right">{money(row.interest, selected.currency)}</td><td className="p-3 text-right">{money(row.principal, selected.currency)}</td><td className="p-3 text-right">{money(row.bonus, selected.currency)}</td><td className="p-3 text-right font-semibold">{money(row.total, selected.currency)}</td></tr>)}
      </tbody><tfoot className="border-t border-[#111111] bg-[#f8f9fc] font-semibold"><tr><td colSpan={2} className="p-3">Total</td><td className="p-3 text-right">{money(selected.estimatedTotalInterest, selected.currency)}</td><td className="p-3 text-right">{money(selected.capitalAmount, selected.currency)}</td><td className="p-3 text-right">{money(selected.estimatedBonus, selected.currency)}</td><td className="p-3 text-right">{money(selected.estimatedTotalReturn, selected.currency)}</td></tr></tfoot></table></div>
      <p className="mt-4 text-xs leading-relaxed text-slate-600">Proyección comercial referencial basada en la TEA del plan al crear la simulación. La TEA se convierte a tasa efectiva mensual o trimestral; los intereses cobrados no se reinvierten. Los importes son brutos y no incluyen retenciones, comisiones ni ajustes por días no hábiles. Las fechas y pagos definitivos dependen del contrato y de la inversión formalizada. {selected.couponBenefitTypeSnapshot === "FEE_DISCOUNT" && "El descuento de comisión no se refleja en el total porque esta proyección no calcula comisiones."}</p>
    </section> : <div className="crm-panel p-8 text-sm text-slate-500">Este prospecto aún no tiene simulaciones.</div>}
  </div>;
}
