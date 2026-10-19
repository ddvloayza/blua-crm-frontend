import { graphqlRequest } from "@/lib/graphql/client";

export type CrmRole = "ADMIN" | "ADVISOR";
export type CrmActor = { email: string; name: string; role: CrmRole };
export type CrmInteraction = {
  uuid: string;
  advisorEmail: string;
  interactionType: string;
  outcome: string;
  summary: string;
  details: string;
  transcriptText: string;
  attachments: CrmAttachment[];
  occurredAt: string;
  nextFollowupAt: string | null;
  nextAction: string;
};
export type CrmAttachment = { uuid: string; filename: string; contentType: string; size: number };
export type CrmAppointment = { uuid: string; scheduledAt: string; status: string; notes: string; advisorEmail: string };
export type CrmProposal = { uuid: string; amount: string; currency: string; termMonths: number | null; validUntil: string | null; status: string; notes: string; createdAt: string; advisorEmail: string; attachments: CrmAttachment[] };
export type CrmSimulationInstallment = {
  number: number;
  dueDate: string;
  interest: string;
  principal: string;
  total: string;
};
export type CrmSimulation = {
  uuid: string;
  capitalAmount: string;
  currency: string;
  termMonths: number;
  frequency: "MONTHLY" | "QUARTERLY";
  startDate: string;
  fundPlanNameSnapshot: string;
  estimatedTotalInterest: string;
  estimatedTotalReturn: string;
  createdAt: string;
  createdByEmail: string | null;
  schedule: CrmSimulationInstallment[];
};
export type CrmSimulationPlan = {
  uuid: string;
  fundId: string;
  name: string;
  fundName: string;
  currency: string;
  frequency: "MONTHLY" | "QUARTERLY";
  termMonths: number;
  minAmount: string;
  maxAmount: string | null;
};

export type CrmLead = {
  uuid: string;
  fullName: string;
  email: string;
  phone: string;
  countryPrefix: string;
  source: string;
  campaign: string;
  status: string;
  score: number;
  notes: string;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowupAt: string | null;
  advisorEmail: string | null;
  simulationsCount: number;
  latestSimulation?: {
    capitalAmount: string;
    currency: string;
    termMonths: number;
    fundPlanNameSnapshot: string;
    estimatedTotalReturn: string | null;
    createdAt: string;
  } | null;
  interactions?: CrmInteraction[];
  appointments?: CrmAppointment[];
  proposals?: CrmProposal[];
  statusHistory?: CrmStatusEvent[];
};
export type CrmStatusEvent = { previousStatus: string; status: string; changedAt: string; isBaseline: boolean; advisorEmail: string | null };
export type CrmWorkItem = { lead: CrmLead; reason: "OVERDUE" | "TODAY" | "NEW"; dueAt: string | null; nextAction: string };
export type CrmUpcomingAppointment = { lead: CrmLead; appointment: CrmAppointment };
export type CrmGoal = { advisorId: string; advisorEmail: string; month: string; targetContacts: number; targetInteractions: number; targetConversions: number; actualContacts: number; actualInteractions: number; actualConversions: number };
export type CrmAnalytics = { fromDate: string; toDate: string; newLeads: number; interactions: number; conversions: number; averageFirstContactHours: number | null; weeklyInteractions: { weekStart: string; interactions: number }[]; stageChanges: { status: string; count: number }[]; sources: { source: string; newLeads: number; convertedLeads: number }[] };
export type CrmDashboard = {
  totalLeads: number;
  dueFollowups: number;
  neverContacted: number;
  convertedLeads: number;
  interactionsCount: number;
  funnel: { status: string; count: number }[];
};
export type CrmAdvisor = {
  uuid: string;
  email: string;
  name: string;
  status: string;
  activeLeads: number;
  maxActiveLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  interactionsCount: number;
};

const leadFields = `
  uuid fullName email phone countryPrefix source campaign status score notes
  createdAt lastContactedAt nextFollowupAt advisorEmail simulationsCount
`;

async function request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const result = await graphqlRequest(query, variables);
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "No se pudo cargar el CRM.");
  }
  return result.data as T;
}

