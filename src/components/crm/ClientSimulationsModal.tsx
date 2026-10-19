"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Calculator } from "lucide-react";
import { CrmModal } from "@/components/crm/CrmModal";
import {
  CrmClientSimulation, formatCrmDate, getCrmClientSimulations,
} from "@/lib/crm/api";

function money(value: string | null, currency: string): string {
  if (value === null) return "No registrado";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(Number(value));
}

function calendarDate(value: string | null): string {
  if (!value) return "No registrada";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function ClientSimulationsModal({ leadId, leadName, onClose }: {
  leadId: string; leadName: string; onClose: () => void;
}) {
  const [simulations, setSimulations] = useState<CrmClientSimulation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCrmClientSimulations(leadId)
      .then((items) => {
        if (!active) return;
        setSimulations(items);
        setSelectedId(items[0]?.uuid ?? "");
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "No se pudieron cargar las simulaciones.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [leadId]);

  const selected = simulations.find((item) => item.uuid === selectedId);

  return <CrmModal title="Simulaciones del cliente" description={leadName} onClose={onClose} wide>
    {loading && <p role="status" className="py-6 text-sm text-slate-500">Cargando simulaciones…</p>}
    {error && <p role="alert" className="border border-red-700 bg-[#fee2e2] p-4 text-sm text-red-700">{error}</p>}
    {!loading && !error && !simulations.length && <p className="py-6 text-sm text-slate-500">Este prospecto no tiene simulaciones del cliente.</p>}
    {!loading && !error && !!simulations.length && <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
      <div>
        <div className="crm-kicker mb-3">{simulations.length} SIMULACIONES</div>
        <div className="max-h-[58dvh] space-y-2 overflow-y-auto pr-1">
          {simulations.map((item, index) => <button key={item.uuid} type="button" onClick={() => setSelectedId(item.uuid)}
            aria-pressed={selected?.uuid === item.uuid}
            className={`w-full border border-[#111111] p-3 text-left transition-colors ${selected?.uuid === item.uuid ? "bg-[#e2e8ff]" : "bg-white hover:bg-[#eef2ff]"}`}>
            <div className="flex items-start justify-between gap-2"><span className="font-mono text-[10px] font-bold text-[#4A63E7]">{String(index + 1).padStart(2, "0")} / {formatCrmDate(item.createdAt)}</span><ArrowUpRight size={15} aria-hidden="true" /></div>
            <div className="mt-2 text-lg font-semibold">{money(item.capitalAmount, item.currency)}</div>
            <div className="mt-1 text-xs text-slate-600">{item.fundPlanNameSnapshot || "Plan no registrado"} · {item.termMonths} meses</div>
          </button>)}
        </div>
      </div>
      {selected && <section aria-label="Detalle de la simulación" className="min-w-0">
        <div className="flex items-center gap-2"><Calculator size={19} /><h3 className="crm-section-title">Detalle de la simulación</h3></div>
        <p className="mt-2 text-xs text-slate-500">Creada el {formatCrmDate(selected.createdAt, true)} · Origen: {selected.source === "WEB" ? "Web" : selected.source === "APP" ? "App" : selected.source}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-[#111111] bg-[#e2e8ff] p-3"><div className="text-xs text-slate-600">Capital simulado</div><strong className="mt-1 block text-lg">{money(selected.capitalAmount, selected.currency)}</strong></div>
          <div className="border border-[#111111] bg-[#d1fae5] p-3"><div className="text-xs text-slate-600">Retorno total estimado</div><strong className="mt-1 block text-lg">{money(selected.estimatedTotalReturn, selected.currency)}</strong></div>
          <div className="border border-[#111111] p-3"><div className="text-xs text-slate-600">Plan y plazo</div><strong className="mt-1 block text-sm">{selected.fundPlanNameSnapshot || "Plan no registrado"} · {selected.termMonths} meses</strong></div>
          <div className="border border-[#111111] p-3"><div className="text-xs text-slate-600">Pago de intereses</div><strong className="mt-1 block text-sm">{selected.frequency === "MONTHLY" ? "Mensual" : "Trimestral"}</strong></div>
          <div className="border border-[#111111] p-3"><div className="text-xs text-slate-600">Inicio estimado</div><strong className="mt-1 block text-sm">{calendarDate(selected.startDate)}</strong></div>
          <div className="border border-[#111111] p-3"><div className="text-xs text-slate-600">Interés total estimado</div><strong className="mt-1 block text-sm">{money(selected.estimatedTotalInterest, selected.currency)}</strong></div>
        </div>
        {(selected.periodRatePercent !== null || selected.annualRatePercent !== null) && <p className="mt-4 text-sm text-slate-700">
          {selected.annualRatePercent !== null && <>TEA del plan al simular: <strong>{selected.annualRatePercent}%</strong></>}
          {selected.annualRatePercent !== null && selected.periodRatePercent !== null && " · "}
          {selected.periodRatePercent !== null && <>Tasa por pago: <strong>{selected.periodRatePercent}%</strong></>}
        </p>}
        {selected.schedule.length > 0 && <div className="mt-5">
          <h4 className="crm-section-title">Cuadro de pagos estimado</h4>
          <div className="mt-3 overflow-x-auto border border-[#111111]"><table className="w-full min-w-[510px] border-collapse text-xs">
            <thead className="bg-[#e2e8ff] text-left uppercase"><tr><th className="p-2">Pago</th><th className="p-2">Fecha</th><th className="p-2 text-right">Interés</th><th className="p-2 text-right">Capital</th><th className="p-2 text-right">Total</th></tr></thead>
            <tbody>{selected.schedule.map((row) => <tr key={row.number} className="border-t border-[#d1d5db]"><td className="p-2">{row.number}</td><td className="p-2">{calendarDate(row.dueDate)}</td><td className="p-2 text-right">{money(row.interest, selected.currency)}</td><td className="p-2 text-right">{money(row.principal, selected.currency)}</td><td className="p-2 text-right font-semibold">{money(row.total, selected.currency)}</td></tr>)}</tbody>
          </table></div>
          <p className="mt-2 text-xs text-slate-500">Distribución referencial del interés total guardado; los pagos definitivos dependen del contrato.</p>
        </div>}
      </section>}
    </div>}
  </CrmModal>;
}
