## Objetivo

Eliminar a dessincronização entre dispositivos migrando a persistência do navegador (IndexedDB/localStorage) para o **Lovable Cloud** com **Realtime**, em modelo de **workspace único da empresa** (todo usuário logado vê e edita os mesmos dados), com login por **e-mail/senha + Google**, partindo de banco vazio.

## Escopo desta entrega

### 1. Autenticação
- Habilitar e-mail/senha (sem auto-confirm) + Google (managed).
- Tela `/login` com tabs Entrar/Criar conta + botão Google.
- Tela `/reset-password` para recuperação.
- Layout `_authenticated` protegendo todas as rotas atuais (clientes, projetos, levantamentos, configurações). Quem não está logado é redirecionado para `/login`.
- Botão "Sair" no `AppShell`.

### 2. Banco de dados (workspace único)
Tabelas no Lovable Cloud, todas com RLS = "qualquer usuário autenticado pode ler/escrever" (workspace compartilhado), `created_by` registrado para auditoria:

- `clients` — campos do tipo `Client`
- `empreendimentos` — vinculado a cliente
- `projects` — vinculado a empreendimento
- `surveys` — campos do `Survey` (modules como JSONB), inclui `type`, `custom_type_id`
- `survey_templates` — templates
- `custom_survey_types` — tipos personalizados (módulos vinculados, overrides como JSONB, ícone, cor)
- `form_overrides` — singleton (1 linha por workspace) com o JSON de overrides globais

Sem `profiles` (usuário só precisa de e-mail/nome do `auth.users`).

Realtime habilitado em todas as tabelas acima.

### 3. Reescrita do `src/lib/store.ts`
- Remover IndexedDB/localStorage; manter mesma API pública (`useStore`, `addClient`, `addSurveyExt`, etc.) para não quebrar as telas.
- Estado em memória alimentado por:
  - `fetch` inicial após login (uma query por tabela)
  - subscriptions Realtime que aplicam INSERT/UPDATE/DELETE no estado local
- Mutations passam a ser `await supabase.from(...).insert/update/delete(...)`; o Realtime se encarrega de propagar para todos os dispositivos.
- Seeding dos tipos built-in (`seedBuiltInSurveyTypes`) roda 1x por workspace, não por dispositivo.

### 4. Limpeza
- Remover imports do antigo snapshot local; nada de migração de dados (começar do zero, conforme combinado).
- Corrigir o erro de hidratação visto em `/levantamentos/novo` (mismatch entre `<div>` SSR e `<label>` cliente nas opções de tipo).

## Fora do escopo (próximas fases)
- Storage de anexos (`attachments` continuam locais por enquanto — aviso será dado).
- Convites / múltiplas organizações / papéis de admin.
- Histórico de quem editou o quê além do `created_by`.

## Detalhes técnicos

**Modelo de RLS (workspace único):**
```sql
-- exemplo aplicado a todas as tabelas
create policy "auth read"  on public.clients for select to authenticated using (true);
create policy "auth write" on public.clients for insert to authenticated with check (auth.uid() is not null);
create policy "auth update" on public.clients for update to authenticated using (true);
create policy "auth delete" on public.clients for delete to authenticated using (true);
```

**Realtime:**
```sql
alter publication supabase_realtime add table
  public.clients, public.empreendimentos, public.projects,
  public.surveys, public.survey_templates,
  public.custom_survey_types, public.form_overrides;
```

**Camada client (resumo):**
```ts
// store.ts (novo)
const channel = supabase.channel('workspace')
  .on('postgres_changes', { event:'*', schema:'public', table:'clients' }, applyClientChange)
  .on('postgres_changes', { event:'*', schema:'public', table:'surveys' }, applySurveyChange)
  // ... demais tabelas
  .subscribe();
```

**Hidratação:** trocar o wrapper `<div>` das opções de tipo em `levantamentos.novo.tsx` por `<label>` consistente entre SSR e client.

## Ordem de execução
1. Migration (tabelas + RLS + realtime).
2. Configurar auth (e-mail + Google).
3. Criar `/login`, `/reset-password`, layout `_authenticated`, mover rotas existentes.
4. Reescrever `store.ts` para Supabase + Realtime.
5. Adicionar botão "Sair" no `AppShell`.
6. Corrigir hidratação em `levantamentos.novo.tsx`.
7. Testar criar/editar de cada entidade num "dispositivo" e verificar que aparece no outro.