export async function getCrmActor(): Promise<CrmActor> {
  const data = await request<{ crm: { actor: CrmActor } }>(
    `query { crm { actor { email name role } } }`
  );
  return data.crm.actor;
}

export async function getCrmLeads(filters: {
  status?: string;
  advisorId?: string;
  unassigned?: boolean;
  search?: string;
  limit?: number;
} = {}): Promise<CrmLead[]> {
  const data = await request<{ crm: { leads: CrmLead[] } }>(
    `query CrmLeads($status: String, $advisorId: UUID, $unassigned: Boolean, $search: String, $limit: Int) {
      crm { leads(status: $status, advisorId: $advisorId, unassigned: $unassigned, search: $search, limit: $limit) { ${leadFields} } }
    }`,
    filters
  );
  return data.crm.leads;
}

export async function getCrmLead(id: string): Promise<CrmLead | null> {
  const data = await request<{ crm: { lead: CrmLead | null } }>(
    `query CrmLead($id: UUID!) {
      crm { lead(id: $id) { ${leadFields}
        latestSimulation { capitalAmount currency termMonths fundPlanNameSnapshot estimatedTotalReturn createdAt }
        interactions { uuid advisorEmail interactionType outcome summary details transcriptText occurredAt nextFollowupAt nextAction attachments { uuid filename contentType size } }
        appointments { uuid scheduledAt status notes advisorEmail }
        proposals { uuid amount currency termMonths validUntil status notes createdAt advisorEmail attachments { uuid filename contentType size } }
        statusHistory { previousStatus status changedAt isBaseline advisorEmail }
      } }
    }`,
    { id }
  );
  return data.crm.lead;
}

export async function createCrmLead(input: {
  fullName: string;
  email?: string;
  phone?: string;
  countryPrefix?: string;
  notes?: string;
}): Promise<CrmLead> {
  const data = await request<{ createCrmLead: { lead: CrmLead } }>(
    `mutation CreateCrmLead($fullName: String!, $email: String, $phone: String, $countryPrefix: String, $notes: String) {
      createCrmLead(fullName: $fullName, email: $email, phone: $phone, countryPrefix: $countryPrefix, notes: $notes) {
        lead { ${leadFields} }
      }
    }`,
    input
  );
  return data.createCrmLead.lead;
}

export async function getCrmSimulationWorkspace(leadId: string): Promise<{
  lead: Pick<CrmLead, "uuid" | "fullName" | "email" | "status"> | null;
  plans: CrmSimulationPlan[];
  simulations: CrmSimulation[];
}> {
  const data = await request<{ crm: {
    lead: (Pick<CrmLead, "uuid" | "fullName" | "email" | "status"> & { simulations: CrmSimulation[] }) | null;
    simulationPlans: CrmSimulationPlan[];
  } }>(`query CrmSimulationWorkspace($leadId: UUID!) {
    crm {
      lead(id: $leadId) {
        uuid fullName email status
        simulations {
          uuid capitalAmount currency termMonths frequency startDate
          fundPlanNameSnapshot estimatedTotalInterest estimatedTotalReturn
          createdAt createdByEmail
          schedule { number dueDate interest principal total }
        }
      }
      simulationPlans {
        uuid fundId name fundName currency frequency termMonths minAmount maxAmount
      }
    }
  }`, { leadId });
  const { lead, simulationPlans } = data.crm;
  return { lead, plans: simulationPlans, simulations: lead?.simulations ?? [] };
}

export async function createCrmSimulation(input: {
  leadId: string;
  fundId: string;
  currency: string;
  frequency: "MONTHLY" | "QUARTERLY";
  termMonths: number;
  capitalAmount: string;
  startDate: string;
}): Promise<CrmSimulation> {
  const data = await request<{ createCrmSimulation: { simulation: CrmSimulation } }>(
    `mutation CreateCrmSimulation($leadId: UUID!, $fundId: UUID!, $currency: String!, $frequency: String!, $termMonths: Int!, $capitalAmount: String!, $startDate: Date) {
      createCrmSimulation(leadId: $leadId, fundId: $fundId, currency: $currency, frequency: $frequency, termMonths: $termMonths, capitalAmount: $capitalAmount, startDate: $startDate) {
        simulation {
          uuid capitalAmount currency termMonths frequency startDate
          fundPlanNameSnapshot estimatedTotalInterest estimatedTotalReturn
          createdAt createdByEmail
          schedule { number dueDate interest principal total }
        }
      }
    }`, input
  );
  return data.createCrmSimulation.simulation;
}

