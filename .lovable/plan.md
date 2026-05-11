Vou executar em **3 lotes estratégicos**, cada um deixando o app utilizável e testável antes do próximo. Clique em **Implementar plano** para eu começar pelo Lote 1.

---

## Lote 1 — Fundação visual e de status (Fases 1, 2, 3)

Resolve o que mais incomoda hoje: nada muda quando você preenche, e módulos desmarcados continuam ocupando espaço.

- **Fase 1 — Status visual real**: cálculo automático de status (campo → subgrupo → módulo), check verde quando concluído, cor de borda lateral, indicador na pílula da aba (cinza / amarelo / verde / laranja / traço). Cabeçalho do levantamento ganha contadores `X concluídos · Y em andamento · Z N/A · W pendência`.
- **Fase 2 — Módulos não selecionados viram contador**: abas só mostram o que está ativo; ao final da barra aparece pílula `+N não selecionados`, que abre painel para reativar item a item.
- **Fase 3 — "Não se aplica" para módulo e subgrupo**: botão no cabeçalho de cada um; quando marcado, vira faixa cinza compacta com badge N/A e botão "Reabrir", e conta como resolvido no progresso.

Resultado: você vê na hora o que já está pronto, o que falta e o que dispensou.

---

## Lote 2 — Reorganização da navegação (Fases 4, 9, 10)

Acaba com a lista corrida gigante e fecha o ciclo do levantamento.

- **Fase 4 — Sub-abas tipo fichário**: módulos com 3+ subgrupos (Identificação, Dados Cadastrais, Operação, Pessoas) ganham sub-abas internas com mesmo padrão visual da Fase 1.
- **Fase 9 — Higienização estrutural de Dados Cadastrais**: sub-abas + botão N/A por sub-aba; subgrupo "Contato no local" sai daqui (vai para o módulo Pessoas no Lote 3).
- **Fase 10 — Encerramento com duração**: aba Encerramento mostra chegada, saída, duração calculada, resumo de status, lista de pendências e assinaturas. Botão "Encerrar levantamento" trava edição.

Resultado: navegação curta e fluida, e fechamento do levantamento com indicadores reais.

---

## Lote 3 — Componentes reutilizáveis e templates (Fases 5, 6, 7, 8)

Transforma os blocos repetitivos em componentes inteligentes e termina o sistema de templates.

- **Fase 5 — Pessoas/Contatos como lista dinâmica**: botão `+ Adicionar pessoa`, ícones discretos para telefone/e-mail/cargo/documento. Adapter lê dados antigos para retrocompatibilidade.
- **Fase 6 — Operação com presets**: Horário comercial, 2 turnos, 3 turnos, 24 h, "Outro" libera campos atuais. Mesma lógica para alterações de quadro.
- **Fase 7 — Templates de fábrica**: presets nomeados embutidos por tipo de levantamento, botão "Salvar como template" também dentro do levantamento, e "Tornar template padrão para este tipo".
- **Fase 8 — Distinção entre tipos**: cada módulo recebe tag de finalidade (Projeto / Acompanhamento / Monitoramento / Outorga / Vazão); na configuração do "Geral" surgem filtros rápidos por finalidade.

Resultado: configurar e preencher um levantamento vira questão de cliques, e cada tipo fica visualmente claro.

---

## Estratégia de execução

- Entrego o **Lote 1 inteiro** primeiro (alto impacto, baixo risco, sem mexer em dados).
- Depois aviso e sigo para o **Lote 2** (mexe em layout, mantém dados intactos).
- Por último o **Lote 3** (introduz componentes novos com adapter para os dados existentes — nada se perde).

Nenhuma migração de banco é necessária. Os levantamentos já criados continuam funcionando.