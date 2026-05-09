## Onde paramos

Hoje a plataforma já tem:
- Cadastro básico de Clientes, Projetos e Levantamentos (5 tipos: geral, ambiental, vazão, outorga, terreno).
- 22 módulos preliminares em `src/lib/modules.ts` com campos resumidos.
- Editor modular com status por módulo, renderizador de campos e tela de resumo.
- Persistência local (`localStorage`).

O que falta (foco deste plano):
- Os módulos atuais cobrem só uma fração dos campos das fichas. Faltam dezenas de subgrupos e campos condicionais detalhados nos seis anexos.
- Os cadastros de Cliente, Projeto e Empreendimento estão minimalistas — precisam absorver os campos cadastrais completos (representante legal, endereço fiscal, contatos, atividade etc.).
- Falta lógica condicional (ex.: só pedir dados do poço se captação = subterrânea; só pedir ETE se possui ETE).
- Falta navegação por subgrupos dentro de cada módulo grande.

Fica para DEPOIS deste plano (não tratar agora): exportação, captura de coordenadas GPS, upload de fotos, upload de documentos, assinaturas digitais, áudios.

---

## Fluxo das fases

A cada fase você me envia novamente o(s) anexo(s) indicado(s) e eu implemento só aquela fatia, mantendo o app sempre funcional. Cada fase termina com cadastro/preenchimento testável.

---

## Fase 1 — Reestruturar cadastros e modelo de dados
Anexos a enviar: `📱 Conceito e Funcionalidades` + `🧩 Grupos de Informações`.

Entregáveis:
- Revisar `src/lib/types.ts` para refletir a hierarquia oficial: Cliente → Empreendimento → Projeto → Levantamento (hoje falta Empreendimento como entidade própria).
- Expandir cadastro de Cliente (PF/PJ, contatos múltiplos, representante legal).
- Criar cadastro de Empreendimento vinculado ao cliente (dados cadastrais completos, atividade, endereço, CNAE).
- Ajustar criação de Levantamento para escolher Cliente → Empreendimento → Projeto → Tipo.
- Revisar a lista oficial dos grupos macro (1 a N) conforme o anexo de Grupos.

---

## Fase 2 — Módulos de identificação, pessoas e operação
Anexo a enviar: `📋 Campos Extraídos das Fichas` (seções de identificação, pessoas, operacionais, áreas).

Entregáveis:
- Reescrever os módulos `identificacao`, `empreendimento`, `pessoas`, `operacionais`, `areas` com TODOS os campos e subgrupos das fichas.
- Introduzir suporte a subgrupos dentro de um módulo (accordion/sub-abas).
- Suporte a campos condicionais simples (mostrar/esconder por valor).

---

## Fase 3 — Água, poços e medição de vazão
Anexos a enviar: `💧 Medição de Vazão` + `💧 Outorga` + seções de água/poço de `📋 Campos Extraídos`.

Entregáveis:
- Reescrever módulos `agua`, `pocos`, `vazao` com todos os subgrupos (largura início/meio/fim, profundidades múltiplas por ponto, tempos T1–T5, área calculada).
- Módulo dedicado de Outorga com representante legal, características do poço, bomba, reservatório, captação e uso da água conforme ficha.
- Cálculos automáticos onde a ficha sugere (área de seção, vazão estimada) — apenas cálculo, sem export.
- Listas dinâmicas (adicionar N pontos de profundidade).

---

## Fase 4 — Acompanhamento ambiental (ETE, resíduos, política, rotinas)
Anexo a enviar: `🌱 Acompanhamento Ambiental`.

Entregáveis:
- Reescrever módulos `ete`, `residuos`, `politica`, `rotinas`, `emissoes` com todos os campos do anexo.
- Subgrupos: coleta de recicláveis vs não recicláveis, lixeiras, gerenciamento, hidrômetro, coletas periódicas, alterações operacionais, orientações entregues.
- Campos condicionais (ex.: produtos da ETE só se "possui ETE = sim").

---

## Fase 5 — Levantamento de projetos e visita ao local
Anexo a enviar: `📐 Levantamento de Projetos` + seção "Visita ao Local" do `📋 Campos Extraídos`.

Entregáveis:
- Reescrever módulos `processo`, `infraestrutura`, `vizinhanca`, `areas` (terreno detalhado), `documentos`, `observacoes` com campos completos: matéria-prima, equipamentos, processo produtivo, vizinhança, mercado local, obras próximas, infraestrutura pública detalhada, topografia, vegetação, solo, limites, acessos.
- Checklist de levantamentos por tipo.

---

## Fase 6 — Validação, pendências e revisão final dos módulos
Sem anexo novo (consolidação).

Entregáveis:
- Módulo `validacao` completo (campos textuais — assinatura real fica para depois).
- Tela/aba de Pendências consolidada por levantamento (sem mexer em export ainda).
- Revisão final do mapeamento `MODULES_BY_TYPE` para os 5 tipos refletindo as fichas oficiais.
- Tela de resumo passando a mostrar todos os subgrupos e campos preenchidos (sem botão de exportar, só visualização).

---

## Detalhes técnicos (para referência interna)

- Modelo de dados: adicionar entidade `Empreendimento` em `src/lib/types.ts`; ajustar `store.ts` (CRUD + migração leve do `localStorage`).
- Modules: estender `ModuleDef` com `subgroups: { id, title, fields, condition? }[]` e `condition?: (values) => boolean` em campos para condicional.
- FieldRenderer: adicionar tipos faltantes (lista dinâmica/repeater, número com unidade, faixa horária).
- Editor de levantamento: renderizar subgrupos como accordion dentro do módulo.
- Nada de export, upload de arquivo, GPS, assinatura ou áudio nessas fases — botões existentes podem ficar visíveis mas não serão evoluídos.
