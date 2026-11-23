# fichas-notificacao

Ferramentas de apoio à APS (medicina de família, Santa Maria – RS).

## Pastas

- `modelos/`: app "Evoluções e Termos" (`index.html`, `modelos.js`, `img/`). Publicado como artifact em https://claude.ai/artifact/D6Nb8JuYgwzXRtzaxeBzm5; atualizar sempre no mesmo link.
  - `modelos.js` tem os textos (MODELOS) e a lista de procedimentos com as abas de cada um (PROCEDIMENTOS).
  - Textos que vieram do serviço ficam como estão. Texto escrito pelo Claude entra com `rascunho: true` até o usuário aprovar.
  - Dados de paciente nunca vão para o armazenamento do navegador.
  - A impressão conta as páginas de cada via para o frente e verso. Se mudar a margem do `@page`, mudar também a área útil em `paginasDe()`.
- `fichas/`, `indice.json`, `fontes.md`, `baixar.py`: fichas de notificação do SINAN.

## Preferências do usuário

- Layout em tons pastéis e limpo, só com o essencial na tela.
- Texto sem marcas de texto gerado por IA:
  - sem comparações frequentes ("mais X que Y", "em vez de", "X, mas não Y");
  - sem títulos com epíteto ("Introdução: o que interessa") e sem separadores enfeitados (" · ");
  - sem frases que explicam o óbvio.
- Orientações ao paciente no estilo das folhas do serviço: frases curtas, no infinitivo, com "Sinais de alarme: … Nesses casos, …" no fim.