export async function getCrmDashboard(advisorId?: string): Promise<CrmDashboard> {
  const data = await request<{ crm: { dashboard: CrmDashboard } }>(
    `query CrmDashboard($advisorId: UUID) {
      crm { dashboard(advisorId: $advisorId) {
        totalLeads dueFollowups neverContacted convertedLeads interactionsCount
        funnel { status count }
      } }
    }`,
    { advisorId }
  );
  return data.crm.dashboard;
}

export async function getCrmAdvisors(): Promise<CrmAdvisor[]> {
  const data = await request<{ crm: { advisors: CrmAdvisor[] } }>(
    `query { crm { advisors {
      uuid email name status activeLeads maxActiveLeads contactedLeads convertedLeads interactionsCount
    } } }`
  );
  return data.crm.advisors;
}

export async function recordCrmInteraction(input: {
  leadId: string;
  interactionType: string;
  outcome: string;
  summary: string;
  details?: string;
  transcriptText?: string;
  nextFollowupAt?: string | null;
  nextAction?: string;
  status?: string | null;
}): Promise<{ lead: CrmLead; interactionId: string }> {
  const data = await request<{ recordCrmInteraction: { lead: CrmLead; interactionId: string } }>(
    `mutation RecordCrmInteraction(
      $leadId: UUID!, $interactionType: String!, $outcome: String!, $summary: String!,
      $details: String, $transcriptText: String, $nextFollowupAt: DateTime, $nextAction: String, $status: String
    ) {
      recordCrmInteraction(
        leadId: $leadId, interactionType: $interactionType, outcome: $outcome,
        summary: $summary, details: $details, transcriptText: $transcriptText,
        nextFollowupAt: $nextFollowupAt, nextAction: $nextAction, status: $status
      ) { interactionId lead { ${leadFields} } }
    }`,
    input
  );
  return data.recordCrmInteraction;
}

export async function createCrmAppointment(input: { leadId: string; scheduledAt: string; notes?: string }): Promise<void> {
  await request(`mutation($leadId: UUID!, $scheduledAt: DateTime!, $notes: String) {
    createCrmAppointment(leadId: $leadId, scheduledAt: $scheduledAt, notes: $notes) { lead { uuid } }
  }`, input);
}

export async function updateCrmAppointment(appointmentId: string, status: string): Promise<void> {
  await request(`mutation($appointmentId: UUID!, $status: String!) {
    updateCrmAppointment(appointmentId: $appointmentId, status: $status) { lead { uuid } }
  }`, { appointmentId, status });
}

export async function createCrmProposal(input: { leadId: string; amount: string; currency: string; termMonths?: number | null; validUntil?: string | null; notes?: string }): Promise<string> {
  const data = await request<{ createCrmProposal: { proposalId: string } }>(`mutation($leadId: UUID!, $amount: String!, $currency: String!, $termMonths: Int, $validUntil: Date, $notes: String) {
    createCrmProposal(leadId: $leadId, amount: $amount, currency: $currency, termMonths: $termMonths, validUntil: $validUntil, notes: $notes) { proposalId }
  }`, input);
  return data.createCrmProposal.proposalId;
}

export async function updateCrmProposal(proposalId: string, status: string): Promise<void> {
  await request(`mutation($proposalId: UUID!, $status: String!) {
    updateCrmProposal(proposalId: $proposalId, status: $status) { lead { uuid } }
  }`, { proposalId, status });
}

function attachmentEndpoint(id?: string): string {
  const origin = new URL(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT as string).origin;
  return `${origin}/api/crm/attachments/${id ? `${id}/` : ""}`;
}

export function crmAttachmentUrl(id: string): string { return attachmentEndpoint(id); }

export async function uploadCrmAttachment(file: File, parent: { interactionId?: string; proposalId?: string }): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  if (parent.interactionId) body.append("interaction_id", parent.interactionId);
  if (parent.proposalId) body.append("proposal_id", parent.proposalId);
  const response = await fetch(attachmentEndpoint(), { method: "POST", credentials: "include", body });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "No se pudo subir el archivo.");
  }
}

