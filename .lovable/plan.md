## Plano de melhorias nos campos dos módulos

Foco: tornar o preenchimento mais fluido, com presets que aprendem, novos tipos de campo e correção de inconsistências em vários módulos. Tudo no frontend (modules.ts, FieldRenderer, types).

### 1. Novos tipos/recursos de campo (FieldRenderer + types)

- **`quantity` (campo "stepper")**: número inteiro com botões `−` / `+` e input no meio. Mais simples que digitar. Substitui o `number` atual em campos de "Quantidade" de repeaters (setores, construções, reservatórios, equipamentos, frota, veículos), mantendo `decimal: false`.
- **`enter-to-add` em repeaters de texto livre**: ao escrever o nome e apertar `Enter`, salva o item e mantém o foco para o próximo. Usado em **Equipamentos**, **Etapas do processo produtivo** e **Matéria-prima**. Esses três deixam de salvar presets globais (cada empresa é única).
- **Memória de presets aprendidos** (`learnedOptions` em `localStorage`): para os campos com `allowOther` e `learn: true`, todo "Outro" digitado é lembrado e oferecido como chip nas próximas vezes (escopo por `field.id`). Aplicado em: Setores (colaboradores), tipos de construção, tipos de reservatório, tipos de uso de água, tipos de captação, tipos de resíduo, acondicionamento, destinação, coletor, materiais de fechamento, vegetação, solo, mercado local, infraestrutura.
- **Repeater sem item inicial**: quando não há presets (apenas texto livre), começa colapsado e só mostra o botão `+ Adicionar`. Sem placeholder vazio. Aplicado a Equipamentos, Etapas, Matéria-prima, Frota.
- **Campo `area` calculado**: novo helper que, em **Áreas e Dimensões**, calcula automaticamente uma estimativa de área a partir de `dim_frente × dim_lado_dir` (ou média dos lados em terreno irregular) e oferece "Aplicar a Área total". Mostrado como chip sugerido abaixo do campo `area_total`.

### 2. Mudanças por módulo (`src/lib/modules.ts`)

**Operacionais → Quadro de funcionários**
- Campo `quantidade` no repeater `setores` vira `quantity` (stepper). Sem outras mudanças visuais.

**Áreas e Dimensões**
- `area_total`, `area_construida`, `area_a_construir`, `area_livre` ganham presets numéricos comuns (100, 250, 500, 1000, 5000, 10 000) e o sugestor automático descrito acima.
- Repeater `construcoes`: `quantidade` → `quantity`.

**Água, Captação e Reservatório**
- Novo campo no subgrupo "Captação": `tipo_uso_agua` (já existe `usos_agua`) — adicionar `consumo_estimado_por_uso` como repeater opcional `{uso, consumo m³/dia}` com presets de uso.
- `consumo` ganha presets (1, 5, 10, 20, 50, 100, 500 m³/dia).
- Reservatório: `quantidade` → `quantity`. Capacidade já tem presets.
- **Pontos de captação** (novo subgrupo): repeater `pontos_captacao` com `{nome, tipo, coords}`, permitindo vários pontos com coordenadas.

**Resíduos Sólidos**
- `categoria` reescrita para classificação ambiental: opções `Classe I (Perigoso)`, `Classe II-A (Não inerte)`, `Classe II-B (Inerte)`, `Reciclável Classe A`, `Reciclável Classe B`, `Orgânico`. Removido o vínculo com tipo do material.
- `acondicionamento`, `destino`, `coletor`: `text` → `button-select` com `allowOther` + `learn: true`.
  - Acondicionamento: Bombona, Big bag, Tambor, Saco plástico, Container, Caixa de papelão, Pallet, A granel.
  - Destino: Aterro sanitário, Aterro industrial, Reciclagem, Reuso interno, Compostagem, Coprocessamento, Incineração, Logística reversa.
  - Coletor: Coleta pública, Empresa terceirizada, Catador, Logística reversa do fornecedor.
