# Plano: Correções no fluxo de preenchimento do levantamento

Vou agrupar todos os pontos que você levantou por módulo, seguindo a ordem em que aparecem no formulário. Em cada grupo, listo exatamente o que será alterado.

---

## 1. Identificação do levantamento

**Dados cadastrais – Contato do local**
- Remover os campos atuais "Nome / Telefone / E-mail" separados.
- Trocar por uma lista de pessoas (mesmo padrão de "Pessoas envolvidas"): adiciono o **nome** e depois, ao lado, aparecem dois ícones: 📞 telefone e ✉️ e-mail. Clicando neles abre um mini-campo para preencher.
- Telefone: máscara `(DDD) 9 9999-9999`, validação só dígitos, e depois de salvo vira link clicável para **WhatsApp** (`https://wa.me/55...`).
- E-mail: clicável (`mailto:`).

**Pessoas envolvidas – Colaborador que acompanhou**
- Mesmo padrão acima (já é lista, só vou ajustar para começar com **apenas o nome** + ícones para adicionar telefone/cargo/e-mail sob demanda, sem poluir a tela).

**Validação e encerramento**
- Remover o campo de nome/data do técnico responsável: vai puxar automaticamente do técnico vinculado ao levantamento e da data da visita.

---

## 2. Dados operacionais

**Turnos – pré-configuração padrão**
- Preset "Padrão" atual está errado. Corrigir para:
  - Turno 1: 08:00 – 12:00
  - Turno 2: 14:00 – 18:00
  - Dias: Segunda a Sábado

---

## 3. Quadro de funcionários

- Quando clico em **Outros** e adiciono um setor novo (ex.: "Expedição"), ele fica **salvo permanentemente** no catálogo de setores (`learn: true` já existe — vou garantir persistência no banco).
- Ao reabrir, os setores cadastrados aparecem com um **balão de contador** já visível (0 por padrão), com botões **+ / –** para ajustar a quantidade sem precisar entrar em modo edição.
- O total de colaboradores soma automaticamente.
- Adicionar um botão **"Colaboradores totais (sem setor)"** ao lado de "Adicionar setor", para registrar headcount sem detalhar por setor.

---

## 4. Produtos e operação

- Cadastro de produtos com mesma premissa dos setores: adiciono o produto e ele entra na lista zerado.
- Cada produto aparece como linha com ícones rápidos para preencher **estimativa de produção mensal** + **unidade** (t, kg, L, un) sem abrir modal.

---

## 5. Áreas e dimensões

**Bug do "Concluir 2x"**
- Hoje quando digito "1500" e aperto **Enter** preciso clicar 2× em concluir, e às vezes o sistema apaga "10" do valor "1000". Corrigir o handler do submit (provavelmente um `onBlur` competindo com o `onSubmit`).

**Auto-conclusão**
- Quando **todos os campos** de "Dimensões do terreno" estiverem preenchidos (valor ou "Não se aplica"), o subgrupo automaticamente fica **verde com "Concluído"** sem precisar clicar no botão.
- Mesmo comportamento para "Áreas do empreendimento".
- O botão "Concluir" some quando já está concluído (só fica visível um chevron para reabrir).

**Tipos de solo**
- Adicionar categorias mais práticas (não técnicas):
  - Solo degradado
  - Solo não degradado
  - Solo com construção
  - Solo com vegetação
  - Solo compactado
  - Solo exposto

**Construções existentes**
- Quando adicionar "Outros" no tipo, fica salvo no catálogo para próximos levantamentos.

**Entorno**
- Adicionar balões de caracterização:
  - Entorno arborizado
  - Com vegetação nativa
  - Com civilização/urbanizado
  - Industrial
  - Rural
  - Margem de corpo hídrico
  - Próximo a APP

---

## 6. Água

**Captação e reservatório**

