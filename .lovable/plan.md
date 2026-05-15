# Plano de Execução — Módulo Relatório Fotográfico

## 1. Diagnóstico

Hoje o módulo `fotos` em `src/lib/modules.ts` (linhas 1149–1156) é apenas um textarea ("Descrição do conjunto fotográfico") + lista genérica de `attachments` no `ModuleState`. Não há checklist, não há vínculo por item, não há separação por tipo de levantamento, e na tela de conclusão (`levantamentos.$id.resumo.tsx`) os anexos aparecem como um bloco único de imagens sem rótulo.

Precisamos transformar esse módulo em **checklist Sim/Não por tipo de levantamento**, com **anexos por item** exibidos na **etapa de conclusão**, mantendo edição posterior.

## 2. Modelo de dados (sem nova tabela no Supabase)

Como todo o levantamento já é persistido como JSON em `surveys.data`, **não é necessário criar tabelas novas**. Estende-se o `ModuleState` do módulo `fotos`:

```ts
// src/lib/types.ts
export interface PhotoChecklistAnswer {
  itemId: string;        // slug estável do item ("fachada_entrada")
  label: string;         // rótulo legível (denormalizado p/ histórico)
  registrado: boolean;   // true=Sim, false=Não. Ausente = não respondido.
  observacao?: string;
  updatedAt: string;
}

// novo campo opcional em ModuleState (apenas usado pelo módulo "fotos")
photoChecklist?: PhotoChecklistAnswer[];
```

E em `Attachment` adicionar vínculo opcional ao item:

```ts
photoItemId?: string;  // referência ao itemId do checklist
origin?: "camera" | "biblioteca" | "upload";
```

Isso preserva compatibilidade com anexos antigos (sem `photoItemId`).

## 3. Catálogo de checklists por tipo

Novo arquivo `src/lib/photoChecklists.ts`:

```ts
export type PhotoChecklistKey =
  | "projeto" | "acompanhamento" | "outorga" | "vazao"
  | "visita_terreno" | "obras" | "documentos_fisicos" | "post";

export interface PhotoChecklistItem { id: string; label: string }
export interface PhotoChecklistTemplate {
  key: PhotoChecklistKey;
  title: string;
  items: PhotoChecklistItem[];
}

export const PHOTO_CHECKLISTS: Record<PhotoChecklistKey, PhotoChecklistTemplate>
```

Conteúdo: as 8 listas exatas fornecidas no briefing (Projeto: 22 itens; Ambiental: 17; Outorga: 12; Vazão: 11; Visita: 20; Obras: 16; Documentos: 1; Post: 11 + campo extra "Liberado para divulgação").

Mapeamento `SurveyType → PhotoChecklistKey[]` (um levantamento pode ter mais de um modelo aplicável, mas inicia com um padrão; usuário pode adicionar outros modelos via dropdown "Adicionar checklist").

Regras já incorporadas no catálogo:
- "Processo produtivo" único (sem etapas).
- Vazão sem P1..P9 no checklist.
- Documentos físicos = item único.
- Post inclui flag separada `liberado_divulgacao: Sim/Não`.

## 4. UI — Tela do checklist (dentro do módulo Relatório Fotográfico)

Componente novo `src/components/PhotoChecklist.tsx`:

- Header: seletor "Tipo de relatório fotográfico" (multi, default conforme `survey.type`).
- Para cada modelo selecionado, lista os itens em cards compactos (mobile-first, sem rolagem horizontal).
- Cada item:
  - Rótulo + dois botões segmentados **Sim** / **Não** (verde / cinza).
  - Botão "💬" para abrir observação opcional (popover).
- Sem opção "Não se aplica", sem "Pendente". Itens não respondidos ficam neutros.
- Botão "Marcar todos como Não" (acelerador de campo).
- Para Post: campo extra "Liberado para divulgação? Sim/Não" abaixo da lista.

Substitui o conteúdo atual do módulo `fotos`. O textarea legado vira opcional na seção "Observações gerais" (mantido por retrocompatibilidade).

## 5. UI — Etapa de conclusão (Anexar fotos)

Em `src/routes/levantamentos.$id.resumo.tsx`, antes do bloco "Resumo final", inserir nova seção **"Anexar fotos do relatório fotográfico"**:

