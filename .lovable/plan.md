
# Plano de ajustes — Preenchimento dos Levantamentos

Vamos dividir em **lotes pequenos e testáveis**. Cada lote pode ser entregue isoladamente. Você aprova em ordem ou pula o que não quiser agora.

---

## Lote A — Fundamentos de UX (base reutilizável)

São mudanças transversais que destravam todos os módulos seguintes. Sem isso, repetiríamos código.

A1. **Auto-collapse ao concluir/N/A**
- Ao marcar campo/subgrupo/módulo como concluído ou N/A, ele recolhe automaticamente em uma "barrinha" com resumo (label + valor curto + status).
- Clicar na barrinha reabre. Não precisa de ícone extra.

A2. **Observação como item opcional**
- Remover o campo "observação" sempre aberto.
- Substituir por um link discreto "+ Observação" dentro do subgrupo. Só abre textarea ao clicar.
- Limite: **uma observação por subgrupo** (não por campo).
- Remover o "balão de comentário por campo".

A3. **Novo tipo de campo `button-select`** (substitui `select`/`multiselect` quando há poucas opções)
- Renderiza opções como chips/botões clicáveis (single ou multi).
- Suporte a "+ Outra" inline (abre input curto).

A4. **Novo tipo de campo `repeater`** (lista adicionável)
- Botão "+" adiciona item; cada item tem subcampos definidos.
- Item preenchido recolhe em chip-resumo. Clique reabre.
- Usado em: setores, reservatórios, poços, matérias-primas, equipamentos, etapas, produtos químicos, frota, resíduos.

A5. **Campo numérico estrito**
- `type: "number"` passa a aceitar **somente** dígitos (e separador decimal quando aplicável). Validação visual.

A6. **Campo `apply-to-sides`** (frente/fundos/dir/esq)
- Seleção por botões com ação "aplicar a outros lados".

> Após A1–A6, todos os lotes seguintes são edições pequenas em `src/lib/modules.ts`.

---

## Lote B — Dados Operacionais

- Remover: `alteracao_quadro`, `alteracao_quadro_obs`, `alteracao_producao`, `alteracao_producao_obs`.
- Manter: `capacidade_produtiva`.
- Quadro de funcionários vira **repeater de setores** (`{setor, quantidade}`) com lista pré-definida (Administrativo, Operacional, Produção, Manutenção, Limpeza, Segurança, Logística, Outros) + "+".
- Total de funcionários calculado automaticamente (somatório).
- Remover observação geral; manter "+ Observação" opcional no subgrupo.

---

## Lote C — Áreas, Limites e Topografia

- **Área total**: unidade selecionável (m² / hectares).
- **Limites do terreno**: `apply-to-sides` (frente/fundos/lado dir/lado esq) com botões.
- **Topografia atual**: remover.
- **Conformação predominante**: vira `button-select` single.
- **Tipo de solo**: vira `button-select` multi.
- "Localização do solo no terreno" e "Sondagem existente": **marcar para revisão** — peço sua definição antes de mexer.
- Remover observações fixas dos blocos.

---

## Lote D — Vegetação e Obstruções/Construções

D1. **Vegetação**: substituir densidade/tipo estimados por `button-select` multi de identificação:
Vegetação presente, Ausência, Degradada, Preservada, Antropizada, Capoeira, Árvores isoladas, Rasteira, Arbustiva, Arbórea.

D2. **Obstruções**: ampliar lista + opção "Outra" com campo livre.

D3. **Construções existentes**: `repeater` `{tipo, quantidade}` com botões pré-definidos: Galpão, Sede, Poço, Barragem, Curral, Caixa d'água, Escritório, Depósito, Área coberta, Banheiro, Casa, Muro, Cerca, Outra.

---

## Lote E — Água, Captação e Reservatório

- **Corpo hídrico**: Sim/Não (botões). Campos extras só aparecem se "Sim".
- Adicionar **Nascente** (Sim/Não).
- Adicionar **Distância do corpo hídrico** + opção "Dentro da propriedade".
- Identificação do corpo hídrico: vira "+ adicionar identificação" opcional.
- **Tipo de captação**: `button-select`. Estimativa de consumo: numérico estrito.
- **Reservatório**: Sim/Não → se Sim, **repeater** `{tipo, capacidade(L), quantidade}`.
- Capacidade com presets: 500, 1000, 2000, 5000, 10000, "Outro".
- Descrição/dimensões: link "+ Detalhes" opcional.
- Remover todas as observações fixas.