- **Nascente**: ao marcar "Sim, existe nascente", aparece campo para **coordenada geográfica**.
- **Captação de água**: tipos (subterrânea, superficial, concessionária, caminhão-pipa) viram itens dinâmicos. Para cada ponto adicionado:
  - Coordenada geográfica
  - Estimativa de consumo
  - Posso adicionar **vários pontos** (ex: 3 poços + 2 captações superficiais).
- **Reservatório**: ao escolher "Caixa elevada" não preciso reabrir para editar o tipo. Adiciono direto **quantidade + capacidade**, e posso adicionar **outra caixa elevada** com capacidade diferente (ex: 1× 5.000 L + 2× 10.000 L).

**Uso da água**
- Remover separação "tipo de uso" × "consumo". Vira um item único:
  - Seleciono o tipo (catálogo aprendido: "Sanitário", "Lavagem", "Processo", etc.)
  - Digito **estimativa por dia**
  - Sistema calcula automaticamente **estimativa por mês** (× 30) e por mês útil.

**Auto-conclusão**: mesma regra dos outros módulos.

---

## 7. Matéria-prima e insumos

- Corrigir bug do campo de digitação (perda de foco / dificuldade ao escrever).
- **Combustíveis**: não pedir para alterar tipo após selecionar.

---

## 8. Efluentes / Emissões

- **Emissões líquidas**: após escolher o tipo de efluente, aparece campo "Volume estimado (m³/dia)".
- **Emissões sólidas** → renomear para **"Geração de resíduos"** (vou unificar com o módulo de resíduos sólidos).
- **Emissões gasosas**: adicionar dois toggles:
  - Há filtro?
  - Há lavador de fumaça?

---

## 9. Resíduos sólidos

- Cada tipo (papel, plástico, vidro, metal, orgânico, rejeito) recebe **cor de identificação** padrão (azul, vermelho, verde, amarelo, marrom, cinza).
- Classificação NBR já **pré-vinculada** automaticamente ao tipo (ex: papel → Classe II A não-inerte; lâmpada → Classe I).
- Permitir adicionar manualmente também: **Classe I**, **Classe II-A**, **Classe II-B (inerte)**, **Reciclável**.
- **Aplicar em outros**: depois de preencher acondicionamento/destinação/coleta de um resíduo, aparece "Aplicar a outros resíduos?" com checkbox para replicar.
- Comportamento "encolher": ao preencher periodicidade marcando "Todos", só fica visível o item escolhido (UI compacta).

---

## 10. Medição de vazão

- Área calculada **automaticamente** = comprimento × largura. Campo "Área" fica readonly.

---

## 11. Validação e encerramento

- Remover campos redundantes do técnico (já coberto no item 1).

---

## Mudanças técnicas (resumo p/ referência)

- `src/lib/modules.ts`: schema dos campos (novo tipo `contacts`, ajustes em `sectors`, `products`, `water-sources`, `reservoirs`, `water-uses`, `waste-types`, adição de `auto-coordinates`, presets de turno corretos).
- `src/components/FieldRenderer.tsx`: novos renderers para contatos com ícones, lista de setores com contador inline, auto-conclusão de subgrupos, cálculo automático de área, link WhatsApp.
- `src/lib/store.ts`: catálogo aprendido persistido para setores, tipos de solo, tipos de construção, tipos de uso de água.
- `src/routes/levantamentos.$id.index.tsx`: lógica de auto-conclusão (subgrupo verde sem clique) e remoção do botão duplicado.
- Correção do bug do Enter duplo (debounce do submit + remoção do blur conflitante).

---

## Como prefere que eu prossiga?

A lista é grande. Posso:
- **(A) Implementar tudo de uma vez** num único turno (mais demorado, mas resolve em uma rodada).
- **(B) Dividir em 3 entregas**: (1) Identificação + Operacional + Quadro/Produtos, (2) Áreas + Água, (3) Resíduos + Efluentes + Encerramento — testando após cada uma.

Recomendo **(B)** para você conseguir validar parte por parte sem perder o fio. Confirma qual prefere e eu já começo.
