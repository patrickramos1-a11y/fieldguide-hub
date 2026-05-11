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
  | "coords"
  | "people"
  | "hours-presets"
  | "button-select"
  | "repeater"
  | "apply-to-sides";

/** Pessoa em listas dinâmicas (Pessoas Envolvidas etc.). */
export interface Person {
  id: string;
  nome: string;
  cargo?: string;
  vinculo?: string;
  telefone?: string;
  email?: string;
  documento?: string;
  registro?: string;
}

/** Configuração de funcionamento / horários com presets. */
export type HoursPreset =
  | "comercial"
  | "2turnos"
  | "3turnos"
  | "24h"
  | "outro";

export interface HoursTurno {
  id: string;
  inicio: string;
  fim: string;
  label?: string;
}

export interface HoursValue {
  preset?: HoursPreset;
  dias?: string[];
  turnos?: HoursTurno[];
  observacao?: string;
}

/** Finalidade dos módulos para classificação/filtros. */
export type ModulePurpose = "projeto" | "acompanhamento" | "monitoramento" | "outorga" | "vazao";

export const MODULE_PURPOSE_LABELS: Record<ModulePurpose, string> = {
  projeto: "Projeto",
  acompanhamento: "Acompanhamento",
  monitoramento: "Monitoramento",
  outorga: "Outorga",
  vazao: "Vazão",
};

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  /** Condicional: só exibe se a regra for satisfeita pelos valores do mesmo módulo. */
  showIf?: {
    field: string;
    equals?: unknown;
    in?: unknown[];
    truthy?: boolean;
  };
  /** button-select: permite múltipla seleção. */
  multi?: boolean;
  /** button-select / repeater: oferece opção "Outra" inline. */
  allowOther?: boolean;
  /** repeater: campos de cada item. */
  itemFields?: FieldDef[];
  /** repeater: rótulo para o botão de adicionar item. */
  addItemLabel?: string;
  /** number: lista de presets clicáveis. */
  presets?: Array<string | number>;
  /** number: opções de unidade (substitui `unit`). */
  unitOptions?: string[];
  /** number: aceita decimais (default true). */
  decimal?: boolean;
  /** apply-to-sides: rótulos dos lados. */
  sides?: string[];
}

export interface ModuleDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  subgroups?: SubgroupDef[];
  /** Tags de finalidade para filtros rápidos. */
  purposes?: ModulePurpose[];
}

export interface SubgroupDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Subgrupo opcional: não conta para "não iniciado" / progresso quando vazio. */
  optional?: boolean;
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
  /** Categoria livre para organização central (ex.: "Licenças", "Fotos"). */
  category?: string;
  /** Módulo de origem/contexto (opcional). */
  moduleTag?: string;
}

export interface ModuleState {
  status: FieldStatus;
  values: Record<string, any>;
  fieldStatus: Record<string, FieldStatus>;
  notes?: string;
  attachments: Attachment[];
  /** Observações pontuais por campo/bloco. */
  fieldNotes?: Record<string, string>;
  /** Observações por subgrupo (uma por subgrupo). */
  subgroupNotes?: Record<string, string>;
  /** Marcações de "Não se aplica" por campo/bloco. */
  nonApplicable?: Record<string, boolean>;
  /** Marcação "Não se aplica" para o módulo inteiro. */
  naModule?: boolean;
  /** Marcações "Não se aplica" por subgrupo. */
  naSubgroups?: Record<string, boolean>;
  /** Marcação manual de módulo concluído. */
  moduleDone?: boolean;
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
  /** IDs de módulos habilitados; quando undefined, etapa de configuração é exibida. */
  enabledModules?: string[];
  /** Timestamp ISO de encerramento do levantamento (trava edições). */
  closedAt?: string;
  /** Horário de saída registrado no encerramento. */
  closedAtSaida?: string;
}

/** Template de configuração de módulos (reutilizável entre levantamentos). */
export interface SurveyTemplate {
  id: string;
  name: string;
  type: SurveyType;
  moduleIds: string[];
  createdAt: string;
  /** Quando true, vira preset padrão para esse tipo no novo levantamento. */
  isDefault?: boolean;
  /** Templates de fábrica não podem ser removidos. */
  builtIn?: boolean;
}