export const CRM_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  ASSIGNED: "Asignado",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  PROPOSAL_SENT: "Propuesta enviada",
  NEGOTIATION: "Negociación",
  CONVERTED: "Convertido",
  LOST: "Perdido",
  DO_NOT_CONTACT: "No contactar",
};

export const CRM_OUTCOME_LABELS: Record<string, string> = {
  NO_ANSWER: "No respondió",
  INTERESTED: "Interesado",
  NOT_INTERESTED: "No interesado",
  FOLLOW_UP: "Pidió seguimiento",
  QUALIFIED: "Calificado",
  OTHER: "Otro",
};

export function formatCrmDate(value: string | null | undefined, includeTime = false): string {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-05:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function whatsappUrl(lead: Pick<CrmLead, "phone" | "countryPrefix">): string | null {
  const digits = `${lead.countryPrefix}${lead.phone}`.replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export async function getCrmWorklist(): Promise<{ items: CrmWorkItem[]; appointments: CrmUpcomingAppointment[] }> {
  const data = await request<{ crm: { worklist: CrmWorkItem[]; upcomingAppointments: CrmUpcomingAppointment[] } }>(`query {
    crm { worklist { reason dueAt nextAction lead { ${leadFields} } }
      upcomingAppointments { lead { ${leadFields} } appointment { uuid scheduledAt status notes advisorEmail } }
    }
  }`);
  return { items: data.crm.worklist, appointments: data.crm.upcomingAppointments };
}

export async function getCrmGoals(month?: string): Promise<CrmGoal[]> {
  const data = await request<{ crm: { goals: CrmGoal[] } }>(`query($month: Date) { crm { goals(month: $month) {
    advisorId advisorEmail month targetContacts targetInteractions targetConversions actualContacts actualInteractions actualConversions
  } } }`, { month });
  return data.crm.goals;
}

export async function setCrmGoal(input: { advisorId: string; month: string; targetContacts: number; targetInteractions: number; targetConversions: number }): Promise<void> {
  await request(`mutation($advisorId: UUID!, $month: Date!, $targetContacts: Int!, $targetInteractions: Int!, $targetConversions: Int!) {
    setCrmAdvisorGoal(advisorId: $advisorId, month: $month, targetContacts: $targetContacts, targetInteractions: $targetInteractions, targetConversions: $targetConversions) { advisorId }
  }`, input);
}

export async function getCrmAnalytics(filters: { fromDate?: string; toDate?: string; advisorId?: string } = {}): Promise<CrmAnalytics> {
  const data = await request<{ crm: { analytics: CrmAnalytics } }>(`query($fromDate: Date, $toDate: Date, $advisorId: UUID) {
    crm { analytics(fromDate: $fromDate, toDate: $toDate, advisorId: $advisorId) {
      fromDate toDate newLeads interactions conversions averageFirstContactHours
      weeklyInteractions { weekStart interactions }
      stageChanges { status count }
      sources { source newLeads convertedLeads }
    } }
  }`, filters);
  return data.crm.analytics;
}

export async function assignCrmLead(leadId: string, advisorId: string, reason: string): Promise<void> {
  await request(`mutation($leadId: UUID!, $advisorId: UUID!, $reason: String) {
    assignCrmLead(leadId: $leadId, advisorId: $advisorId, reason: $reason) { lead { uuid advisorEmail } }
  }`, { leadId, advisorId, reason });
}

export function whatsappPitchUrl(lead: Pick<CrmLead, "fullName" | "phone" | "countryPrefix">, advisorName: string | undefined): string | null {
  const url = whatsappUrl(lead);
  if (!url) return null;
  const firstName = lead.fullName.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hola ${firstName},` : "Hola,";
  const sender = advisorName?.trim() || "un asesor";
  const pitch = `${greeting} soy ${sender} de Blua Investments. Me gustaría conocer tus objetivos de inversión y compartirte alternativas que podrían ajustarse a lo que buscas. ¿Podemos conversar por aquí?`;
  return `${url}?text=${encodeURIComponent(pitch)}`;
}