---

## Lote F — Uso da Água e Outorga

- **Uso da água**: ampliar lista de opções + botão "+" para uso manual.
- Descrição: opcional ("+ Descrição").
- **Situação da outorga**: dropdown → `button-select`.

---

## Lote G — Poços

- Vira `repeater` (múltiplos poços), cada um com seus campos.
- Profundidade, diâmetro, nível estático, nível dinâmico, vazão, tempo de captação: numérico estrito.

---

## Lote H — Processo Produtivo

- **Remover** "relatório fotográfico" (será tratado depois em outro módulo).
- **Matéria-prima**: `repeater` `{nome, quantidade, periodicidade(button-select: mensal/semanal/diária/outro)}`.
- **Equipamentos**: `repeater` `{nome, quantidade, especificações(opcional)}`.
- **Etapas**: `repeater` `{nome, descrição(opcional)}`.
- **Produtos químicos**: `button-select` multi com exemplos pré-definidos + "+ Outro". Descrição opcional.
- **Frota**: Sim/Não → se Sim, `repeater` `{tipo veículo, quantidade, descrição opcional}`.
- **Caracterização do entorno**: **mover** para outro módulo (proponho criar subgrupo "Entorno" em "Áreas, Dimensões e Terreno"; confirmo com você no início do lote).

---

## Lote I — Emissões

- **Ruído**: `button-select`, sem observação.
- **Emissões líquidas (efluente)**: ampliar opções como `button-select`, sem observação.
- **Emissões sólidas**: `button-select` multi.
- **Emissões gasosas**: dropdown → botões; auto-collapse ao selecionar.
- Remover observações fixas (manter "+ Observação" opcional).

---

## Lote J — Resíduos Sólidos

- Lista mestre de tipos como `button-select` multi. Bloco de detalhe **só aparece** para os tipos selecionados.
- Por resíduo selecionado: quantidade, frequência, acondicionamento, destinação — todos via `button-select` com "+ Outra".
- **Periodicidade geral da coleta**: `button-select`.
- **Gerenciamento**: botões; "Há dificuldade?" Sim/Não → descrição só se Sim.

---

## Lote K — ETE / Efluentes

- Substituir dropdowns por `button-select`/chips.
- **Produtos químicos**: `repeater` com "+".
- **Tipo de efluentes (tratamento)**: ampliar opções como `button-select`.

---

## Detalhes técnicos (para registro)

Arquivos impactados:
- `src/lib/types.ts` — adicionar `FieldType` `"button-select" | "repeater" | "apply-to-sides"`; estender `FieldDef` com `multi?`, `allowOther?`, `presets?`, `itemFields?`, `unitOptions?`, `min?/max?`.
- `src/components/FieldRenderer.tsx` — renderers novos; numérico estrito; chip-resumo de item recolhido.
- `src/components/ModuleConfigStep.tsx` / `src/routes/levantamentos.$id.index.tsx` — auto-collapse ao concluir/N/A; "+ Observação" por subgrupo; remover balões por campo.
- `src/lib/modules.ts` — reescrita por módulo conforme lotes B–K.
- `src/lib/store.ts` — helpers para repeater (CRUD de itens) e somatórios derivados (ex.: total funcionários).

Sem mudanças de schema do backend nesta rodada — tudo persiste em `ModuleState.values` (objetos/arrays JSON).

---

## Pontos que precisam da sua decisão antes de mexer

1. **Lote C**: o que fazer com "Localização do solo no terreno" e "Sondagem existente" — manter, remover, ou redesenhar?
2. **Lote H**: confirmar destino de "Caracterização do entorno" (sugiro mover para "Áreas, Dimensões e Terreno").
3. Posso já começar pelo **Lote A**? Ele desbloqueia todos os outros e o resultado já fica visível em qualquer módulo.
