## Melhorias na aba de Resíduos Sólidos

Refatoração visual e funcional do módulo Resíduos para tornar o preenchimento mais fluido, com classificação automática e uma experiência mais visual (cores + emojis).

### 1. Ampliar tipos de resíduo + emojis + cores (`src/lib/modules.ts`)

Cada tipo passa a ter cor (CONAMA 275 + extras) e emoji. Lista expandida:

```
♻️ Recicláveis:   Papel 🗞️, Papelão 📦, Plástico 🧴, Vidro 🍶, Metal 🥫,
                  Alumínio 🥤, Tetra Pak 📦
🍂 Orgânicos:    Orgânico 🍎, Poda/Verde 🌿, Resto de comida 🍽️
☣️ Perigosos:    Químicos ⚗️, Óleos 🛢️, Pilhas/baterias 🔋, Lâmpadas 💡,
                  EPI contaminado 🧤, Solventes/Tintas 🎨, Eletrônicos 💻,
                  Resíduos de saúde 🏥
🧱 Inertes:      Entulho 🧱, Construção civil 🏗️
🗑️ Outros:      Rejeito 🗑️
🏷️ Por classe (sem tipo específico):
   "Resíduo perigoso (Classe I)" ☣️
   "Resíduo não inerte (Classe II-A)" ♻️
   "Resíduo inerte (Classe II-B)" 🧱
   "Resíduos recicláveis (mistos)" ♻️
   "Resíduos não recicláveis (mistos)" 🚫
```

Cada um já vinculado à sua Classe NBR 10004 via `autoLink`.

### 2. Esconder seletor de tipo após escolher

No `RepeaterField` (FieldRenderer.tsx): quando o item tem o `labelField` preenchido, NÃO renderiza o `labelField` dentro do painel aberto — apenas mostra o nome no header com cor + emoji + chip "alterar tipo" pequeno (que limpa o valor para reabrir).

### 3. Esconder Classificação NBR quando auto-linkada

Adicionar flag `hideWhenAutoLinked: true` no campo `categoria`. O renderer esconde o campo se ele tem `autoLink` e o valor coincide com o mapeado pelo `from`. Mostra apenas um pequeno texto info "Classe II-A (Não inerte) — automática" abaixo do header, com botão de editar manual.

### 4. Entradas "só por classificação" (sem campo tipo)

Quando o tipo escolhido for um dos cinco rótulos "Resíduo perigoso", "Resíduo não inerte", etc., o renderer NÃO mostra o campo `categoria` — a classe já está no nome. Marcar essas opções via campo extra no field def `classOnlyValues: string[]`.

### 5. Colapsar campos preenchidos (periodicidade, acondicionamento, destinação, coletor)

Adicionar flag `collapseWhenFilled: true` por item field. No `RepeaterItemField`: quando flag ativa e value não vazio, renderiza apenas: `Label: Valor [✏️ editar] [📋 aplicar a outros]`. Clicar em editar volta ao seletor.

### 6. "Aplicar a outros" → marca os demais como sincronizados

Já temos `applyToOthers`. Após aplicar, o valor está propagado e o item destino exibirá o estado colapsado automaticamente (já preenchido). Opcionalmente exibir um pequeno badge "✓ sincronizado" nos demais por 2s (toast). Implementação simples: usar `toast.success("Aplicado em N itens")`.

### 7. Visual: cor preenche o chip do tipo selecionado

No `ButtonSelectField` (já existe), quando o `field.colorByValue` está definido e o valor está selecionado, o botão fica com background cor inteira em vez de bg-primary genérico. Borda do item já usa cor — manter.

### Arquivos alterados

- `src/lib/modules.ts` — expandir lista de tipos com emojis, cores, autoLink completo, marcar `categoria.hideWhenAutoLinked`, marcar collapse nos campos certos, adicionar `classOnlyValues`.
- `src/lib/types.ts` — `iconByValue?: Record<string,string>` (emoji), `hideWhenAutoLinked?`, `collapseWhenFilled?`, `classOnlyValues?: string[]` no FieldDef.
- `src/components/FieldRenderer.tsx`:
  - `RepeaterField`: esconder `labelField` quando preenchido (mostrar só no header com emoji+cor+botão alterar); pular `categoria` quando auto-linkado ou quando label ∈ classOnlyValues.
  - `RepeaterItemField`: implementar modo colapsado para `collapseWhenFilled`.
  - `ButtonSelectField`: usar `colorByValue` como background quando selecionado; renderizar emoji prefixo via `iconByValue`.

### Fora de escopo

- Não mexer em sync, store, rotas.
- Não criar novo subgrupo nem alterar "Coleta de resíduos".
- Sem mudanças em outros módulos.
