
## Diagnóstico do problema "as melhorias não aparecem"

Os logs do navegador no celular mostram repetidamente:

```
TypeError: Importing a module script failed.
```

Isso é o sintoma clássico de **chunk JS desatualizado em cache**: o Safari mobile abriu o app numa versão antiga (`index-Lcq2932X.js`), e quando ele tenta carregar dinamicamente uma rota/chunk que já foi substituído pelo novo deploy, a importação falha — e o app mostra "This page didn't load" ou simplesmente fica parado.

Isso explica todos os sintomas:

- Lote 3 (cores de resíduos, NBR auto, "aplicar a outros") está no código, mas o celular continua executando o bundle antigo, então você não vê.
- "Levantamento não encontrado" → a tela renderiza antes do snapshot offline + sync do Supabase terminarem; o gating atual só espera `hydrated`, não confirma se já houve a primeira sincronização remota.
- Selects (ex.: "tipo de levantamento geral") "não respondem" → o handler está num chunk que falhou ao carregar.
- App "lento e travado" no início → `modules.ts` cresceu muito (~1.500 linhas) e é avaliado de forma síncrona no boot.

A correção real não é "rebuildar mais uma vez" — é fazer o app **se recuperar sozinho** quando detectar um chunk velho, e melhorar o gating de carregamento.

## Plano

### 1. Auto-recuperação de chunk desatualizado (causa raiz #1)

- Em `src/router.tsx` (`defaultErrorComponent`) e em `src/routes/__root.tsx` (`errorComponent`), detectar mensagens típicas: `"Importing a module script failed"`, `"Failed to fetch dynamically imported module"`, `"ChunkLoadError"`. Quando detectado, chamar `location.reload()` automaticamente uma única vez (guarda em `sessionStorage` para não criar loop).
- Adicionar listener global em `src/lib/error-capture.ts` que faz o mesmo em `window.onerror` / `unhandledrejection` para esses tipos de erro.

Resultado: quando você abrir o app numa aba antiga depois de um deploy, ele recarrega sozinho ao invés de mostrar "This page didn't load".

### 2. Gating de hidratação mais honesto (causa raiz #2)

- Em `src/lib/store.ts`, expor um flag adicional `firstSyncDone` que vira `true` somente após o primeiro `select` do Supabase concluir (não só após carregar snapshot local).
- Em `src/routes/levantamentos.$id.index.tsx`: enquanto `hydrated && !firstSyncDone && !survey`, mostrar "Sincronizando…" em vez de "Levantamento não encontrado". Só mostrar "não encontrado" depois do primeiro sync completar.
- Mesma correção em `levantamentos.index.tsx` e `projetos.$id.tsx` para evitar telas vazias falsas durante o boot.

### 3. Indicador de versão / refresh manual

- Adicionar no `OfflineIndicator` (ou ao lado dele) um pequeno botão circular "↻" que faz `location.reload()` e limpa o cache do service worker se houver. Visível só quando offline ou quando houver erro de sincronia.
- Mostrar discretamente no rodapé da tela de Configurações a versão de build (`import.meta.env.VITE_BUILD_ID` ou timestamp do build) — quando você abrir o ticket "as mudanças não apareceram", basta olhar o número e comparar.

### 4. Verificar visualmente que Lote 3 está realmente no bundle

Após implementar 1–3, abrir um levantamento que tenha o subgrupo de Resíduos no preview e confirmar:
- O campo "Classificação NBR 10004" aparece com o nome novo;
- O ícone de cópia "aplicar a outros" aparece quando há valor preenchido;
- A cor por tipo está visível na linha do repeater.

Se algo não estiver renderizando como esperado mesmo no bundle novo, corrigir nesse passo (provavelmente é um bug do Lote 3, não cache).

### 5. Lote 4 — finalizar os dois itens pendentes

5a. **Combustíveis: não pedir para reabrir o tipo após selecionar**
- Em `src/lib/modules.ts`, no campo `tipo` do subgrupo de combustíveis: remover `requiresConfirmation` / fluxo de "confirmar tipo" e travar o select para apenas atualizar o valor diretamente.
- No `FieldRenderer`, garantir que selects do tipo `select-with-confirm` fiquem só no modo "salvar direto" para esse campo.

5b. **Emissões líquidas: campo "volume estimado (m³/dia)" após escolher o tipo**
- Em `src/lib/modules.ts`, adicionar campo `volume_estimado_m3_dia` (number, unit "m³/dia", min 0) no subgrupo de emissões líquidas, com `showWhen` baseado no campo `tipo` ter sido preenchido.
- Sem alteração no `FieldRenderer` — usa o `NumberField` existente.

### 6. Performance no boot (mitigação leve, não refactor)

- Em `src/lib/modules.ts`, mover a montagem dos `MODULE_PRESETS` "pesados" (resíduos com cor/NBR, vazão, etc.) para funções memoizadas que rodam só na primeira leitura, em vez de tudo no top-level do módulo. Reduz o tempo até a primeira tela.
- Não vou refatorar `store.ts` agora — só anotar como follow-up.

## Detalhes técnicos

- Detecção do erro de chunk: `if (/Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk \d+ failed/i.test(error?.message ?? ""))`.
- Guarda anti-loop: `if (!sessionStorage.getItem("chunk-reload-once")) { sessionStorage.setItem("chunk-reload-once","1"); location.reload(); }`. Limpar a chave depois de 30s para permitir nova auto-recuperação em um deploy futuro.
- `firstSyncDone` é setado no callback do primeiro `select` em `hydrateFromSupabase` no `store.ts` (independente de sucesso/erro — em caso de erro também vira `true` para não travar a UI).

## Fora de escopo

- Não vou reescrever a camada de sincronização agora. Os ajustes acima são suficientes para o sintoma reportado.
- Não vou trocar o stack de PWA / adicionar service worker novo.
