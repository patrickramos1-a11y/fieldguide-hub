import type { FieldDef, ModuleDef, SurveyType, ModulePurpose } from "./types";
import type { FieldStatus, ModuleState, SubgroupDef, Person, HoursValue } from "./types";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export const MODULES: ModuleDef[] = [
  {
    id: "identificacao",
    title: "Identificação do Levantamento",
    description: "Contexto da visita: data, horários, motivo e objetivo.",
    fields: [],
    purposes: ["projeto", "acompanhamento", "monitoramento", "outorga", "vazao"],
    subgroups: [
      {
        id: "visita",
        title: "Dados da visita",
        fields: [
          { id: "data_visita", label: "Data da visita", type: "date" },
          { id: "hora_chegada", label: "Horário de chegada", type: "time" },
          { id: "objetivo", label: "Objetivo da visita", type: "textarea" },
        ],
      },
      {
        id: "motivo",
        title: "Motivo da visita",
        fields: [
          { id: "motivo", label: "Motivo (pode marcar mais de um)", type: "multiselect", options: ["Fiscalização", "Levantamento de projetos", "Visita técnica", "Reunião", "Outro"] },
          { id: "motivo_outro", label: "Descreva o outro motivo", type: "text", showIf: { field: "motivo", in: ["Outro"] } },
        ],
      },
      {
        id: "local",
        title: "Identificação do local",
        description: "Confirme dados do local visitado (podem diferir do cadastro do empreendimento).",
        fields: [
          { id: "local_nome", label: "Nome do local / empreendimento", type: "text" },
          { id: "local_endereco", label: "Endereço", type: "text" },
          { id: "local_bairro", label: "Bairro", type: "text" },
          { id: "local_cidade", label: "Cidade", type: "text" },
          { id: "local_uf", label: "UF", type: "select", options: UFS },
          { id: "local_cep", label: "CEP", type: "text" },
        ],
      },
    ],
  },
  {
    id: "empreendimento",
    title: "Dados Cadastrais do Empreendimento",
    description: "Confirme/complete os dados cadastrais utilizados neste levantamento.",
    fields: [],
    purposes: ["projeto", "acompanhamento", "outorga"],
    subgroups: [
      {
        id: "identificacao_empresa",
        title: "Identificação da empresa",
        fields: [
          { id: "empresa", label: "Empresa / empreendimento", type: "text" },
          { id: "cnpj_cpf", label: "CNPJ / CPF", type: "text" },
          { id: "ie", label: "Inscrição Estadual", type: "text" },
          { id: "im", label: "Inscrição Municipal", type: "text" },
          { id: "atividade", label: "Descrição da atividade", type: "textarea" },
          { id: "cnae", label: "CNAE", type: "text" },
        ],
      },
      {
        id: "endereco",
        title: "Endereço",
        fields: [
          { id: "endereco", label: "Endereço (logradouro, nº, complemento)", type: "text" },
          { id: "bairro", label: "Bairro", type: "text" },
          { id: "cidade", label: "Cidade", type: "text" },
          { id: "uf", label: "UF", type: "select", options: UFS },
          { id: "cep", label: "CEP", type: "text" },
        ],
      },
      {
        id: "coords_emp",
        title: "Coordenadas geográficas do empreendimento",
        fields: [
          { id: "coord_emp", label: "Coordenadas (latitude / longitude)", type: "coords" },
        ],
      },
      {
        id: "contato_local",
        title: "Contato no local",
        fields: [
          { id: "contato_local", label: "Nome do contato no local", type: "text" },
          { id: "telefone_local", label: "Telefone do local", type: "text" },
          { id: "email_local", label: "E-mail do local", type: "text" },
        ],
      },
      {
        id: "rep_legal",
        title: "Representante legal",
        fields: [
          { id: "rep_nome", label: "Nome do representante legal", type: "text" },
          { id: "rep_rg", label: "RG", type: "text" },
          { id: "rep_cpf", label: "CPF", type: "text" },
          { id: "rep_cargo", label: "Cargo", type: "text" },
          { id: "rep_endereco", label: "Endereço do representante", type: "text" },
          { id: "rep_telefone", label: "Telefone", type: "text" },
          { id: "rep_email", label: "E-mail", type: "text" },
        ],
      },
    ],
  },
  {
    id: "pessoas",
    title: "Pessoas Envolvidas",
    description: "Pessoas que participaram desta visita.",
    fields: [],
    purposes: ["projeto", "acompanhamento", "monitoramento", "outorga", "vazao"],
    subgroups: [
      {
        id: "colaborador",
        title: "Colaborador que acompanhou o levantamento",
        fields: [
          { id: "colaboradores", label: "Colaboradores que acompanharam", type: "people" },
        ],
      },
      {
        id: "tecnico",
        title: "Técnico responsável pelo levantamento",
        fields: [
          { id: "tecnicos", label: "Técnico(s) responsável(eis)", type: "people" },
        ],
      },
      {
        id: "outros",
        title: "Outras pessoas presentes",
        fields: [
          { id: "outros_pessoas", label: "Outras pessoas presentes", type: "people" },
        ],
      },
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
    description: "Funcionamento, equipe e alterações operacionais.",
    fields: [],
    purposes: ["projeto", "acompanhamento", "monitoramento", "outorga"],
    subgroups: [
      {
        id: "funcionamento",
        title: "Funcionamento",
        fields: [
          { id: "funcionamento", label: "Regime de funcionamento", type: "hours-presets" },
        ],
      },
      {
        id: "quadro",
        title: "Quadro de funcionários",
        fields: [
          {
            id: "setores",
            label: "Setores e quantidade de funcionários",
            type: "repeater",
            addItemLabel: "Adicionar setor",
            itemFields: [
              { id: "setor", label: "Setor", type: "button-select", options: ["Administrativo", "Operacional", "Produção", "Manutenção", "Limpeza", "Segurança", "Logística", "Outros"], allowOther: true },
              { id: "quantidade", label: "Quantidade", type: "number", decimal: false },
            ],
          },
        ],
      },
      {
        id: "producao",
        title: "Produção e operação",
        fields: [
          { id: "capacidade_produtiva", label: "Capacidade produtiva atual", type: "text" },
        ],
      },
    ],
  },
  {
    id: "areas",
    title: "Áreas, Dimensões e Terreno",
    description: "Áreas do empreendimento e características físicas do terreno.",
    fields: [],
    purposes: ["projeto"],
    subgroups: [
      {
        id: "areas_empreendimento",
        title: "Áreas do empreendimento",
        fields: [
          { id: "area_total", label: "Área total", type: "number", unitOptions: ["m²", "ha"] },
          { id: "area_construida", label: "Área construída", type: "number", unit: "m²" },
          { id: "area_a_construir", label: "Área a construir", type: "number", unit: "m²" },
          { id: "area_livre", label: "Área livre / não edificada", type: "number", unit: "m²" },
        ],
      },
      {
        id: "dimensoes",
        title: "Dimensões do terreno",
        description: "Posicionando-se de frente para o terreno.",
        fields: [
          { id: "dim_frente", label: "Frente", type: "number", unit: "m" },
          { id: "dim_fundos", label: "Fundos", type: "number", unit: "m" },
          { id: "dim_lado_dir", label: "Lado direito", type: "number", unit: "m" },
          { id: "dim_lado_esq", label: "Lado esquerdo", type: "number", unit: "m" },
          { id: "regularidade", label: "Possui regularidade geométrica?", type: "boolean" },
        ],
      },
      {
        id: "limites",
        title: "Limites do terreno (fechamento)",
        fields: [
          {
            id: "limites",
            label: "Tipo de fechamento por lado",
            type: "apply-to-sides",
            sides: ["Frente", "Fundos", "Lado direito", "Lado esquerdo"],
            options: ["Cerca", "Muro de alvenaria", "Muro de concreto", "Tela", "Inexistente", "Outro"],
          },
        ],
      },
      {
        id: "topografia",
        title: "Conformação / Topografia",
        fields: [
          { id: "topografia", label: "Conformação predominante", type: "button-select", options: ["Plano", "Aclive suave", "Aclive acentuado", "Declive suave", "Declive acentuado", "Irregular"] },
          { id: "desnivel", label: "Desnível frente–fundo", type: "number", unit: "m" },
        ],
      },
      {
        id: "solo_vegetacao",
        title: "Solo",
        fields: [
          { id: "tipo_solo", label: "Tipo de solo", type: "button-select", multi: true, allowOther: true, options: ["Arenoso", "Argiloso", "Siltoso", "Pedregoso", "Misto", "Aterro", "Rocha exposta"] },
        ],
      },
      {
        id: "vegetacao",
        title: "Vegetação",
        fields: [
          { id: "vegetacao", label: "Identificação da vegetação", type: "button-select", multi: true, allowOther: true, options: ["Vegetação presente", "Ausência de vegetação", "Degradada", "Preservada", "Antropizada", "Capoeira", "Árvores isoladas", "Rasteira", "Arbustiva", "Arbórea"] },
        ],
      },
      {
        id: "obstrucoes",
        title: "Obstruções naturais",
        fields: [
          { id: "obstrucoes", label: "Obstruções identificadas", type: "button-select", multi: true, allowOther: true, options: ["Córrego", "Nascente", "Poço", "Aluvião", "Pedras", "Talude", "Lago/Açude", "Mata ciliar"] },
        ],
      },
      {
        id: "construcoes",
        title: "Construções existentes",
        fields: [
          {
            id: "construcoes",
            label: "Construções existentes",
            type: "repeater",
            addItemLabel: "Adicionar construção",
            itemFields: [
              { id: "tipo", label: "Tipo", type: "button-select", allowOther: true, options: ["Galpão", "Sede", "Poço", "Barragem", "Curral", "Caixa d'água", "Escritório", "Depósito", "Área coberta", "Banheiro", "Casa", "Muro", "Cerca"] },
              { id: "quantidade", label: "Quantidade", type: "number", decimal: false },
              { id: "area", label: "Área aproximada", type: "number", unit: "m²" },
            ],
          },
        ],
      },
      {
        id: "entorno",
        title: "Entorno",
        fields: [
          { id: "entorno_empresa", label: "Caracterização da área do entorno", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "agua",
    title: "Água, Captação, Reservatório e Uso",
    description: "Fontes, consumo, reservatório, uso da água e situação de outorga.",
    fields: [],
    purposes: ["projeto", "outorga", "monitoramento"],
    subgroups: [
      {
        id: "corpo_hidrico",
        title: "Corpo hídrico",
        fields: [
          { id: "corpo_hidrico", label: "Existe corpo hídrico receptor?", type: "button-select", options: ["Sim", "Não"] },
          { id: "nascente", label: "Há nascente?", type: "button-select", options: ["Sim", "Não"], showIf: { field: "corpo_hidrico", equals: "Sim" } },
          { id: "corpo_hidrico_desc", label: "Identificação (nome / tipo)", type: "text", showIf: { field: "corpo_hidrico", equals: "Sim" } },
          { id: "distancia_corpo", label: "Distância do corpo hídrico", type: "number", unit: "m", showIf: { field: "corpo_hidrico", equals: "Sim" } },
          { id: "dentro_propriedade", label: "Localização", type: "button-select", options: ["Dentro da propriedade", "Fora da propriedade"], showIf: { field: "corpo_hidrico", equals: "Sim" } },
        ],
      },
      {
        id: "captacao",
        title: "Captação de água",
        fields: [
          { id: "tipo_captacao", label: "Tipo(s) de captação", type: "button-select", multi: true, options: ["Superficial", "Subterrânea", "Rede pública", "Caminhão pipa", "Reuso"] },
          { id: "fornecedor_publico", label: "Concessionária (se rede pública)", type: "text", showIf: { field: "tipo_captacao", in: ["Rede pública"] } },
          { id: "consumo", label: "Estimativa de consumo", type: "number", unit: "m³/dia" },
        ],
      },
      {
        id: "reservatorio",
        title: "Reservatório de água",
        fields: [
          { id: "tem_reservatorio", label: "Possui reservatório?", type: "button-select", options: ["Sim", "Não"] },
          {
            id: "reservatorios",
            label: "Reservatórios",
            type: "repeater",
            addItemLabel: "Adicionar reservatório",
            showIf: { field: "tem_reservatorio", equals: "Sim" },
            itemFields: [
              { id: "tipo", label: "Tipo", type: "button-select", allowOther: true, options: ["Caixa elevada", "Cisterna", "Tanque", "Reservatório de fibra", "Reservatório metálico"] },
              { id: "capacidade", label: "Capacidade", type: "number", unit: "L", presets: [500, 1000, 2000, 5000, 10000, 20000] },
              { id: "quantidade", label: "Quantidade", type: "number", decimal: false },
            ],
          },
        ],
      },
      {
        id: "uso",
        title: "Uso da água",
        fields: [
          { id: "usos_agua", label: "Tipos de uso", type: "button-select", multi: true, allowOther: true, options: ["Consumo humano", "Sanitário", "Processo industrial", "Limpeza", "Irrigação", "Resfriamento", "Dessedentação animal", "Lavagem de veículos", "Combate a incêndio"] },
        ],
      },
      {
        id: "outorga_situacao",
        title: "Situação de outorga",
        fields: [
          { id: "outorga_status", label: "Situação", type: "button-select", options: ["Outorga", "Dispensa de outorga", "Não possui", "Em andamento"] },
          { id: "outorga_numero", label: "Número da outorga / processo", type: "text" },
          { id: "outorga_validade", label: "Validade da outorga", type: "date" },
        ],
      },
    ],
  },
  {
    id: "pocos",
    title: "Poços",
    description: "Dados técnicos do poço, bomba, captação e uso.",
    fields: [],
    purposes: ["outorga", "vazao", "monitoramento"],
    subgroups: [
      {
        id: "coords_poco",
        title: "Coordenadas do poço",
        fields: [
          { id: "coord_poco", label: "Coordenadas (latitude / longitude)", type: "coords" },
        ],
      },
      {
        id: "caracteristicas",
        title: "Características do poço",
        fields: [
          { id: "profundidade", label: "Profundidade", type: "number", unit: "m" },
          { id: "diametro", label: "Diâmetro", type: "number", unit: "mm" },
          { id: "nivel_estatico", label: "Nível estático", type: "number", unit: "m" },
          { id: "nivel_dinamico", label: "Nível dinâmico", type: "number", unit: "m" },
          { id: "poco_obs", label: "Observações do poço", type: "textarea" },
        ],
      },
      {
        id: "bomba",
        title: "Dados da bomba",
        fields: [
          { id: "bomba_cv", label: "Potência (CV)", type: "number", unit: "CV" },
          { id: "bomba_marca", label: "Marca", type: "text" },
          { id: "bomba_modelo", label: "Modelo", type: "text" },
        ],
      },
      {
        id: "vazao_captacao",
        title: "Captação e vazão",
        fields: [
          { id: "vazao_poco", label: "Vazão produzida pelo poço", type: "number", unit: "m³/h" },
          { id: "vazao_requerida", label: "Vazão requerida/dia", type: "number", unit: "m³/dia" },
          { id: "tempo_captacao", label: "Tempo de captação", type: "number", unit: "h/dia" },
        ],
      },
    ],
  },
  {
    id: "vazao",
    title: "Medição de Vazão",
    description: "Registro técnico da seção: largura, comprimento, profundidades e tempos.",
    fields: [],
    purposes: ["vazao"],
    subgroups: [
      {
        id: "descricao_tecnica",
        title: "Descrição técnica",
        fields: [
          { id: "descricao_assuntos", label: "Descrição dos assuntos abordados", type: "textarea" },
        ],
      },
      {
        id: "largura",
        title: "Largura da seção",
        fields: [
          { id: "largura_inicio", label: "Largura no início", type: "number", unit: "m" },
          { id: "largura_meio", label: "Largura no meio", type: "number", unit: "m" },
          { id: "largura_fim", label: "Largura no fim", type: "number", unit: "m" },
        ],
      },
      {
        id: "comprimento_area",
        title: "Comprimento e área",
        fields: [
          { id: "comprimento", label: "Comprimento", type: "number", unit: "m" },
          { id: "area_secao", label: "Área da seção", type: "number", unit: "m²" },
        ],
      },
      {
        id: "prof_inicio",
        title: "Profundidades no início",
        fields: [
          { id: "p1", label: "P1", type: "number", unit: "m" },
          { id: "p2", label: "P2", type: "number", unit: "m" },
          { id: "p3", label: "P3", type: "number", unit: "m" },
        ],
      },
      {
        id: "prof_meio",
        title: "Profundidades no meio",
        fields: [
          { id: "p4", label: "P4", type: "number", unit: "m" },
          { id: "p5", label: "P5", type: "number", unit: "m" },
          { id: "p6", label: "P6", type: "number", unit: "m" },
        ],
      },
      {
        id: "prof_fim",
        title: "Profundidades no fim",
        fields: [
          { id: "p7", label: "P7", type: "number", unit: "m" },
          { id: "p8", label: "P8", type: "number", unit: "m" },
          { id: "p9", label: "P9", type: "number", unit: "m" },
        ],
      },
      {
        id: "tempos",
        title: "Velocidade / Tempo",
        fields: [
          { id: "t1", label: "T1", type: "number", unit: "s" },
          { id: "t2", label: "T2", type: "number", unit: "s" },
          { id: "t3", label: "T3", type: "number", unit: "s" },
          { id: "t4", label: "T4", type: "number", unit: "s" },
          { id: "t5", label: "T5", type: "number", unit: "s" },
        ],
      },
      {
        id: "obs",
        title: "Observações",
        fields: [
          { id: "obs_vazao", label: "Observações técnicas da medição", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "outorga",
    title: "Outorga (dados específicos)",
    description: "Dados complementares para o processo de outorga.",
    fields: [],
    purposes: ["outorga"],
    subgroups: [
      {
        id: "situacao",
        title: "Situação do processo",
        fields: [
          { id: "outorga_situacao", label: "Situação atual", type: "select", options: ["Não iniciado", "Em elaboração", "Protocolado", "Concedido", "Renovação", "Indeferido"] },
          { id: "outorga_orgao", label: "Órgão responsável", type: "text" },
          { id: "outorga_protocolo", label: "Nº protocolo / processo", type: "text" },
          { id: "outorga_data_protocolo", label: "Data de protocolo", type: "date" },
          { id: "outorga_validade", label: "Validade", type: "date" },
        ],
      },
      {
        id: "finalidade",
        title: "Finalidade da outorga",
        fields: [
          { id: "finalidade", label: "Finalidade do uso", type: "multiselect", options: ["Abastecimento humano", "Industrial", "Irrigação", "Dessedentação animal", "Lançamento de efluentes", "Outro"] },
          { id: "finalidade_obs", label: "Detalhamento da finalidade", type: "textarea" },
        ],
      },
      {
        id: "captacao_outorga",
        title: "Captação solicitada",
        fields: [
          { id: "vazao_solicitada", label: "Vazão solicitada", type: "number", unit: "m³/h" },
          { id: "volume_diario", label: "Volume diário", type: "number", unit: "m³/dia" },
          { id: "tempo_diario", label: "Tempo de captação diário", type: "number", unit: "h/dia" },
          { id: "dias_mes", label: "Dias de captação por mês", type: "number" },
        ],
      },
      {
        id: "obs_outorga",
        title: "Observações",
        fields: [
          { id: "outorga_obs", label: "Observações gerais", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "ete",
    title: "ETE e Efluentes",
    description: "Estação de Tratamento de Efluentes: existência, operação, produtos e treinamento.",
    fields: [],
    purposes: ["acompanhamento", "monitoramento", "projeto"],
    subgroups: [
      {
        id: "existencia",
        title: "Existência da ETE",
        fields: [
          { id: "possui_ete", label: "Possui ETE?", type: "button-select", options: ["Tem ETE", "Não tem ETE", "Esperando obra", "Esperando reforma", "Em projeto"] },
        ],
      },
      {
        id: "operacao",
        title: "Operação da ETE",
        description: "Preencher se possui ETE.",
        fields: [
          { id: "problema_ete", label: "Algum problema na operação da ETE?", type: "button-select", options: ["Sim", "Não", "Não se aplica"] },
          { id: "problema_ete_desc", label: "Descrição do problema", type: "textarea", showIf: { field: "problema_ete", equals: "Sim" } },
          { id: "funcionamento_ete", label: "Funcionamento da ETE", type: "button-select", options: ["Adequado", "Com problemas", "Parada"] },
        ],
      },
      {
        id: "produtos",
        title: "Produtos utilizados na ETE",
        fields: [
          {
            id: "produtos_ete_lista",
            label: "Produtos utilizados",
            type: "repeater",
            addItemLabel: "Adicionar produto",
            itemFields: [
              { id: "nome", label: "Produto", type: "button-select", allowOther: true, options: ["Cloro em pó", "Cal", "Alcalinizante", "Coagulante", "Floculante", "Reagente biológico", "Não utiliza"] },
              { id: "quantidade", label: "Quantidade / dose", type: "text" },
            ],
          },
        ],
      },
      {
        id: "treinamento",
        title: "Treinamento de operador",
        fields: [
          { id: "treinamento_ete", label: "Há necessidade de treinar um novo operador?", type: "button-select", options: ["Sim", "Não", "Não se aplica ainda"] },
        ],
      },
      {
        id: "tratamento_efluentes",
        title: "Tratamento de efluentes",
        fields: [
          { id: "ha_tratamento", label: "Há tratamento de efluentes?", type: "button-select", options: ["Sim", "Não", "Precisará de projeto", "Não está funcionando"] },
          { id: "tipo_efluente", label: "Tipo de efluente", type: "button-select", multi: true, allowOther: true, options: ["Industrial", "Doméstico", "ETE", "Fossa séptica", "Sumidouro", "Reuso", "Lançamento em corpo hídrico", "Rede pública"] },
        ],
      },
    ],
  },
  {
    id: "emissoes",
    title: "Emissões",
    description: "Ruídos, emissões líquidas, sólidas e gasosas.",
    fields: [],
    purposes: ["projeto", "acompanhamento"],
    subgroups: [
      {
        id: "ruidos",
        title: "Ruídos",
        fields: [
          { id: "ruidos_status", label: "Situação", type: "button-select", options: ["Houve teste", "Falta fazer", "Não se aplica"] },
        ],
      },
      {
        id: "liquidos",
        title: "Emissões líquidas",
        fields: [
          { id: "tipo_efluente_liquido", label: "Tipo de efluente líquido", type: "button-select", multi: true, allowOther: true, options: ["Industrial", "Doméstico", "ETE", "Fossa séptica", "Sumidouro", "Rede pública", "Reuso"] },
        ],
      },
      {
        id: "solidos",
        title: "Emissões sólidas",
        fields: [
          { id: "destinacao_solidos", label: "Destinação dos sólidos", type: "button-select", multi: true, allowOther: true, options: ["Coleta pública", "Empresa terceirizada", "Mistura com demais resíduos", "Reciclagem", "Aterro próprio", "Compostagem"] },
        ],
      },
      {
        id: "gasosos",
        title: "Emissões gasosas",
        fields: [
          { id: "emissao_gasosa", label: "Existência de emissão gasosa", type: "button-select", multi: true, options: ["Há chaminé", "Há emissão difusa", "Vapor", "Material particulado", "Não se aplica"] },
        ],
      },
    ],
  },
  {
    id: "processo",
    title: "Processo Produtivo",
    description: "Levantamento técnico: matéria-prima, equipamentos, etapas, químicos e frota.",
    fields: [],
    purposes: ["projeto"],
    subgroups: [
      {
        id: "materia_prima",
        title: "Matéria-prima",
        fields: [
          {
            id: "materias_primas",
            label: "Matérias-primas utilizadas",
            type: "repeater",
            addItemLabel: "Adicionar matéria-prima",
            itemFields: [
              { id: "nome", label: "Nome", type: "text" },
              { id: "quantidade", label: "Quantidade", type: "text" },
              { id: "periodicidade", label: "Periodicidade", type: "button-select", allowOther: true, options: ["Diária", "Semanal", "Mensal", "Anual"] },
            ],
          },
        ],
      },
      {
        id: "equipamentos",
        title: "Equipamentos",
        fields: [
          {
            id: "equipamentos",
            label: "Equipamentos existentes",
            type: "repeater",
            addItemLabel: "Adicionar equipamento",
            itemFields: [
              { id: "nome", label: "Nome", type: "text" },
              { id: "quantidade", label: "Quantidade", type: "number", decimal: false },
              { id: "especificacoes", label: "Especificações (opcional)", type: "text" },
            ],
          },
        ],
      },
      {
        id: "etapas",
        title: "Etapas do processo produtivo",
        fields: [
          {
            id: "etapas",
            label: "Etapas",
            type: "repeater",
            addItemLabel: "Adicionar etapa",
            itemFields: [
              { id: "nome", label: "Nome da etapa", type: "text" },
              { id: "descricao", label: "Descrição (opcional)", type: "textarea" },
            ],
          },
        ],
      },
      {
        id: "quimicos",
        title: "Produtos químicos",
        fields: [
          { id: "produtos_quimicos", label: "Produtos químicos utilizados", type: "button-select", multi: true, allowOther: true, options: ["Cloro", "Soda cáustica", "Ácido sulfúrico", "Ácido clorídrico", "Solventes", "Tintas", "Óleos", "Detergentes", "Hipoclorito"] },
        ],
      },
      {
        id: "frota",
        title: "Frota",
        fields: [
          { id: "tem_frota", label: "Possui frota de veículos?", type: "button-select", options: ["Sim", "Não"] },
          {
            id: "frota",
            label: "Veículos",
            type: "repeater",
            addItemLabel: "Adicionar veículo",
            showIf: { field: "tem_frota", equals: "Sim" },
            itemFields: [
              { id: "tipo", label: "Tipo", type: "button-select", allowOther: true, options: ["Carro", "Moto", "Caminhão", "Caminhonete", "Van", "Empilhadeira", "Trator"] },
              { id: "quantidade", label: "Quantidade", type: "number", decimal: false },
              { id: "descricao", label: "Descrição (opcional)", type: "text" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "residuos",
    title: "Resíduos Sólidos",
    description: "Tipos de resíduos gerados, gerenciamento e coleta.",
    fields: [],
    purposes: ["projeto", "acompanhamento", "monitoramento"],
    subgroups: [
      {
        id: "tipos",
        title: "Tipos de resíduos gerados",
        fields: [
          { id: "tipos", label: "Categorias geradas", type: "multiselect", options: ["Papel", "Plástico", "Vidro", "Metal", "Orgânicos", "Perigosos", "Outros"] },
        ],
      },
      {
        id: "papel",
        title: "Papel",
        fields: [
          { id: "papel_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "papel_periodo", label: "Período / frequência", type: "text" },
          { id: "papel_acond", label: "Acondicionamento", type: "text" },
          { id: "papel_destino", label: "Destinação", type: "text" },
          { id: "papel_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "plastico",
        title: "Plástico",
        fields: [
          { id: "plastico_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "plastico_periodo", label: "Período / frequência", type: "text" },
          { id: "plastico_acond", label: "Acondicionamento", type: "text" },
          { id: "plastico_destino", label: "Destinação", type: "text" },
          { id: "plastico_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "vidro",
        title: "Vidro",
        fields: [
          { id: "vidro_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "vidro_periodo", label: "Período / frequência", type: "text" },
          { id: "vidro_acond", label: "Acondicionamento", type: "text" },
          { id: "vidro_destino", label: "Destinação", type: "text" },
          { id: "vidro_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "metal",
        title: "Metal",
        fields: [
          { id: "metal_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "metal_periodo", label: "Período / frequência", type: "text" },
          { id: "metal_acond", label: "Acondicionamento", type: "text" },
          { id: "metal_destino", label: "Destinação", type: "text" },
          { id: "metal_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "organicos",
        title: "Orgânicos",
        fields: [
          { id: "org_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "org_periodo", label: "Período / frequência", type: "text" },
          { id: "org_acond", label: "Acondicionamento", type: "text" },
          { id: "org_destino", label: "Destinação", type: "text" },
          { id: "org_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "perigosos",
        title: "Perigosos",
        fields: [
          { id: "per_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "per_periodo", label: "Período / frequência", type: "text" },
          { id: "per_acond", label: "Acondicionamento", type: "text" },
          { id: "per_destino", label: "Destinação", type: "text" },
          { id: "per_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "outros",
        title: "Outros resíduos",
        fields: [
          { id: "outros_desc", label: "Descrição do resíduo", type: "text" },
          { id: "outros_qtd", label: "Quantidade", type: "number", unit: "kg" },
          { id: "outros_periodo", label: "Período / frequência", type: "text" },
          { id: "outros_acond", label: "Acondicionamento", type: "text" },
          { id: "outros_destino", label: "Destinação", type: "text" },
          { id: "outros_coletor", label: "Quem coleta", type: "text" },
        ],
      },
      {
        id: "coleta",
        title: "Coleta de resíduos",
        fields: [
          { id: "coleta_tipo", label: "Como se aplica a coleta", type: "multiselect", options: ["Coleta pública", "Empresa terceirizada", "Outro"] },
          { id: "empresa_coleta", label: "Empresa terceirizada (nome / CNPJ)", type: "text" },
          { id: "outro_coleta", label: "Outro tipo de coleta (especificar)", type: "text" },
          { id: "periodicidade", label: "Periodicidade geral da coleta", type: "text" },
        ],
      },
      {
        id: "gerenciamento",
        title: "Gerenciamento de resíduos sólidos",
        fields: [
          { id: "gerenciamento", label: "Está ocorrendo de forma correta?", type: "select", options: ["Sim", "Não", "Falta estruturar", "Precisa de local adequado", "Não há lixeiras suficientes", "Não se aplica"] },
          { id: "lixeiras", label: "As lixeiras estão sendo utilizadas adequadamente?", type: "select", options: ["Sim", "Não", "Parcialmente", "Faltam lixeiras", "Não foi avaliado"] },
          { id: "dificuldade_coleta", label: "Alguma dificuldade na coleta?", type: "select", options: ["Sim", "Não"] },
          { id: "dificuldade_coleta_desc", label: "Descrição da dificuldade", type: "textarea" },
          { id: "gerenciamento_obs", label: "Observações", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "politica",
    title: "Política e Gestão Ambiental",
    description: "Atendimento à política ambiental, educação ambiental e demandas de projeto.",
    fields: [],
    purposes: ["acompanhamento", "monitoramento"],
    subgroups: [
      {
        id: "respeito",
        title: "Respeito à política ambiental",
        fields: [
          { id: "politica_status", label: "A política ambiental está sendo respeitada pelos colaboradores?", type: "select", options: ["Sim", "Não", "Parcialmente", "Em implantação", "Falta mais avisos", "Não há política", "Não foi avaliado"] },
          { id: "politica_obs", label: "Observações", type: "textarea" },
        ],
      },
      {
        id: "coleta_recicl",
        title: "Coleta de resíduos recicláveis e não recicláveis",
        fields: [
          { id: "coleta_recicl_status", label: "Está sendo realizada?", type: "select", options: ["Sim", "Não", "Parcialmente", "Em fase de contratação", "Não há", "Não se aplica a essa visita"] },
        ],
      },
      {
        id: "educacao",
        title: "Educação ambiental",
        fields: [
          { id: "educacao_status", label: "Há necessidade de novas palestras?", type: "select", options: ["Sim", "Não", "Houve agendamento", "Não se aplica", "Não há perspectiva no momento", "Irá contactar o escritório havendo necessidade"] },
          { id: "palestras", label: "Palestras / orientações realizadas", type: "textarea" },
        ],
      },
      {
        id: "demandas",
        title: "Levantamento de informações para projeto",
        fields: [
          { id: "ha_demanda_projeto", label: "Há levantamento de informações para projeto?", type: "select", options: ["Sim", "Não"] },
          { id: "tipo_demanda", label: "Tipo(s) de demanda / documento", type: "multiselect", options: ["OUTORGA", "PEA", "CAR", "PCA", "RCA", "PGRS", "RIAA"] },
          { id: "demanda_obs", label: "Observações sobre a demanda", type: "textarea" },
        ],
      },
      {
        id: "conformidade",
        title: "Conformidade operacional",
        fields: [
          { id: "conformidade", label: "Observações de conformidade", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "rotinas",
    title: "Rotinas de Monitoramento",
    description: "Hidrômetro, coletas de água, coletas de efluente e acompanhamento operacional.",
    fields: [],
    purposes: ["monitoramento", "acompanhamento"],
    subgroups: [
      {
        id: "hidrometro",
        title: "Leitura do hidrômetro",
        fields: [
          { id: "hidrometro_status", label: "Está havendo leitura diária do hidrômetro?", type: "select", options: ["Sim", "Não", "Não há tabela", "Não se aplica", "O colaborador não está fazendo o acompanhamento"] },
          { id: "hidrometro", label: "Leitura registrada nesta visita", type: "text" },
          { id: "hidrometro_obs", label: "Observações", type: "textarea" },
        ],
      },
      {
        id: "coleta_agua",
        title: "Coleta de água do poço",
        fields: [
          { id: "coleta_agua_visita", label: "Houve coleta de água do poço para análise nesta visita?", type: "select", options: ["Sim", "Não"] },
          { id: "coletas_agua", label: "Detalhes da coleta", type: "textarea" },
        ],
      },
      {
        id: "coleta_efluente",
        title: "Coleta de efluente na ETE",
        fields: [
          { id: "coleta_efluente_visita", label: "Houve coleta de efluente na ETE para análise nesta visita?", type: "select", options: ["Sim", "Não"] },
          { id: "coletas_efluente", label: "Detalhes da coleta", type: "textarea" },
        ],
      },
      {
        id: "acompanhamento",
        title: "Acompanhamento operacional",
        fields: [
          { id: "acompanhamento_ete", label: "Acompanhamento da ETE", type: "textarea" },
          { id: "acompanhamento_obs", label: "Outras rotinas observadas", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "vizinhanca",
    title: "Vizinhança e Entorno",
    description: "Terrenos vizinhos por posição, mercado local e obras próximas.",
    fields: [],
    purposes: ["projeto"],
    subgroups: [
      {
        id: "viz_fundos",
        title: "Vizinho — Fundos",
        fields: [
          { id: "vf_material", label: "Material", type: "select", options: ["Madeira", "Alvenaria", "Misto", "Outro"] },
          { id: "vf_estado", label: "Estado", type: "select", options: ["Bom", "Ruim"] },
          { id: "vf_pavs", label: "Nº de pavimentos", type: "number" },
          { id: "vf_habitado", label: "Habitado?", type: "boolean" },
          { id: "vf_utilizacao", label: "Utilização", type: "select", options: ["Industrial", "Comercial", "Habitacional", "Misto"] },
          { id: "vf_classe", label: "Classe social", type: "select", options: ["Alta", "Média", "Baixa"] },
          { id: "vf_posicao", label: "Posição", type: "select", options: ["Afastada", "Próxima", "Encostada"] },
          { id: "vf_reforco", label: "Necessita reforço?", type: "boolean" },
        ],
      },
      {
        id: "viz_dir",
        title: "Vizinho — Lateral direita",
        fields: [
          { id: "vd_material", label: "Material", type: "select", options: ["Madeira", "Alvenaria", "Misto", "Outro"] },
          { id: "vd_estado", label: "Estado", type: "select", options: ["Bom", "Ruim"] },
          { id: "vd_pavs", label: "Nº de pavimentos", type: "number" },
          { id: "vd_habitado", label: "Habitado?", type: "boolean" },
          { id: "vd_utilizacao", label: "Utilização", type: "select", options: ["Industrial", "Comercial", "Habitacional", "Misto"] },
          { id: "vd_classe", label: "Classe social", type: "select", options: ["Alta", "Média", "Baixa"] },
          { id: "vd_posicao", label: "Posição", type: "select", options: ["Afastada", "Próxima", "Encostada"] },
          { id: "vd_reforco", label: "Necessita reforço?", type: "boolean" },
        ],
      },
      {
        id: "viz_esq",
        title: "Vizinho — Lateral esquerda",
        fields: [
          { id: "ve_material", label: "Material", type: "select", options: ["Madeira", "Alvenaria", "Misto", "Outro"] },
          { id: "ve_estado", label: "Estado", type: "select", options: ["Bom", "Ruim"] },
          { id: "ve_pavs", label: "Nº de pavimentos", type: "number" },
          { id: "ve_habitado", label: "Habitado?", type: "boolean" },
          { id: "ve_utilizacao", label: "Utilização", type: "select", options: ["Industrial", "Comercial", "Habitacional", "Misto"] },
          { id: "ve_classe", label: "Classe social", type: "select", options: ["Alta", "Média", "Baixa"] },
          { id: "ve_posicao", label: "Posição", type: "select", options: ["Afastada", "Próxima", "Encostada"] },
          { id: "ve_reforco", label: "Necessita reforço?", type: "boolean" },
        ],
      },
      {
        id: "laudo",
        title: "Laudo técnico",
        fields: [
          { id: "necessita_laudo", label: "Há necessidade de laudo técnico dos prédios vizinhos?", type: "boolean" },
          { id: "laudo_obs", label: "Observações", type: "textarea" },
        ],
      },
      {
        id: "mercado",
        title: "Mercado local",
        fields: [
          { id: "mercado_local", label: "Itens disponíveis na região", type: "multiselect", options: ["Hospital", "Escola", "Universidade", "Shopping", "Farmácia", "Concretaria", "Supermercado", "Pedreira", "Casas para república", "Mão de obra administrativa", "Mão de obra operários"] },
          { id: "mercado_obs", label: "Observações sobre o mercado local", type: "textarea" },
        ],
      },
      {
        id: "obras",
        title: "Obras próximas",
        fields: [
          { id: "tipo_obra", label: "Tipo de obra próxima", type: "text" },
          { id: "obras_proximas", label: "Observações", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "infraestrutura",
    title: "Acesso e Infraestrutura Pública",
    description: "Acesso por posição do terreno e infraestrutura pública disponível.",
    fields: [],
    purposes: ["projeto"],
    subgroups: [
      {
        id: "acesso_frente",
        title: "Acesso — Frente",
        fields: [
          { id: "af_descricao", label: "Descrição do acesso", type: "text" },
          { id: "af_pavimentacao", label: "Tipo de pavimentação", type: "select", options: ["Asfalto", "Paralelepípedo", "Terra", "Concreto", "Inexistente"] },
          { id: "af_rua", label: "Nome da rua", type: "text" },
        ],
      },
      {
        id: "acesso_fundos",
        title: "Acesso — Fundos",
        fields: [
          { id: "afu_descricao", label: "Descrição do acesso", type: "text" },
          { id: "afu_pavimentacao", label: "Tipo de pavimentação", type: "select", options: ["Asfalto", "Paralelepípedo", "Terra", "Concreto", "Inexistente"] },
          { id: "afu_rua", label: "Nome da rua", type: "text" },
        ],
      },
      {
        id: "acesso_dir",
        title: "Acesso — Lado direito",
        fields: [
          { id: "ad_descricao", label: "Descrição do acesso", type: "text" },
          { id: "ad_pavimentacao", label: "Tipo de pavimentação", type: "select", options: ["Asfalto", "Paralelepípedo", "Terra", "Concreto", "Inexistente"] },
          { id: "ad_rua", label: "Nome da rua", type: "text" },
        ],
      },
      {
        id: "acesso_esq",
        title: "Acesso — Lado esquerdo",
        fields: [
          { id: "ae_descricao", label: "Descrição do acesso", type: "text" },
          { id: "ae_pavimentacao", label: "Tipo de pavimentação", type: "select", options: ["Asfalto", "Paralelepípedo", "Terra", "Concreto", "Inexistente"] },
          { id: "ae_rua", label: "Nome da rua", type: "text" },
        ],
      },
      {
        id: "publica",
        title: "Infraestrutura pública",
        fields: [
          { id: "infra_servicos", label: "Serviços disponíveis", type: "multiselect", options: ["Abastecimento de água", "Energia elétrica", "Coleta de lixo", "Iluminação pública", "Rede de esgoto", "Telefone", "Rede de drenagem pluvial", "Alta tensão"] },
          { id: "infra_obs", label: "Observações sobre a infraestrutura", type: "textarea" },
        ],
      },
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
    description: "Croqui do local com legenda e elementos representados.",
    fields: [],
    subgroups: [
      {
        id: "desenho",
        title: "Desenho",
        fields: [
          { id: "legenda", label: "Legenda do croqui", type: "textarea" },
          { id: "escala", label: "Escala / referência", type: "text" },
        ],
      },
      {
        id: "elementos",
        title: "Elementos representados",
        fields: [
          { id: "elementos", label: "Elementos representados (árvores, edificações, poços, acessos, etc.)", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "documentos",
    title: "Documentos e Anexos",
    description: "Documentos entregues, solicitados e checklist de documentação.",
    fields: [],
    subgroups: [
      {
        id: "entrega",
        title: "Documento entregue na visita",
        fields: [
          { id: "doc_entregue_visita", label: "Foi entregue algum documento nesta visita?", type: "select", options: ["Sim", "Não"] },
          { id: "entregues", label: "Documentos entregues (descrição)", type: "textarea", showIf: { field: "doc_entregue_visita", equals: "Sim" } },
        ],
      },
      {
        id: "solicitacao",
        title: "Documentos solicitados",
        fields: [
          { id: "solicitados", label: "Documentos solicitados ao cliente", type: "textarea" },
          { id: "solicitar_doc_empresa", label: "Solicitar cópias da documentação da empresa?", type: "boolean" },
        ],
      },
      {
        id: "orientacao",
        title: "Orientação técnica",
        fields: [
          { id: "orientacao_status", label: "Houve orientação do técnico sobre as pendências ambientais?", type: "select", options: ["Sim", "Não", "No aguardo do posicionamento da empresa", "Ficamos de enviar um relatório", "O colaborador ficou de enviar à diretoria"] },
          { id: "orientacao_obs", label: "Observações", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "observacoes",
    title: "Observações Técnicas",
    description: "Registros complementares e pendências observadas.",
    fields: [],
    subgroups: [
      {
        id: "gerais",
        title: "Observações gerais",
        fields: [
          { id: "obs_gerais", label: "Observações gerais", type: "textarea" },
        ],
      },
      {
        id: "pendencias",
        title: "Pendências observadas",
        fields: [
          { id: "pendencias_observadas", label: "Pendências observadas em campo", type: "textarea" },
          { id: "responsavel_pendencias", label: "Responsável pelas pendências", type: "text" },
        ],
      },
      {
        id: "complementares",
        title: "Informações complementares",
        fields: [
          { id: "info_complementares", label: "Informações complementares (escritório, retorno, etc.)", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "validacao",
    title: "Validação e Encerramento",
    fields: [
      { id: "hora_saida", label: "Horário de saída", type: "time" },
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
    "politica", "rotinas", "infraestrutura", "vizinhanca", "croqui", "fotos",
    "documentos", "observacoes", "validacao",
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
    "pocos", "outorga", "operacionais", "documentos", "observacoes", "fotos", "validacao",
  ],
  terreno: [
    "identificacao", "empreendimento", "localizacao", "areas", "infraestrutura",
    "vizinhanca", "croqui", "fotos", "observacoes", "validacao",
  ],
};

const MODULES_INDEX = new Map(MODULES.map((module) => [module.id, module]));

const MODULES_BY_TYPE_CACHE: Record<SurveyType, typeof MODULES> = {
  geral: MODULES_BY_TYPE.geral.map((id) => MODULES_INDEX.get(id)!).filter(Boolean),
  ambiental: MODULES_BY_TYPE.ambiental.map((id) => MODULES_INDEX.get(id)!).filter(Boolean),
  vazao: MODULES_BY_TYPE.vazao.map((id) => MODULES_INDEX.get(id)!).filter(Boolean),
  outorga: MODULES_BY_TYPE.outorga.map((id) => MODULES_INDEX.get(id)!).filter(Boolean),
  terreno: MODULES_BY_TYPE.terreno.map((id) => MODULES_INDEX.get(id)!).filter(Boolean),
};

export function getModulesForType(type: SurveyType) {
  return MODULES_BY_TYPE_CACHE[type];
}

/** Avaliador de regra `showIf` para campos condicionais. */
export function shouldShowField(field: FieldDef, values: Record<string, unknown>): boolean {
  const rule = field.showIf;
  if (!rule) return true;
  const v = values[rule.field];
  if (rule.equals !== undefined) return v === rule.equals;
  if (rule.in && rule.in.length) {
    if (Array.isArray(v)) return v.some((x) => rule.in!.includes(x));
    return rule.in.includes(v as unknown);
  }
  if (rule.truthy) {
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v);
  }
  return true;
}

function fieldHasValue(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    // hours-presets: tem preset ou turnos preenchidos
    const o = v as Record<string, unknown>;
    if (typeof o.preset === "string" && o.preset) return true;
    if (Array.isArray(o.turnos) && (o.turnos as unknown[]).length > 0) return true;
    return Object.values(v as Record<string, unknown>).some((x) => x !== "" && x != null);
  }
  return true;
}

const PENDING_STATUSES = new Set<FieldStatus>([
  "pendente",
  "aguardando_documento",
  "aguardando_empresa",
  "requer_retorno",
]);

/** Lista os campos visíveis de um módulo considerando showIf e subgrupos N/A. */
export function visibleFieldsOfModule(
  m: ModuleDef,
  values: Record<string, unknown>,
  naSubgroups?: Record<string, boolean>,
): FieldDef[] {
  const out: FieldDef[] = [];
  for (const f of m.fields) if (shouldShowField(f, values)) out.push(f);
  for (const sg of m.subgroups ?? []) {
    if (naSubgroups?.[sg.id]) continue;
    for (const f of sg.fields) if (shouldShowField(f, values)) out.push(f);
  }
  return out;
}

/** Status efetivo do módulo (ignora `state.status` armazenado, exceto para módulos centrais sem campos). */
export function computeModuleStatus(m: ModuleDef, state: ModuleState): FieldStatus {
  if (state.naModule) return "nao_se_aplica";
  if (state.moduleDone) return "concluido";

  const visible = visibleFieldsOfModule(m, state.values, state.naSubgroups);

  // Pendência declarada em qualquer campo já marca o módulo como pendente.
  for (const f of visible) {
    const fs = state.fieldStatus[f.id];
    if (fs && PENDING_STATUSES.has(fs)) return "pendente";
  }

  if (visible.length === 0) {
    // módulos só com ações (ex.: validação) — preserva status manual
    return state.status ?? "nao_iniciado";
  }

  let filled = 0;
  for (const f of visible) {
    if (state.nonApplicable?.[f.id]) { filled++; continue; }
    if (fieldHasValue(state.values[f.id])) filled++;
  }

  if (filled === visible.length) return "concluido";
  if (filled > 0) return "em_andamento";
  return "nao_iniciado";
}

/** Status efetivo de um subgrupo. */
export function computeSubgroupStatus(sg: SubgroupDef, state: ModuleState): FieldStatus {
  if (state.naSubgroups?.[sg.id]) return "nao_se_aplica";
  const visible = sg.fields.filter((f) => shouldShowField(f, state.values));
  if (!visible.length) return "nao_iniciado";

  for (const f of visible) {
    const fs = state.fieldStatus[f.id];
    if (fs && PENDING_STATUSES.has(fs)) return "pendente";
  }

  let filled = 0;
  for (const f of visible) {
    if (state.nonApplicable?.[f.id]) { filled++; continue; }
    if (fieldHasValue(state.values[f.id])) filled++;
  }

  if (filled === visible.length) return "concluido";
  if (filled > 0) return "em_andamento";
  return "nao_iniciado";
}

/** Conta de campos preenchidos / total visível em um subgrupo. */
export function subgroupProgress(sg: SubgroupDef, state: ModuleState): { filled: number; total: number; na: number } {
  if (state.naSubgroups?.[sg.id]) return { filled: 0, total: 0, na: 0 };
  const visible = sg.fields.filter((f) => shouldShowField(f, state.values));
  let filled = 0; let na = 0;
  for (const f of visible) {
    if (state.nonApplicable?.[f.id]) { na++; filled++; continue; }
    if (fieldHasValue(state.values[f.id])) filled++;
  }
  return { filled, total: visible.length, na };
}

/** Módulos que ganham aba dedicada centralizada (não aparecem como aba comum). */
export const CENTRAL_TAB_MODULES = new Set(["documentos", "validacao"]);

/** Sugestões de presets de módulos por tipo de levantamento. */
export const MODULE_PRESETS: Record<SurveyType, { all: string[]; minimal: string[] }> = {
  geral: {
    all: MODULES_BY_TYPE.geral,
    minimal: ["identificacao", "empreendimento", "localizacao", "fotos", "documentos", "validacao"],
  },
  ambiental: {
    all: MODULES_BY_TYPE.ambiental,
    minimal: ["identificacao", "ete", "residuos", "rotinas", "fotos", "documentos", "validacao"],
  },
  vazao: { all: MODULES_BY_TYPE.vazao, minimal: MODULES_BY_TYPE.vazao },
  outorga: {
    all: MODULES_BY_TYPE.outorga,
    minimal: ["identificacao", "agua", "pocos", "outorga", "documentos", "validacao"],
  },
  terreno: {
    all: MODULES_BY_TYPE.terreno,
    minimal: ["identificacao", "localizacao", "areas", "fotos", "validacao"],
  },
};

/** Templates de fábrica embutidos por tipo (não removíveis). */
export interface FactoryTemplate { id: string; name: string; type: SurveyType; moduleIds: string[] }

export const FACTORY_TEMPLATES: FactoryTemplate[] = [
  { id: "factory-geral-completo", name: "Completo (todos os módulos)", type: "geral", moduleIds: MODULES_BY_TYPE.geral },
  { id: "factory-geral-essencial", name: "Essencial", type: "geral", moduleIds: ["identificacao","empreendimento","pessoas","operacionais","fotos","documentos","validacao"] },
  { id: "factory-geral-projeto", name: "Foco em Projeto", type: "geral", moduleIds: ["identificacao","empreendimento","pessoas","localizacao","operacionais","areas","agua","processo","emissoes","residuos","croqui","fotos","documentos","validacao"] },
  { id: "factory-ambiental-padrao", name: "Acompanhamento padrão", type: "ambiental", moduleIds: MODULES_BY_TYPE.ambiental },
  { id: "factory-ambiental-curto", name: "Visita curta", type: "ambiental", moduleIds: ["identificacao","ete","residuos","rotinas","fotos","documentos","validacao"] },
  { id: "factory-vazao-padrao", name: "Medição padrão", type: "vazao", moduleIds: MODULES_BY_TYPE.vazao },
  { id: "factory-outorga-padrao", name: "Processo de outorga", type: "outorga", moduleIds: MODULES_BY_TYPE.outorga },
  { id: "factory-outorga-renovacao", name: "Renovação de outorga", type: "outorga", moduleIds: ["identificacao","empreendimento","agua","pocos","outorga","documentos","fotos","validacao"] },
  { id: "factory-terreno-padrao", name: "Visita ao terreno", type: "terreno", moduleIds: MODULES_BY_TYPE.terreno },
];

/** Adapter retrocompatível: gera valores novos a partir dos campos antigos. */
export function ensureLegacyAdapters(modules: Record<string, ModuleState>): Record<string, ModuleState> {
  const out = { ...modules };
  // Pessoas — colaborador
  const pessoas = out.pessoas;
  if (pessoas) {
    const v = { ...pessoas.values };
    let changed = false;
    if (!Array.isArray(v.colaboradores) && (v.colab_nome || v.colab_cargo || v.colab_telefone || v.colab_email)) {
      const p: Person = { id: "legacy-colab", nome: String(v.colab_nome ?? ""), cargo: v.colab_cargo, telefone: v.colab_telefone, email: v.colab_email };
      v.colaboradores = [p];
      changed = true;
    }
    if (!Array.isArray(v.tecnicos) && (v.tec_nome || v.tec_cargo || v.tec_registro || v.tec_telefone || v.tec_email)) {
      const p: Person = { id: "legacy-tec", nome: String(v.tec_nome ?? ""), cargo: v.tec_cargo, registro: v.tec_registro, telefone: v.tec_telefone, email: v.tec_email };
      v.tecnicos = [p];
      changed = true;
    }
    if (!Array.isArray(v.outros_pessoas) && typeof v.outros_presentes === "string" && v.outros_presentes.trim()) {
      v.outros_pessoas = [{ id: "legacy-outros", nome: v.outros_presentes }];
      changed = true;
    }
    if (changed) out.pessoas = { ...pessoas, values: v };
  }
  // Operação — funcionamento
  const oper = out.operacionais;
  if (oper) {
    const v = { ...oper.values };
    if (!v.funcionamento || typeof v.funcionamento !== "object") {
      const hasLegacy = v.horario_inicio || v.horario_fim || v.horario_func || (Array.isArray(v.dias_semana) && v.dias_semana.length);
      if (hasLegacy) {
        const hv: HoursValue = {
          preset: "outro",
          dias: Array.isArray(v.dias_semana) ? (v.dias_semana as string[]) : undefined,
          turnos: v.horario_inicio || v.horario_fim
            ? [{ id: "t1", inicio: String(v.horario_inicio ?? ""), fim: String(v.horario_fim ?? "") }]
            : [],
          observacao: typeof v.horario_func === "string" ? v.horario_func : undefined,
        };
        v.funcionamento = hv;
        out.operacionais = { ...oper, values: v };
      }
    }
  }
  return out;
}