- Itera apenas itens onde `registrado === true`.
- Para cada item:
  - Nome do item (com chip do modelo de origem se houver mais de um).
  - Botão **Anexar imagens** (input `accept="image/*"` com `capture="environment"` opcional para câmera).
  - Grid de miniaturas das imagens já vinculadas (`attachments` filtrados por `photoItemId === item.id`).
  - Cada miniatura: hover → remover.
  - Campo observação inline (sincroniza com `PhotoChecklistAnswer.observacao`).
  - Badge **"Aguardando anexo"** (âmbar) se `registrado=true` e nenhuma imagem.
- Reaproveita `addAttachment`/`removeAttachment` em `src/lib/store.ts`, passando `photoItemId` e `origin`.
- Conclusão do levantamento **não bloqueia** quando há "Aguardando anexo" — apenas mostra contador "N itens aguardando anexo" como aviso.

## 6. Edição posterior

A mesma seção é renderizada também em `levantamentos.$id.index.tsx` (acesso ao módulo Relatório Fotográfico depois do levantamento concluído):
- Permite alternar Sim ↔ Não. Ao mudar para Não, anexos vinculados ficam preservados mas ocultos (não removidos) — re-marcar Sim os reexibe.
- Permite adicionar/remover imagens e editar observações a qualquer momento.

## 7. Regras de funcionamento

| Situação | Comportamento |
|---|---|
| Item sem resposta | Não aparece na conclusão; não conta como aguardando |
| Sim sem foto | Aparece na conclusão com badge "Aguardando anexo" |
| Sim com foto(s) | Aparece com miniaturas e botão "Adicionar mais" |
| Não | Não aparece na conclusão |
| Mudança Sim→Não | Anexos preservados, ocultos |
| Mudança Não→Sim | Anexos prévios reaparecem |
| Múltiplos modelos | Itens agrupados por modelo na conclusão |

## 8. Critérios de aceite

1. Em qualquer tipo de levantamento, abrir o módulo "Relatório Fotográfico" mostra o checklist do tipo correspondente com botões Sim/Não.
2. Não existe a opção "Não se aplica" nem "Pendente" no checklist fotográfico.
3. Marcar Sim em N itens e ir para a conclusão exibe exatamente esses N blocos para anexar imagens.
4. É possível anexar várias imagens por item, ver miniaturas e remover individualmente.
5. Conclusão é permitida com itens "Aguardando anexo" (apenas aviso).
6. Reabrir o levantamento permite anexar/remover/alterar observações nos itens Sim.
7. Tipo "Post" mostra o campo extra "Liberado para divulgação".
8. Layout mobile sem rolagem horizontal; itens quebram linha.
9. Levantamentos antigos continuam abrindo (compat com `attachments` sem `photoItemId`).

## 9. Ordem de implementação

1. **Tipos** — adicionar `PhotoChecklistAnswer`, campo opcional em `ModuleState`, campos opcionais em `Attachment` (`src/lib/types.ts`).
2. **Catálogo** — criar `src/lib/photoChecklists.ts` com as 8 listas e o mapa por `SurveyType`.
3. **Store** — helpers `setPhotoAnswer(sid, itemId, registrado)`, `setPhotoNote(sid, itemId, txt)`, `addPhotoAttachment(sid, itemId, file)` em `src/lib/store.ts`.
4. **Componente checklist** — `src/components/PhotoChecklist.tsx`. Renderer especial dentro de `FieldRenderer`/módulo `fotos` (substitui o textarea atual; manter `descricao_fotos` opcional como observação geral).
5. **Atualizar `MODULES`** — em `src/lib/modules.ts`, marcar o módulo `fotos` com flag `customRenderer: "photoChecklist"` e remover/relegar o textarea atual.
6. **Etapa de conclusão** — nova seção em `src/routes/levantamentos.$id.resumo.tsx` com lista de itens Sim + uploader por item + badge "Aguardando anexo".
7. **Edição posterior** — garantir mesmo bloco em `levantamentos.$id.index.tsx`.
8. **QA mobile** — testar viewport ~375px sem barra de rolagem horizontal, com Sim/Não e upload pela câmera.

## 10. Escopo fora desta entrega

- Compressão de imagem no cliente.
- Reordenação manual de itens.
- Upload para Storage do Supabase (segue como dataURL local até decisão de migração).
- Permissões/aprovação de divulgação além do flag simples.
- Relatórios PDF do módulo fotográfico.
