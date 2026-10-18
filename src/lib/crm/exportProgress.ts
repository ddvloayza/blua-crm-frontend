import ExcelJS from "exceljs";
import { CrmAdvisor, CrmDashboard, CRM_STATUS_LABELS } from "@/lib/crm/api";

type ExportInput = {
  dashboard: CrmDashboard;
  advisors: CrmAdvisor[];
  scope: string;
  selectedAdvisor?: boolean;
  exportedAt?: Date;
};

const BLUE = "4A63E7";
const DARK = "111111";
const MINT = "34D399";
const PALE = "EEF2FF";

function formatLimaDate(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function fileDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function prepareSheet(sheet: ExcelJS.Worksheet, title: string, widths: number[], headers: string[]) {
  sheet.columns = widths.map((width) => ({ width }));
  sheet.mergeCells(1, 1, 1, widths.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { name: "Arial", size: 17, bold: true, color: { argb: `FF${DARK}` } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${MINT}` } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 35;
  const header = sheet.getRow(5);
  header.values = headers;
  header.height = 29;
  header.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BLUE}` } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: `FF${DARK}` } } };
  });
  sheet.views = [{ state: "frozen", ySplit: 5 }];
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: headers.length } };
}

function styleRows(sheet: ExcelJS.Worksheet, firstRow = 6) {
  for (let number = firstRow; number <= sheet.rowCount; number += 1) {
    const row = sheet.getRow(number);
    row.height = 25;
    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, color: { argb: `FF${DARK}` } };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (number % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${PALE}` } };
      }
      cell.border = { bottom: { style: "hair", color: { argb: "FFD1D5DB" } } };
    });
  }
}

export async function buildCrmProgressWorkbook({ dashboard, advisors, scope, exportedAt = new Date() }: ExportInput): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Blua CRM";
  workbook.created = exportedAt;
  workbook.modified = exportedAt;

  const summary = workbook.addWorksheet("Resumen");
  prepareSheet(summary, "BLUA | PROGRESO COMERCIAL", [34, 22, 68], ["Indicador", "Valor", "Definición"]);
  summary.getCell("A2").value = "Alcance";
  summary.getCell("B2").value = scope;
  summary.getCell("A3").value = "Fecha de corte (Lima)";
  summary.getCell("B3").value = formatLimaDate(exportedAt);
  summary.getCell("A2").font = summary.getCell("A3").font = { bold: true, color: { argb: `FF${DARK}` } };
  const conversionRate = dashboard.totalLeads ? dashboard.convertedLeads / dashboard.totalLeads : 0;
  const metrics: Array<[string, number, string]> = [
    ["Prospectos", dashboard.totalLeads, "Prospectos de la cartera seleccionada, incluidos los no asignados cuando se ve todo el equipo."],
    ["Sin contactar", dashboard.neverContacted, "Sin fecha de último contacto y no cerrados."],
    ["Seguimientos vencidos", dashboard.dueFollowups, "Próximo seguimiento anterior a la fecha de corte y no cerrados."],
    ["Gestiones en cartera", dashboard.interactionsCount, "Interacciones de los prospectos de la cartera seleccionada."],
    ["Convertidos", dashboard.convertedLeads, "Prospectos cuyo estado actual es Convertido."],
    ["Tasa de conversión", conversionRate, "Convertidos / prospectos de la cartera seleccionada."],
  ];
  for (const metric of metrics) summary.addRow(metric);
  styleRows(summary);
  summary.getCell("B11").numFmt = "0.0%";
  summary.mergeCells("A14:C15");
  const note = summary.getCell("A14");
  note.value = "Las gestiones del resumen se cuentan por la cartera actual; en Asesores se atribuyen al autor de cada gestión. Por eso los totales pueden diferir.";
  note.alignment = { vertical: "middle", wrapText: true };
  note.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF4B5563" } };
  summary.getRow(14).height = 26;
  summary.getRow(15).height = 26;

  const team = workbook.addWorksheet("Asesores");
  prepareSheet(team, "BLUA | AVANCE POR ASESOR", [28, 34, 15, 18, 18, 17, 21, 18, 18], [
    "Asesor", "Correo", "Estado", "Cartera asignada", "Contactados", "% contacto", "Gestiones realizadas", "Convertidos", "% conversión",
  ]);
  team.getCell("A2").value = "Alcance";
  team.getCell("B2").value = scope;
  team.getCell("A3").value = "Fecha de corte (Lima)";
  team.getCell("B3").value = formatLimaDate(exportedAt);
  for (const advisor of advisors) {
    const total = advisor.activeLeads;
    team.addRow([
      advisor.name || advisor.email,
      advisor.email,
      advisor.status === "ACTIVE" ? "Activo" : advisor.status === "ON_LEAVE" ? "En pausa" : "Inactivo",
      total,
      advisor.contactedLeads,
      total ? advisor.contactedLeads / total : 0,
      advisor.interactionsCount,
      advisor.convertedLeads,
      total ? advisor.convertedLeads / total : 0,
    ]);
  }
  styleRows(team);
  team.getColumn(6).numFmt = "0.0%";
  team.getColumn(9).numFmt = "0.0%";
  if (!advisors.length) team.getCell("A6").value = "Sin asesores en el alcance seleccionado";

  const funnel = workbook.addWorksheet("Estados");
  prepareSheet(funnel, "BLUA | DISTRIBUCIÓN POR ESTADO", [29, 18, 20], ["Estado actual", "Prospectos", "% del total"]);
  funnel.getCell("A2").value = "Alcance";
  funnel.getCell("B2").value = scope;
  funnel.getCell("A3").value = "Fecha de corte (Lima)";
  funnel.getCell("B3").value = formatLimaDate(exportedAt);
  for (const stage of dashboard.funnel) {
    funnel.addRow([
      CRM_STATUS_LABELS[stage.status] || stage.status,
      stage.count,
      dashboard.totalLeads ? stage.count / dashboard.totalLeads : 0,
    ]);
  }
  styleRows(funnel);
  funnel.getColumn(3).numFmt = "0.0%";
  return workbook;
}

export async function downloadCrmProgressExcel(input: ExportInput): Promise<void> {
  const workbook = await buildCrmProgressWorkbook(input);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blua_progreso_comercial_${fileDate(input.exportedAt || new Date())}${input.selectedAdvisor ? "_asesor" : ""}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
