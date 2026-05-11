# Plano de correções — auto-check, conclusão por subgrupo e fluxo

## Problema central

Hoje, qualquer valor digitado/selecionado dispara o check verde de "concluído" no campo. Isso impede edição (parece já fechado), faz o subgrupo se recolher cedo demais e cria a sensação de que "não dá para editar". A correção é tirar o auto-check e usar conclusão explícita.

## 1. Status automático mais brando (FieldRenderer)

- Bolinha cinza = vazio (sem valor).
- Bolinha laranja = preenchido / em andamento (tem valor mas não foi concluído).
- Check verde = só quando o usuário marca explicitamente como concluído (no campo OU no subgrupo).
- Remover a regra "tem valor → check verde automático".
- Manter o ícone "⋯" para mudar status manual e marcar N/A.

## 2. Botão "Concluir" por subgrupo

- Cada subgrupo ganha botão "Concluir subgrupo" no header (ao lado do "Não se aplica").
- Ao concluir: marca todos os campos visíveis do subgrupo como `concluido` e recolhe o subgrupo.
- Header passa a mostrar check verde no subgrupo concluído.
- Botão "Reabrir" aparece quando concluído.
- Editar campo dentro de subgrupo concluído continua possível (basta reabrir).
- Adicionar `subgroupDone?: Record<string, boolean>` em `ModuleState` + setter no store.
- `computeSubgroupStatus` retorna `concluido` se `subgroupDone[id]` for verdadeiro.

## 3. Conclusão de módulo navega para próximo

- Em `levantamentos.$id.index.tsx`, após `setModuleDone(true)` chamar handler que:
  - Busca primeiro módulo em `visibleTabs` que não esteja `naModule` nem `moduleDone`.
  - Faz `setActiveTab(next.id)` e rola a aba para a área visível.
- Se não houver próximo, mostra toast "Todos os módulos concluídos".

## 4. Auditoria dos botões em todos os módulos

Aplica-se uniformemente o novo comportamento (sem auto-check) a:
- Quadro de funcionários (setor selecionado não fecha)
- Captação de água (digitar 1 número não fecha)
- Reservatórios (adicionar item não fecha; precisa concluir explicitamente)
- Nascente / corpo hídrico
- Conformidades, Emissões, ETE — mesma regra geral

## 5. Reservatório — fluxo de adicionar quantidade + tamanho

Já é repeater. O problema é o check prematuro. Com a correção (1) e (2), o usuário:
1. Marca "Possui reservatório? Sim" (não fecha).
2. Adiciona reservatório → preenche tipo, capacidade, quantidade.
3. Adiciona outros se quiser.
4. Aperta "Concluir subgrupo" para fechar.

## 6. Processos Produtivos — Resíduos (refatoração)

Reestrutura módulo `processos`/`residuos`:
- Subgrupo "Resíduos" passa a ser repeater principal por categoria.
- Primeiro select: **Tipo de resíduo** com botões agrupados:
  - Recicláveis: Papel, Plástico, Vidro, Metal, Papelão
  - Não recicláveis: Orgânico, Rejeito
  - Perigosos: Químicos, Óleos, Pilhas/baterias, Lâmpadas, EPI contaminado
  - Inertes: Entulho, Construção civil
  - Não inertes
- Após selecionar o tipo, aparecem campos: quantidade gerada, periodicidade (button-select: Diária / Semanal / Mensal / Eventual), destinação, transportador.
- Cada item do repeater tem botão "Concluir item" e "Não se aplica":
  - "Não se aplica" remove o item da lista visível, vira chip pequeno "N/A: Papel, Plástico" no topo do subgrupo. Clicar no chip restaura o item para edição.
- Botão "+" para adicionar mais resíduos.

## 7. Encerramento — botão único de saída

Refatora módulo `encerramento`:
- Remove campos de hora manuais.
- Mostra: hora de entrada (já registrada na Identificação) + cronômetro ao vivo "Tempo decorrido: 02:14:33".
- Um botão grande **"Registrar saída"**:
  - Grava `data_saida`/`hora_saida` no momento do clique.
  - Congela o cronômetro mostrando duração total.
  - Conclui o módulo automaticamente.
- Botão secundário "Editar saída" para corrigir.

## 8. Arquivos impactados

- `src/lib/types.ts` — `subgroupDone?: Record<string, boolean>` em `ModuleState`
- `src/lib/store.ts` — `setSubgroupDone(sid, modId, sgId, done)`
- `src/lib/modules.ts` — refazer subgrupo Resíduos + módulo Encerramento
- `src/lib/modules.ts` (`computeSubgroupStatus`/`computeModuleStatus`) — respeitar `subgroupDone`
- `src/components/FieldRenderer.tsx` — remover auto-check (check só com status manual `concluido`)
- `src/routes/levantamentos.$id.index.tsx` — botão "Concluir subgrupo" no header dos subgrupos; auto-navegação ao concluir módulo; componente `EncerramentoTimer`

## 9. Riscos

- Levantamentos antigos: campos com valor passam a aparecer como "em andamento" (laranja) em vez de check verde. Aceitável — usuário pode concluir em massa via "Concluir subgrupo".
- Sem mudanças no schema do banco; tudo no JSON `data` do levantamento.
