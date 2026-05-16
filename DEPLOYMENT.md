# Deploy automatico na Cloudflare

Este projeto esta preparado para publicar automaticamente na Cloudflare Workers a cada push na branch `main`.

## 1. Criar o Worker na Cloudflare

Na Cloudflare, crie ou use uma conta com Workers habilitado. O deploy sera feito com o nome configurado em `wrangler.jsonc`: `fieldguide-hub`.

Depois do primeiro deploy, a URL padrao fica parecida com:

```text
https://fieldguide-hub.<seu-subdominio>.workers.dev
```

## 2. Criar um API token da Cloudflare

Crie um token em **Cloudflare > My Profile > API Tokens** com permissao para publicar Workers.

Permissoes recomendadas:

```text
Account > Workers Scripts > Edit
Account > Account Settings > Read
```

## 3. Cadastrar secrets no GitHub

No repositorio GitHub, acesse:

```text
Settings > Secrets and variables > Actions > New repository secret
```

Cadastre estes secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Os valores do Supabase ja existem no `.env` atual do projeto. Use os mesmos valores nos secrets acima.

## 4. Publicar

Depois dos secrets cadastrados, qualquer push na `main` dispara o workflow:

```text
.github/workflows/deploy-cloudflare.yml
```

Tambem da para rodar manualmente em:

```text
GitHub > Actions > Deploy to Cloudflare Workers > Run workflow
```

## 5. Fluxo recomendado

1. Alterar codigo no GitHub.
2. Fazer commit na `main`.
3. GitHub Actions executa build e deploy automaticamente.
4. A Cloudflare publica a versao nova sem depender do Lovable.
