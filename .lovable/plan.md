
# Plano — Lote final de ajustes (Política, Rotinas, Infraestrutura, Vizinhança, Croqui, Observações + UX global)

Vou agrupar tudo em um único lote executável. A ordem abaixo é a ordem em que vou aplicar as mudanças.

---

## 1. Ajustes globais de status do campo (FieldRenderer)

Hoje, todo campo "não iniciado" mostra um badge grande de status. Vai mudar para:

- **Não iniciado** → apenas uma bolinha cinza pequena no canto, sem texto.
- **Preenchido** → bolinha vira **check verde** automaticamente; o badge grande some.
- O seletor manual de status (dropdown com 8 opções) sai do header padrão e vai para um menu "⋯" (só aparece se o usuário quiser marcar pendente / aguardando documento etc.). Para 99% dos casos, a regra automática basta.
- Resultado visual: cada campo perde altura. A linha de header passa a ser só `label` + bolinha/check à direita.

Aplica-se a todos os módulos automaticamente (não exige editar cada campo).

---

## 2. Campos numéricos aceitam só números

O renderer numérico já filtra entrada (`NumberField`), mas alguns campos que são na prática numéricos estão como `text` no schema. Vou converter os principais:

- `hidrometro` (Rotinas → Leitura do hidrômetro): `text` → `number` (decimal).
- `vf_pavs` / `vd_pavs` / `ve_pavs` (Vizinhança): já são `number`, ok.

---

## 3. Política e Gestão Ambiental (`politica`)

- **Remover subgrupo "Conformidade operacional"** (campo `conformidade`).
- `politica_status`, `coleta_recicl_status`, `educacao_status`, `ha_demanda_projeto` → `select` para `button-select`.
- `tipo_demanda` continua `button-select` multi (já é multiselect).
- Remover `politica_obs` (observação fixa). Observação opcional vira o "+ Adicionar observação" do subgrupo (já existe).
- Em **Coleta de recicláveis**: se `coleta_recicl_status` for "Não" / "Não há" / "Não se aplica a essa visita", **não exibir** outros campos.
- Em **Educação ambiental**: `palestras` (textarea) só aparece quando `educacao_status` = "Sim" ou "Houve agendamento".
- Em **Levantamento para projeto**: `tipo_demanda` só aparece se `ha_demanda_projeto` = "Sim". Remover `demanda_obs`.

---

## 4. Rotinas de Monitoramento (`rotinas`)

- `hidrometro_status` → `button-select`. `hidrometro` → tipo `number`. Remover `hidrometro_obs`.
- `coleta_agua_visita` → `button-select`. `coletas_agua` (detalhes) só aparece se "Sim".
- `coleta_efluente_visita` → `button-select`. `coletas_efluente` só aparece se "Sim".
- **Acompanhamento operacional**: virar opcional/discreto.
  - Remover do subgrupo o textarea "Acompanhamento da ETE" e "Outras rotinas observadas" como campos obrigatórios.
  - O subgrupo passa a ter apenas o link "+ Adicionar observação" (mesma mecânica usada nos outros subgrupos).
  - O subgrupo é marcado como "opcional" (pequeno badge) para não entrar no cálculo de não-iniciado / não-se-aplica.

Detalhe técnico: vou marcar o subgrupo com `optional?: boolean` em `SubgroupDef` e ajustar `computeSubgroupStatus` / `computeModuleStatus` para ignorar subgrupos opcionais quando vazios (não ficam "não iniciado", não derrubam o status do módulo).

---

## 5. Acesso e Infraestrutura Pública (`infraestrutura`)

Reescrita completa dos subgrupos de acesso (frente / fundos / dir / esq) para reduzir cansaço:

- **Substitui os 4 subgrupos** por **um único subgrupo "Acessos"** com um campo `apply-to-sides` para tipo de pavimentação (Asfalto / Paralelepípedo / Terra / Concreto / Bloquete / Inexistente / Outro), permitindo "aplicar aos demais lados".
- **Nome da rua**: mantém um campo de texto único por lado, em formato compacto (4 inputs pequenos lado a lado, ou repeater). Vou implementar como repeater simples `{lado, rua}` pré-preenchido com 4 itens (Frente, Fundos, Lado direito, Lado esquerdo) — usuário só digita a rua.
- **Remover** o campo "Descrição do acesso" dos 4 lados.
- **Remover** observações fixas.

