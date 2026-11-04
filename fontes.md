# Fontes e método

**Data de acesso:** 2026-11-03  
**Recorte:** Brasil, com notas para o Rio Grande do Sul (CEVS-RS).

## Portaria vigente

- **Lista Nacional de Notificação Compulsória:** Anexo 1 do Anexo V da Portaria de Consolidação GM/MS nº 4, de 28/09/2017, na redação dada pela **Portaria GM/MS nº 11.211, de 13/05/2026**.
  - Texto: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11211_14_05_2026.html
  - A 11.211/2026 incluiu caxumba e febre do Oropouche, removeu a covid-19 como agravo autônomo e alterou nomenclaturas/periodicidades (difteria, tétano, varicela etc.).
- Atos anteriores relevantes: Portaria GM/MS nº 10.175/2026 (anomalias congênitas), nº 6.734/2025 (esporotricose), nº 5.201/2024 (agravos relacionados ao trabalho) e nº 217/2023.
- **Lista estadual complementar (RS):** Portaria SES/RS nº 440/2024, disponível em https://www.cevs.rs.gov.br/upload/arquivos/202408/09144159-portaria-440-2024.pdf

## Como a periodicidade foi lida

- **Imediata (até 24h):** esferas marcadas com X na coluna correspondente (MS, SES e/ou SMS).
- **Semanal:** a tabela oficial tem uma única coluna semanal, sem discriminar esfera; por isso o índice registra `[MS, SES, SMS]`. Na prática, o serviço notifica a SMS, que consolida e envia à SES/MS.
- **Outra:** usada apenas para formulários gerais e fichas SINAN que não são agravos individuais da lista (ex.: ficha genérica, epizootia, tracoma, surto de DTA).

## URLs usadas

- Portal SINAN (fichas): https://portalsinan.saude.gov.br/doencas-e-agravos
- Lista de agravos: https://portalsinan.saude.gov.br/doencas-e-agravos?showall=1
- CEVS-RS: https://cevs.rs.gov.br/
- e-SUS Notifica: https://www.gov.br/pt-br/servicos/acessar-sistema-e-sus-notifica
- SIVEP-Gripe: https://sivepgripe.saude.gov.br/sivepgripe/
- SIM: https://www.gov.br/saude/pt-br/composicao/svsa/sistemas-de-informacao/sim
- SINASC: https://www.gov.br/saude/pt-br/composicao/svsa/sistemas-de-informacao/sinasc/sistema-de-informacoes-sobre-nascidos-vivos

## Resultado do último processamento

- Agravos no índice: **92**.
- Agravos com PDF local: **81**.
- PDFs únicos baixados: **50/50**.

## Limitações

- Várias fichas do SINAN são formulários universais (NINDIV) ou conjuntos (dengue/chikungunya, sarampo/rubéola, hepatites). O campo `ficha_pdf` aponta para o arquivo realmente usado; `observacao` explica o compartilhamento.
- Agravos notificados em outros sistemas (e-SUS Notifica, SIVEP-Gripe, SIM, SINASC) não têm ficha SINAN e trazem `ficha_pdf: null`, com o link do sistema em `ficha_url`.
- Os CIDs foram conferidos na tabela CID-10 do DATASUS e, quando aplicável, na Portaria SES/RS 440/2024. Onde não havia código único seguro, `cids` ficou vazio e a observação explica.

### Agravos sem PDF local (usar link do sistema/ficha)

- Anomalias congênitas
- Evento supostamente atribuível à vacinação ou imunização (ESAVI)
- Monkeypox (mpox)
- Óbito infantil
- Óbito materno
- Síndrome Inflamatória Multissistêmica em Adultos (SIM-A) associada à covid-19
- Síndrome Inflamatória Multissistêmica Pediátrica (SIM-P) associada à covid-19
- Síndrome Respiratória Aguda Grave (SRAG) associada a coronavírus
- Síndrome Gripal por covid-19 confirmada
- Violência doméstica e/ou outras violências
- Violência sexual e tentativa de suicídio