- `periodicidade` no item: já é button-select; trocar para presets aprendíveis (`learn: true`).

**Processo Produtivo**
- `materias_primas`: `nome` volta a ser `text` (sem presets globais). `quantidade` vira `quantity` (com unidade opcional kg/L/un selecionável).
- Novo subgrupo **Energia e combustíveis** com repeater `{tipo (Diesel, Gasolina, GLP, Energia elétrica, Lenha, Gás natural, Etanol, Biomassa), consumo, unidade (L/mês, kWh/mês, kg/mês), observação}`.
- `equipamentos`: `nome` text livre + `enter-to-add`. `quantidade` → `quantity`. Inicia sem item, só com botão `+`.
- `etapas`: `nome` volta a ser `text` (sem presets globais), com `enter-to-add` em fluxo: digita etapa → Enter → cria a próxima já em foco. Mantém `descricao` opcional via balão de comentário (botão "Comentar" inline que abre um pequeno textarea).
- `frota`: `quantidade` → `quantity`. Adicionar campo `observacao` (placeholder "Placas, modelos, marcas").

**Rotinas de Monitoramento**
- Para campos cuja resposta "Não" significa nada a registrar, esconder o subgrupo de detalhes. `coleta_agua_visita`, `coleta_efluente_visita`, `coleta_recicl_status` → ao escolher "Não" não exibe nenhum sub-bloco; só "Sim" expande detalhes (`showIf` já está parcialmente; revisar para que a sub-seção inteira fique oculta, não só um campo).

**Infraestrutura Pública / Vizinhança**
- `infra_servicos`: ampliar opções para incluir Praças, Parques, Hospitais, Escolas, Creche, Posto de saúde, Igreja, Áreas de lazer, Quadras esportivas, Centros comunitários (parte é equipamento urbano).
- `mercado_local` (Vizinhança): mesma ampliação — adicionar Cinema, Biblioteca, Estádio, Parques, Áreas verdes, Ciclovia.
- Em ambos, ativar `learn: true` para acumular novos itens.

### 3. Componente `FieldRenderer.tsx`

- Adicionar branch para `quantity` (stepper).
- Adicionar suporte a `learn: true` em `ButtonSelectField`: lê/grava em `localStorage["learned:"+fieldId]`. Quando o usuário adiciona "Outro", merge nos chips para próximas sessões. Excluir um chip aprendido com long-press / botão "x" só remove se for aprendido.
- Em `RepeaterField`: aceitar prop `enterToAdd` no labelField; quando `Enter` no input do nome, salva e cria novo item já em foco. Ocultar bloco de presets quando o módulo declarar `noPresetMemory: true` (Matéria-prima, Equipamentos, Etapas).
- Em `RepeaterItemField`: quando `f.type === "quantity"` renderizar stepper; quando `f.commentable: true`, mostrar botão "Comentar" que abre o textarea inline para a descrição.
- Mostrar chip "Calcular ≈ X m²" em `area_total` quando dimensões estiverem preenchidas (callback recebe valores do módulo via prop nova ou contexto leve).

### 4. Tipos (`src/lib/types.ts`)

- Adicionar `"quantity"` a `FieldType`.
- Adicionar opcionais em `FieldDef`: `learn?: boolean`, `enterToAdd?: boolean`, `commentable?: boolean`, `suggestFrom?: { kind: "areaFromDims" }`, `noPresetMemory?: boolean`.

### 5. Fora do escopo desta entrega

- Renderização rica do "balão de comentário" como popover (usaremos textarea inline simples).
- Migração retroativa de dados antigos de `categoria` de resíduos (apenas mudam as opções; valores antigos ficam visíveis mas o usuário deve reclassificar).
- Mudanças nos templates de fábrica.

### Arquivos afetados

- `src/lib/types.ts` — novos tipos opcionais.
- `src/lib/modules.ts` — ajustes de campos por módulo.
- `src/components/FieldRenderer.tsx` — novos renderers (`quantity`, learn, enter-to-add, comentário, sugestor de área).