**Infraestrutura pública (`infra_servicos`)**: ampliar lista para incluir também:
Asfalto / Pavimentação, Iluminação LED, Coleta seletiva, Posto de saúde, Hospital, Internet/Fibra, Gás encanado, Transporte público, Ponto de ônibus.

Remover `infra_obs`.

---

## 6. Vizinhança e Entorno (`vizinhanca`)

Reescrita dos 3 subgrupos de vizinhos (fundos / dir / esq) para reduzir cansaço:

- **Substituir os 3 subgrupos** por **um subgrupo "Vizinhos confrontantes"** com um **repeater** com 3 itens pré-preenchidos (Fundos, Lateral direita, Lateral esquerda).
- Cada item tem os mesmos campos (Material, Estado, Pavimentos, Habitado, Utilização, Classe, Posição, Reforço), todos como `button-select` no lugar de `select`/`boolean`.
- Cada item terá um botão **"Copiar do anterior"** para reaproveitar dados rapidamente.
- **Remover** botões/campos de observação por vizinho.

**Laudo técnico**:
- `necessita_laudo`: trocar `boolean` por `button-select` ["Sim", "Não", "Não se aplica"].
- **Remover** `laudo_obs`.

**Mercado local**: ampliar `mercado_local` adicionando:
- Posto de combustível, Creche, Praça, Banco / lotérica, Igreja, Restaurante, Hotel/Pousada, Indústria próxima, Centro comercial, Ponto de ônibus / terminal, Delegacia, Corpo de bombeiros.
- **Remover** `mercado_obs`.

**Obras próximas**:
- `tipo_obra` permanece como texto curto.
- **Remover** `obras_proximas` (observação).

---

## 7. Croqui / Desenho Técnico (`croqui`)

- **Remover por completo** o módulo `croqui` da lista `MODULES`.
- Remover de `MODULES_BY_TYPE` (geral, vazao, terreno).
- Remover de templates default que o referenciem (verifico em `src/lib/store.ts` os defaults).

---

## 8. Levantamento Fotográfico (`fotos`)

- **Não tocar.** Mantido como está.

---

## 9. Observações Técnicas (`observacoes`)

- **Remover por completo** o módulo `observacoes` da lista `MODULES`.
- Remover de `MODULES_BY_TYPE` (todos os tipos onde aparece).
- Remover de templates default.

---

## 10. Documentos (`documentos`)

- **Manter como está.** Sem alteração.

---

## Detalhes técnicos (referência rápida)

### Arquivos impactados

- `src/lib/types.ts`
  - Adicionar `optional?: boolean` em `SubgroupDef`.
- `src/lib/modules.ts`
  - Reescrever subgrupos de `politica`, `rotinas`, `infraestrutura`, `vizinhanca`.
  - Remover entradas `croqui` e `observacoes` de `MODULES` e de `MODULES_BY_TYPE`.
  - Ajustar `computeSubgroupStatus` / `computeModuleStatus` para ignorar subgrupos `optional` vazios.
- `src/components/FieldRenderer.tsx`
  - Header padrão: bolinha cinza (não iniciado) → check verde quando preenchido. Esconder `StatusBadge` grande do header padrão; mover seletor manual para menu "⋯".
  - Estado intermediário "em andamento" continua como bolinha colorida.
- `src/components/ModuleConfigStep.tsx`
  - Sem mudança direta; só refletirá automaticamente a remoção de croqui/observações.
- `src/lib/store.ts`
  - Remover referências a `croqui` / `observacoes` em templates ou seeds, se houver.
- `src/routes/levantamentos.$id.resumo.tsx`
  - Garantir que não dependa explicitamente de `croqui` / `observacoes`.

### Migração de dados

Sem schema do backend mudando — `ModuleState.values` é JSON livre. Levantamentos antigos com dados em `croqui` / `observacoes` continuarão no banco; só não são mais exibidos. Sem perda destrutiva.

### Risco / pontos de atenção

- Subgrupos `optional` precisam aparecer fechados por padrão e nunca contar negativamente no progresso.
- O `apply-to-sides` para pavimentação já existe no renderer; só configurar.
- Repeater com itens pré-preenchidos: vou inicializar `value` com 3 (vizinhos) ou 4 (ruas) itens fixos quando o usuário entra no subgrupo pela primeira vez.

### Fora deste lote (tratado em outras rodadas)

- Lote G (Poços como repeater) e Lote J (Resíduos por seleção mestre) — pendentes, conforme planejado anteriormente.
- Levantamento Fotográfico — fica para depois.
