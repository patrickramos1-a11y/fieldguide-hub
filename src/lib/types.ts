export type SurveyType =
  | "geral"
  | "ambiental"
  | "vazao"
  | "outorga"
  | "terreno";

export const SURVEY_TYPES: { id: SurveyType; label: string; description: string }[] = [
  { id: "geral", label: "Levantamento Geral de Projetos", description: "Coleta ampla de dados de empresa, atividade, água, resíduos, efluentes e processo." },
  { id: "ambiental", label: "Acompanhamento Ambiental", description: "Controle periódico de conformidade, ETE, resíduos, documentos e pendências." },
  { id: "vazao", label: "Medição de Vazão", description: "Registro técnico de seção, profundidades, tempos e desenho." },
  { id: "outorga", label: "Outorga", description: "Coleta para processo de outorga: poço, bomba, reservatório e representante legal." },
  { id: "terreno", label: "Visita ao Local / Terreno", description: "Caracterização física: limites, topografia, vegetação, solo, acesso e vizinhança." },
];

export type FieldStatus =
  | "nao_iniciado"
  | "em_andamento"
  | "concluido"
  | "pendente"
  | "nao_se_aplica"
  | "aguardando_documento"
  | "aguardando_empresa"
  | "requer_retorno";

export const STATUS_LABELS: Record<FieldStatus, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  pendente: "Pendente",
  nao_se_aplica: "Não se aplica",
  aguardando_documento: "Aguardando documento",
  aguardando_empresa: "Aguardando empresa",
  requer_retorno: "Requer retorno",
};

export const STATUS_COLOR: Record<FieldStatus, string> = {
  nao_iniciado: "var(--status-todo)",
  em_andamento: "var(--status-progress)",
  concluido: "var(--status-done)",
  pendente: "var(--status-pending)",
  nao_se_aplica: "var(--status-na)",
  aguardando_documento: "var(--status-doc)",
  aguardando_empresa: "var(--status-company)",
  requer_retorno: "var(--status-return)",
};

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "multiselect"
  | "boolean"
  | "coords";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  placeholder?: string;
}

export interface ModuleDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface Client {
  id: string;
  name: string;
  personType?: "PJ" | "PF";
  cnpjCpf?: string;
  ie?: string;
  im?: string;
  address?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  contact?: string;
  phone?: string;
  email?: string;
  // Representante legal (para o caso PJ)
  repNome?: string;
  repRg?: string;
  repCpf?: string;
  repCargo?: string;
  repEmail?: string;
  repPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface Empreendimento {
  id: string;
  clientId: string;
  name: string;
  cnpjCpf?: string;
  atividade?: string;
  cnae?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  latitude?: string;
  longitude?: string;
  contatoLocal?: string;
  telefoneLocal?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  empreendimentoId?: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  createdAt: string;
}

export interface ModuleState {
  status: FieldStatus;
  values: Record<string, any>;
  fieldStatus: Record<string, FieldStatus>;
  notes?: string;
  attachments: Attachment[];
}

export interface Pendencia {
  id: string;
  module: string;
  description: string;
  responsible?: string;
  status: FieldStatus;
  createdAt: string;
}

export interface Survey {
  id: string;
  projectId: string;
  type: SurveyType;
  title: string;
  date: string;
  modules: Record<string, ModuleState>;
  pendencias: Pendencia[];
  signatures: { client?: string; technician?: string; date?: string };
  createdAt: string;
}