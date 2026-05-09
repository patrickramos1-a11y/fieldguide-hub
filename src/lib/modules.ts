import type { ModuleDef, SurveyType } from "./types";

export const MODULES: ModuleDef[] = [
  {
    id: "identificacao",
    title: "Identificação do Levantamento",
    description: "Contexto da visita: data, horários, motivo e objetivo.",
    fields: [
      { id: "data_visita", label: "Data da visita", type: "date" },
      { id: "hora_chegada", label: "Horário de chegada", type: "time" },
      { id: "hora_saida", label: "Horário de saída", type: "time" },
      { id: "objetivo", label: "Objetivo da visita", type: "textarea" },
      { id: "motivo", label: "Motivo da visita", type: "multiselect", options: ["Fiscalização", "Levantamento de projetos", "Visita técnica", "Reunião"] },
    ],
  },
  {
    id: "empreendimento",
    title: "Dados Cadastrais do Empreendimento",
    fields: [
      { id: "empresa", label: "Empresa / empreendimento", type: "text" },
      { id: "cnpj_cpf", label: "CNPJ / CPF", type: "text" },
      { id: "endereco", label: "Endereço", type: "text" },
      { id: "bairro", label: "Bairro", type: "text" },
      { id: "cidade", label: "Cidade", type: "text" },
      { id: "uf", label: "UF", type: "text" },
      { id: "cep", label: "CEP", type: "text" },
      { id: "atividade", label: "Descrição da atividade", type: "textarea" },
    ],
  },
  {
    id: "pessoas",
    title: "Pessoas Envolvidas",
    fields: [
      { id: "rep_nome", label: "Representante legal — nome", type: "text" },
      { id: "rep_rg", label: "RG", type: "text" },
      { id: "rep_cpf", label: "CPF", type: "text" },
      { id: "rep_endereco", label: "Endereço do representante", type: "text" },
      { id: "colab_nome", label: "Colaborador acompanhante — nome", type: "text" },
      { id: "colab_cargo", label: "Cargo do colaborador", type: "text" },
      { id: "tec_nome", label: "Técnico responsável", type: "text" },
      { id: "tec_cargo", label: "Cargo do técnico", type: "text" },
    ],
  },
  {
    id: "localizacao",
    title: "Localização e Coordenadas",
    fields: [
      { id: "coord_emp", label: "Coordenadas do empreendimento", type: "coords" },
    ],
  },
  {
    id: "operacionais",
    title: "Dados Operacionais",
    fields: [
      { id: "n_funcionarios", label: "Número de funcionários", type: "number" },
      { id: "horario_func", label: "Horário de funcionamento", type: "text" },
      { id: "alteracao_quadro", label: "Alteração no quadro de funcionários?", type: "boolean" },
      { id: "alteracao_producao", label: "Alteração na produção?", type: "boolean" },
    ],
  },
  {
    id: "areas",
    title: "Áreas, Dimensões e Terreno",
    fields: [
      { id: "area_total", label: "Área total", type: "number", unit: "m²" },
      { id: "area_construida", label: "Área construída", type: "number", unit: "m²" },
      { id: "area_a_construir", label: "Área a construir", type: "number", unit: "m²" },
      { id: "topografia", label: "Topografia", type: "select", options: ["Plana", "Aclive", "Declive", "Irregular"] },
      { id: "tipo_solo", label: "Tipo de solo", type: "text" },
      { id: "vegetacao", label: "Vegetação", type: "textarea" },
      { id: "limites", label: "Limites do terreno", type: "textarea" },
    ],
  },
  {
    id: "agua",
    title: "Água, Captação, Reservatório e Uso",
    fields: [
      { id: "corpo_hidrico", label: "Corpo hídrico receptor?", type: "boolean" },
      { id: "tipo_captacao", label: "Tipo de captação", type: "multiselect", options: ["Superficial", "Subterrânea", "Rede pública"] },
      { id: "consumo", label: "Estimativa de consumo", type: "number", unit: "m³/dia" },
      { id: "reservatorio", label: "Possui reservatório?", type: "boolean" },
      { id: "tamanho_reservatorio", label: "Tamanho do reservatório", type: "text" },
      { id: "outorga_status", label: "Outorga / Dispensa", type: "select", options: ["Outorga", "Dispensa de outorga", "Não possui"] },
      { id: "uso_agua", label: "Uso da água", type: "textarea" },
    ],
  },
  {
    id: "pocos",
    title: "Poços",
    fields: [
      { id: "coord_poco", label: "Coordenadas do poço", type: "coords" },
      { id: "profundidade", label: "Profundidade", type: "number", unit: "m" },
      { id: "diametro", label: "Diâmetro", type: "number", unit: "mm" },
      { id: "bomba", label: "CV / marca / modelo da bomba", type: "text" },
      { id: "vazao_poco", label: "Vazão do poço", type: "number", unit: "m³/h" },
      { id: "vazao_requerida", label: "Vazão requerida/dia", type: "number", unit: "m³/dia" },
    ],
  },
  {
    id: "vazao",
    title: "Medição de Vazão",
    fields: [
      { id: "largura_inicio", label: "Largura no início", type: "number", unit: "m" },
      { id: "largura_meio", label: "Largura no meio", type: "number", unit: "m" },
      { id: "largura_fim", label: "Largura no fim", type: "number", unit: "m" },
      { id: "comprimento", label: "Comprimento", type: "number", unit: "m" },
      { id: "area_secao", label: "Área da seção", type: "number", unit: "m²" },
      { id: "prof_inicio", label: "Profundidades no início (cm, separadas por vírgula)", type: "text" },
      { id: "prof_meio", label: "Profundidades no meio", type: "text" },
      { id: "prof_fim", label: "Profundidades no fim", type: "text" },
      { id: "tempos", label: "Tempos T1–T5 (s)", type: "text" },
      { id: "obs_vazao", label: "Observações técnicas", type: "textarea" },
    ],
  },
  {
    id: "ete",
    title: "ETE e Efluentes",
    fields: [
      { id: "possui_ete", label: "Possui ETE?", type: "boolean" },
      { id: "funcionamento_ete", label: "Funcionamento da ETE", type: "select", options: ["Adequado", "Com problemas", "Parada"] },
      { id: "produtos_ete", label: "Produtos utilizados", type: "textarea" },
      { id: "tratamento", label: "Situação do tratamento", type: "textarea" },
      { id: "treinamento_ete", label: "Necessita treinamento?", type: "boolean" },
    ],
  },
  {
    id: "processo",
    title: "Processo Produtivo",
    fields: [
      { id: "materia_prima", label: "Matéria-prima", type: "textarea" },
      { id: "equipamentos", label: "Equipamentos", type: "textarea" },
      { id: "etapas", label: "Etapas do processo", type: "textarea" },
      { id: "produtos_quimicos", label: "Produtos químicos utilizados", type: "textarea" },
      { id: "frota", label: "Frota / veículos", type: "textarea" },
    ],
  },
  {
    id: "emissoes",
    title: "Emissões",
    fields: [
      { id: "ruidos", label: "Ruídos", type: "textarea" },
      { id: "liquidos", label: "Emissões líquidas", type: "textarea" },
      { id: "solidos", label: "Emissões sólidas", type: "textarea" },
      { id: "gasosos", label: "Emissões gasosas", type: "textarea" },
    ],
  },
  {
    id: "residuos",
    title: "Resíduos Sólidos",
    fields: [
      { id: "tipos", label: "Tipos de resíduos", type: "multiselect", options: ["Papel", "Plástico", "Vidro", "Metal", "Orgânicos", "Perigosos", "Outros"] },
      { id: "acondicionamento", label: "Acondicionamento", type: "textarea" },
      { id: "destinacao", label: "Destinação", type: "textarea" },
      { id: "coleta_terceirizada", label: "Coleta terceirizada?", type: "boolean" },
      { id: "empresa_coleta", label: "Empresa de coleta", type: "text" },
      { id: "periodicidade", label: "Periodicidade da coleta", type: "text" },
    ],
  },
  {
    id: "politica",
    title: "Política e Gestão Ambiental",
    fields: [
      { id: "politica_ambiental", label: "Política ambiental implantada?", type: "boolean" },
      { id: "educacao", label: "Necessita educação ambiental?", type: "boolean" },
      { id: "palestras", label: "Palestras / orientações realizadas", type: "textarea" },
      { id: "conformidade", label: "Conformidade operacional", type: "textarea" },
    ],
  },
  {
    id: "rotinas",
    title: "Rotinas de Monitoramento",
    fields: [
      { id: "hidrometro", label: "Leitura do hidrômetro", type: "text" },
      { id: "coletas_agua", label: "Coletas de água", type: "textarea" },
      { id: "coletas_efluente", label: "Coletas de efluente", type: "textarea" },
      { id: "acompanhamento_ete", label: "Acompanhamento da ETE", type: "textarea" },
    ],
  },
  {
    id: "vizinhanca",
    title: "Vizinhança e Entorno",
    fields: [
      { id: "terrenos_vizinhos", label: "Terrenos vizinhos", type: "textarea" },
      { id: "mercado_local", label: "Mercado local", type: "textarea" },
      { id: "obras_proximas", label: "Obras próximas", type: "textarea" },
      { id: "necessita_laudo", label: "Necessita laudo?", type: "boolean" },
    ],
  },
  {
    id: "infraestrutura",
    title: "Acesso e Infraestrutura Pública",
    fields: [
      { id: "acesso", label: "Tipo de acesso", type: "text" },
      { id: "pavimentacao", label: "Pavimentação", type: "select", options: ["Asfalto", "Paralelepípedo", "Terra", "Concreto"] },
      { id: "agua_publica", label: "Água da rede", type: "boolean" },
      { id: "energia", label: "Energia elétrica", type: "boolean" },
      { id: "esgoto", label: "Esgoto", type: "boolean" },
      { id: "drenagem", label: "Drenagem pluvial", type: "boolean" },
    ],
  },
  {
    id: "fotos",
    title: "Levantamento Fotográfico",
    description: "Anexe as fotos no painel lateral do módulo.",
    fields: [
      { id: "descricao_fotos", label: "Descrição do conjunto fotográfico", type: "textarea" },
    ],
  },
  {
    id: "croqui",
    title: "Croqui / Desenho Técnico",
    description: "Anexe croquis e desenhos como imagens ou PDFs.",
    fields: [
      { id: "legenda", label: "Legenda do croqui", type: "textarea" },
      { id: "elementos", label: "Elementos representados", type: "textarea" },
    ],
  },
  {
    id: "documentos",
    title: "Documentos e Anexos",
    fields: [
      { id: "entregues", label: "Documentos entregues", type: "textarea" },
      { id: "solicitados", label: "Documentos solicitados", type: "textarea" },
    ],
  },
  {
    id: "observacoes",
    title: "Observações Técnicas",
    fields: [{ id: "obs_gerais", label: "Observações gerais", type: "textarea" }],
  },
  {
    id: "validacao",
    title: "Validação e Encerramento",
    fields: [
      { id: "assinatura_cliente", label: "Nome de quem assinou pelo cliente", type: "text" },
      { id: "assinatura_tecnico", label: "Nome do técnico responsável", type: "text" },
      { id: "data_validacao", label: "Data de validação", type: "date" },
    ],
  },
];

export const MODULES_BY_TYPE: Record<SurveyType, string[]> = {
  geral: [
    "identificacao", "empreendimento", "pessoas", "localizacao", "operacionais",
    "areas", "agua", "pocos", "processo", "emissoes", "residuos", "ete",
    "fotos", "documentos", "observacoes", "validacao",
  ],
  ambiental: [
    "identificacao", "empreendimento", "pessoas", "politica", "residuos",
    "ete", "rotinas", "operacionais", "documentos", "fotos", "observacoes", "validacao",
  ],
  vazao: [
    "identificacao", "empreendimento", "pessoas", "localizacao", "vazao",
    "croqui", "fotos", "observacoes", "validacao",
  ],
  outorga: [
    "identificacao", "empreendimento", "pessoas", "localizacao", "agua",
    "pocos", "documentos", "fotos", "validacao",
  ],
  terreno: [
    "identificacao", "empreendimento", "localizacao", "areas", "infraestrutura",
    "vizinhanca", "croqui", "fotos", "observacoes", "validacao",
  ],
};

export function getModulesForType(type: SurveyType) {
  const ids = MODULES_BY_TYPE[type];
  return ids.map((id) => MODULES.find((m) => m.id === id)!).filter(Boolean);
}