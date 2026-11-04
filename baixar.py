#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monta a colecao de fichas de notificacao do SINAN e o indice da Lista Nacional
de Notificacao Compulsoria (Brasil), com enfase no uso por medico de familia no RS.

Uso:
    python3 baixar.py

O script:
  - baixa as fichas em PDF para ./fichas/ (pula as que ja existem e sao PDF valido);
  - regera ./indice.json;
  - regera ./fontes.md.

Somente biblioteca padrao. Nao requer login.
"""

import datetime
import json
import os
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
FICHAS_DIR = os.path.join(ROOT, "fichas")
BASE = "https://portalsinan.saude.gov.br"

FONTE_NAC = (
    "Portaria GM/MS nº 11.211, de 13/05/2026, que altera o Anexo 1 do Anexo V da "
    "Portaria de Consolidação GM/MS nº 4/2017 — "
    "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11211_14_05_2026.html"
)
FONTE_RS = (
    "Portaria SES/RS nº 440/2024 (lista estadual complementar) — "
    "https://www.cevs.rs.gov.br/upload/arquivos/202408/09144159-portaria-440-2024.pdf"
)
FONTE_SINAN = "Portal SINAN — https://portalsinan.saude.gov.br/doencas-e-agravos"

URL_ESUS = "https://www.gov.br/pt-br/servicos/acessar-sistema-e-sus-notifica"
URL_SIVEP = "https://sivepgripe.saude.gov.br/sivepgripe/"
URL_SIM = "https://www.gov.br/saude/pt-br/composicao/svsa/sistemas-de-informacao/sim"
URL_SINASC = (
    "https://www.gov.br/saude/pt-br/composicao/svsa/sistemas-de-informacao/"
    "sinasc/sistema-de-informacoes-sobre-nascidos-vivos"
)


def _path(rel):
    if rel.startswith("DRT/"):
        return "images/" + rel
    return "images/documentos/Agravos/" + rel


# nome local -> caminho no Portal SINAN
FICHAS = {
    "acidente_material_biologico.pdf": _path("DRT/DRT_Acidente_Trabalho_Biologico.pdf"),
    "acidente_trabalho_grave.pdf": _path("DRT/DRT_Acidente_Trabalho_Grave.pdf"),
    "aids_adulto.pdf": _path("AidsAdulto/Aids_adulto_v5.pdf"),
    "aids_crianca.pdf": _path("AidsCrianca/Aids_crianca_v5.pdf"),
    "animais_peconhentos.pdf": _path("AAP/Animais_Peconhentos_v5.pdf"),
    "atendimento_antirrabico.pdf": _path("Atendimento%20Anti-rabico/anti_rabico_v5.pdf"),
    "botulismo.pdf": _path("Botulismo/Botulismo_v5.pdf"),
    "cancer_trabalho.pdf": _path("DRT/DRT_CANCER.pdf"),
    "chagas.pdf": _path("Chagas/Chagas_v5.pdf"),
    "colera.pdf": _path("Colera/Colera_v5.pdf"),
    "coqueluche.pdf": _path("Coqueluche/Coqueluche_v5.pdf"),
    "dengue_chikungunya.pdf": _path("Dengue/Ficha_DENGCHIK_FINAL.pdf"),
    "dermatoses_ocupacionais.pdf": _path("DRT/DRT_DERMATOSES.pdf"),
    "difteria.pdf": _path("Difteria/Difteria_v5.pdf"),
    "epizootia.pdf": _path("Epizootia/EPIZOO_NET_v5.pdf"),
    "esquistossomose.pdf": _path("Esquistossomose/Esquistossomose_v5.pdf"),
    "exantematica.pdf": _path("Exantematicas/Exantematica_v5.pdf"),
    "febre_amarela.pdf": _path("Febre%20Amarela/Febre_Amarela_v5.pdf"),
    "febre_maculosa.pdf": _path("Febre%20Maculosa/Febre_Maculosa_v5.pdf"),
    "febre_nilo.pdf": _path("Febre_do_Nilo/FEBRE_DO_NILO.pdf"),
    "febre_tifoide.pdf": _path("Febre-Tifoide/Febre_Tifoide_v5.pdf"),
    "hanseniase.pdf": _path("Hanseniase/Hanseniase_v5.pdf"),
    "hantavirose.pdf": _path("Hantavirose/Hantavirose_v5.pdf"),
    "hepatites_virais.pdf": _path("Hepatites_Virais/Ficha_Hepatites_Virais.pdf"),
    "hiv_gestante.pdf": _path("GestanteHIV/Gestante_HIV_v5.pdf"),
    "influenza.pdf": _path("Influenza/Influenza_v5.pdf"),
    "intoxicacao_exogena.pdf": _path("iexog/Intoxicacao_Exogena_v5.pdf"),
    "investigacao_surto.pdf": _path("Surto/Investigacao_surto_v5.pdf"),
    "leishmaniose_tegumentar.pdf": _path("Leishmaniose%20Tegumentar%20Americana/LTA_v5.pdf"),
    "leishmaniose_visceral.pdf": _path("Leishmaniose%20Visceral/LV_v5.pdf"),
    "leptospirose.pdf": _path("Leptospirose/Ficha_Leptospirose.pdf"),
    "ler_dort.pdf": _path("DRT/DRT_LERDORT.pdf"),
    "malaria.pdf": _path("Malaria/Malaria_v5.pdf"),
    "meningite.pdf": _path("Meningite/Meningite_v5.pdf"),
    "notificacao_conclusao.pdf": _path("NINDIV/Ficha_conclusao_v5.pdf"),
    "notificacao_individual.pdf": _path("NINDIV/Notificacao_Individual_v5.pdf"),
    "pair.pdf": _path("DRT/DRT_PAIR.pdf"),
    "peste.pdf": _path("Peste/Peste_v5.pdf"),
    "pfa.pdf": _path("PFA-Poliomielite/PFA_v5.pdf"),
    "pneumoconioses.pdf": _path("DRT/DRT_Pneumoconioses.pdf"),
    "raiva_humana.pdf": _path("Raiva%20Humana/Raiva_v5.pdf"),
    "sifilis_congenita.pdf": _path("Sifilis-Con/Sifilis_Congenita.pdf"),
    "sifilis_gestante.pdf": _path("Sifilis-Ges/Sifilis_Gestante.pdf"),
    "src.pdf": _path("SRC/SRC_v5.pdf"),
    "surto_dta.pdf": _path("DTA/Surto_DTA_v5.pdf"),
    "tetano_acidental.pdf": _path("tetanoacidental/Tetano_Acidental_v5.pdf"),
    "tetano_neonatal.pdf": _path("tetanoneonatal/Tetano_NeoNatal_v5.pdf"),
    "tracoma.pdf": _path("Tracoma/Tracoma_v5.pdf"),
    "transtornos_mentais.pdf": _path("DRT/DRT_TranstornosMentais.pdf"),
    "tuberculose.pdf": _path("Tuberculose/Tuberculose_v5.pdf"),
}

TODAS = ["MS", "SES", "SMS"]
GEN = "notificacao_individual.pdf"
GEN_NOME = "Ficha de Notificação Individual (genérica)"
GEN_OBS = (
    "Não há ficha específica publicada no Portal SINAN para este agravo na data de "
    "acesso; usar a Ficha de Notificação Individual (genérica)."
)


def E(agravo, sinonimos, cids, per, esferas, ficha=None, obs=None,
      sistema="SINAN", nome=None, url=None, fonte=None, prazo=None):
    if fonte is None:
        fonte = FONTE_NAC
    if esferas == "all":
        esferas = list(TODAS)
    if prazo is None:
        prazo = {"imediata": "até 24h", "semanal": "semanal", "outra": "conforme norma"}[per]
    if ficha is not None:
        rel = FICHAS[ficha]
        if url is None:
            url = BASE + "/" + rel
        if nome is None:
            nome = "Ficha de Notificação/Investigação — " + agravo
    return {
        "agravo": agravo,
        "sinonimos": sinonimos,
        "cids": cids,
        "periodicidade": per,
        "prazo_texto": prazo,
        "esferas": esferas,
        "sistema": sistema,
        "ficha_nome": nome,
        "ficha_url": url,
        "ficha_pdf": None,
        "_ficha": ficha,
        "observacao": obs,
        "fonte": fonte,
    }


AGRAVOS = [
    # ---------------- Lista Nacional (Portaria GM/MS 11.211/2026) ----------------
    E("Acidente de trabalho com exposição a material biológico",
      ["acidente com material biológico", "exposição ocupacional a material biológico"],
      [], "semanal", "all", "acidente_material_biologico.pdf",
      obs="Notificação semanal; o atendimento antirrábico e a profilaxia pós-exposição seguem fluxo próprio."),

    E("Acidente de trabalho",
      ["acidente de trabalho grave", "acidente de trabalho fatal", "acidente laboral"],
      [], "imediata", ["SMS"], "acidente_trabalho_grave.pdf",
      nome="Ficha de Notificação/Investigação — Acidente de Trabalho Grave",
      obs="A ficha SINAN disponível é a de acidente grave/fatal; acidentes sem gravidade são registrados no SIST/CEVS-RS (Portaria SES/RS 440/2024)."),

    E("Acidente por animal peçonhento",
      ["picada de cobra", "escorpião", "aranha", "abelha", "lagarta", "animal venenoso"],
      ["T63"], "imediata", ["SMS"], "animais_peconhentos.pdf"),

    E("Acidente por animal potencialmente transmissor da raiva",
      ["mordedura", "arranhadura", "antirrábico", "exposição à raiva"],
      ["Z20.3"], "imediata", ["SMS"], "atendimento_antirrabico.pdf",
      nome="Ficha de Notificação/Investigação — Atendimento Antirrábico"),

    E("Anomalias congênitas",
      ["malformação congênita", "defeito congênito"],
      [], "semanal", "all", None, sistema="SINASC", nome="SINASC — Declaração de Nascido Vivo (DNV)",
      url=URL_SINASC,
      obs="Notificação no SINASC (DNV) e investigação; não há ficha SINAN específica. CID-10: capítulo XVII (Q00–Q99)."),

    E("Botulismo", ["botulismo alimentar", "botulismo infantil"],
      ["A05.1"], "imediata", "all", "botulismo.pdf"),

    E("Câncer relacionado ao trabalho",
      ["neoplasia ocupacional", "câncer ocupacional"],
      ["C80"], "semanal", "all", "cancer_trabalho.pdf",
      obs="CID C80 conforme Portaria SES/RS 440/2024; o código deve refletir o sítio tumoral quando conhecido."),

    E("Cólera", ["vibrio cholerae"], ["A00"], "imediata", "all", "colera.pdf"),

    E("Coqueluche", ["pertussis", "tosse comprida"], ["A37"], "imediata", ["SES", "SMS"], "coqueluche.pdf"),

    E("Dengue — casos", ["dengue clássico", "arbovirose"], ["A90"], "semanal", "all", "dengue_chikungunya.pdf",
      nome="Ficha de Notificação/Investigação — Dengue/Chikungunya",
      obs="Casos suspeitos/confirmados: notificação semanal. Óbitos têm ficha e prazo próprios (ver item seguinte)."),

    E("Dengue — óbitos", ["óbito por dengue", "dengue grave"], ["A90", "A91"], "imediata", "all", "dengue_chikungunya.pdf",
      nome="Ficha de Notificação/Investigação — Dengue/Chikungunya",
      obs="Óbito suspeito/confirmado por dengue: notificação imediata (até 24h) a MS, SES e SMS."),

    E("Dermatoses ocupacionais", ["dermatose do trabalho", "dermatite ocupacional"],
      ["L98.9"], "semanal", "all", "dermatoses_ocupacionais.pdf",
      obs="CID L98.9 conforme Portaria SES/RS 440/2024."),

    E("Difteria", ["corynebacterium diphtheriae"], ["A36"], "imediata", "all", "difteria.pdf",
      obs="Periodicidade alterada pela Portaria GM/MS 11.211/2026: imediata para MS, SES e SMS."),

    E("Distúrbio de voz relacionado ao trabalho", ["disfonia ocupacional", "rouquidão ocupacional"],
      ["R49"], "semanal", "all", GEN, nome=GEN_NOME, obs=GEN_OBS + " CID R49 é sugestivo, não exclusivo."),

    E("Doença de Chagas aguda", ["tripanossomíase americana aguda", "chagas agudo"],
      ["B57.0", "B57.1"], "imediata", ["SES", "SMS"], "chagas.pdf",
      nome="Ficha de Notificação/Investigação — Doença de Chagas"),

    E("Doença de Chagas crônica", ["chagas crônico", "cardiopatia chagásica", "megaesôfago chagásico"],
      ["B57.2", "B57.3", "B57.4", "B57.5"], "semanal", "all", "chagas.pdf",
      nome="Ficha de Notificação/Investigação — Doença de Chagas"),

    E("Doença de Creutzfeldt-Jakob (DCJ)", ["DCJ", "encefalopatia espongiforme"],
      ["A81.0"], "semanal", "all", GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Doença falciforme", ["anemia falciforme", "hemoglobinopatia S", "traço falciforme"],
      ["D57"], "semanal", "all", GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Doença invasiva por Haemophilus influenzae",
      ["Hib", "haemophilus influenzae invasivo"],
      ["A41.3", "G00.0"], "imediata", ["SES", "SMS"], GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Doença meningocócica e outras meningites",
      ["meningite meningocócica", "meningococcemia", "meningite bacteriana", "meningite viral"],
      ["A39", "G00", "G01", "G02", "G03", "A87"], "imediata", ["SES", "SMS"], "meningite.pdf",
      nome="Ficha de Notificação/Investigação — Meningites"),

    E("Doenças com suspeita de disseminação intencional",
      ["antraz pneumônico", "tularemia", "varíola", "bioterrorismo"],
      ["A22", "A21", "B03"], "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Inclui antraz pneumônico, tularemia e varíola; acionar CIEVS imediatamente."),

    E("Doenças febris hemorrágicas emergentes/reemergentes",
      ["arenavírus", "ebola", "marburg", "lassa", "febre purpúrica brasileira"],
      ["A96.8", "A98.4", "A98.3", "A96.2", "A48.4"], "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Acionar CIEVS imediatamente; investigação especial."),

    E("Doença aguda pelo vírus Zika", ["zika", "arbovirose zika"], ["A92.8"],
      "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " O Portal SINAN remete à Ficha de Notificação/Conclusão para Zika."),

    E("Doença aguda pelo vírus Zika em gestante", ["zika na gravidez", "zika gestacional"],
      ["A92.8", "O98.5"], "imediata", ["SES", "SMS"], GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificação imediata para SES/SMS; acompanhar recém-nascido."),

    E("Óbito com suspeita de doença pelo vírus Zika", ["óbito por zika"],
      ["A92.8"], "imediata", "all", GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Síndrome congênita associada à infecção pelo vírus Zika",
      ["síndrome congênita do zika", "microcefalia por zika"],
      ["P35.4"], "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " CID P35.4 (atualização da CID-10); notificar também no RESP/Registro de Eventos em Saúde Pública."),

    E("Esporotricose humana", ["sporothrix", "esporotricose linfocutânea", "esporotricose cutânea"],
      ["B42"], "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Incluída na lista nacional pela Portaria GM/MS 6.734/2025."),

    E("Esquistossomose", ["bilharziose", "schistosoma mansoni"], ["B65"],
      "semanal", "all", "esquistossomose.pdf"),

    E("Evento de Saúde Pública (ESP)", ["surto", "emergência de saúde pública", "evento inusitado"],
      [], "imediata", "all", "investigacao_surto.pdf",
      nome="Ficha de Investigação de Surto (SINAN)",
      obs="Usar a ficha de investigação de surto; comunicar imediatamente ao CIEVS/SES e SMS."),

    E("Evento supostamente atribuível à vacinação ou imunização (ESAVI)",
      ["evento adverso pós-vacinação", "EAPV", "reação adversa à vacina"],
      [], "imediata", "all", None, sistema="e-SUS Notifica",
      nome="e-SUS Notifica — módulo ESAVI", url=URL_ESUS,
      obs="Notificação em sistema eletrônico (e-SUS Notifica/ESAVI); não usar ficha SINAN."),

    E("Febre amarela", ["febre amarela silvestre", "febre amarela urbana"], ["A95"],
      "imediata", "all", "febre_amarela.pdf"),

    E("Febre de Chikungunya — casos", ["chikungunya", "chikungunha"], ["A92.0"],
      "semanal", "all", "dengue_chikungunya.pdf",
      nome="Ficha de Notificação/Investigação — Dengue/Chikungunya"),

    E("Febre de Chikungunya em áreas sem transmissão",
      ["chikungunya importada", "chikungunya em área indene"], ["A92.0"],
      "imediata", "all", "dengue_chikungunya.pdf",
      nome="Ficha de Notificação/Investigação — Dengue/Chikungunya",
      obs="Notificação imediata para MS, SES e SMS quando o caso ocorre em área sem transmissão."),

    E("Óbito com suspeita de Febre de Chikungunya", ["óbito por chikungunya"], ["A92.0"],
      "imediata", "all", "dengue_chikungunya.pdf",
      nome="Ficha de Notificação/Investigação — Dengue/Chikungunya"),

    E("Febre do Nilo Ocidental e outras arboviroses de importância em saúde pública",
      ["West Nile", "febre do Nilo", "arbovirose emergente"],
      ["A92.3"], "imediata", "all", "febre_nilo.pdf",
      nome="Ficha de Notificação/Investigação — Febre do Nilo Ocidental"),

    E("Febre do Oropouche — casos", ["oropouche", "vírus oropouche", "Oropouche"], [],
      "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Incluída na lista nacional pela Portaria GM/MS 11.211/2026."),

    E("Febre do Oropouche — óbitos e óbitos fetais", ["óbito por oropouche", "óbito fetal por oropouche"], [],
      "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificação imediata (até 24h) a MS, SES e SMS."),

    E("Febre do Oropouche em gestante", ["oropouche na gravidez", "oropouche gestacional"], [],
      "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificação imediata; acompanhar desfecho gestacional e anomalias congênitas."),

    E("Febre do Oropouche — anomalias congênitas", ["oropouche congênito", "malformação por oropouche"], [],
      "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificação imediata; avaliar nexo com infecção materna."),

    E("Febre Maculosa e outras Riquetisioses",
      ["febre maculosa brasileira", "carrapato", "rickettsia", "tifo"],
      ["A77.0"], "imediata", "all", "febre_maculosa.pdf",
      nome="Ficha de Notificação/Investigação — Febre Maculosa"),

    E("Febre Tifoide", ["febre tifóide", "salmonella typhi"], ["A01.0"],
      "imediata", ["SES", "SMS"], "febre_tifoide.pdf"),

    E("Hanseníase", ["lepra", "doença de Hansen"], ["A30"], "semanal", "all", "hanseniase.pdf"),

    E("Hantavirose", ["hantavírus", "síndrome cardiopulmonar por hantavírus"], ["B33.4"],
      "imediata", "all", "hantavirose.pdf"),

    E("Hepatites virais", ["hepatite A", "hepatite B", "hepatite C", "hepatite D", "hepatite E"],
      ["B15", "B16", "B17", "B18", "B19"], "semanal", "all", "hepatites_virais.pdf",
      nome="Ficha de Notificação/Investigação — Hepatites Virais"),

    E("Infecção pelo vírus da hepatite B em gestante, parturiente ou puérpera e criança exposta",
      ["hepatite B gestante", "transmissão vertical hepatite B", "HBsAg positivo na gestação"],
      ["B16", "O98.4"], "semanal", "all", "hepatites_virais.pdf",
      nome="Ficha de Notificação/Investigação — Hepatites Virais",
      obs="Notificar a gestante/parturiente/puérpera e a criança exposta; usar campos específicos da ficha de hepatites."),

    E("HIV/AIDS", ["AIDS", "infecção pelo HIV", "HIV positivo", "síndrome da imunodeficiência adquirida"],
      ["B20", "B21", "B22", "B23", "B24", "Z21"], "semanal", "all", "aids_adulto.pdf",
      nome="Ficha de Notificação/Investigação — AIDS (adulto)",
      obs="Para menores de 13 anos, usar fichas/aids_crianca.pdf (mesmo prazo)."),

    E("Infecção pelo HIV em gestante, parturiente ou puérpera e criança exposta",
      ["HIV gestante", "transmissão vertical do HIV", "gestante HIV positivo"],
      ["B20", "B24", "Z21"], "semanal", "all", "hiv_gestante.pdf",
      nome="Ficha de Notificação/Investigação — Gestante HIV"),

    E("Infecção pelo vírus linfotrópico de células T humanas (HTLV)",
      ["HTLV", "HTLV-1", "HTLV-2"], ["Z22.6"], "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " CID Z22.6 (portador de HTLV-1); para HTLV-2 pode ser necessário código adicional."),

    E("Infecção pelo HTLV em gestante, parturiente ou puérpera e criança exposta",
      ["HTLV gestante", "transmissão vertical do HTLV"], ["Z22.6"],
      "semanal", "all", GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Influenza humana produzida por novo subtipo viral",
      ["influenza novo subtipo", "gripe aviária", "novo subtipo de influenza"],
      ["J09"], "imediata", "all", "influenza.pdf",
      obs="Casos de novo subtipo são de notificação imediata; a ficha de influenza do SINAN é usada na vigilância sentinela de SG."),

    E("Intoxicação exógena",
      ["intoxicação por agrotóxico", "intoxicação medicamentosa", "envenenamento", "exposição a substância química"],
      ["T36-T65"], "semanal", "all", "intoxicacao_exogena.pdf",
      obs="CID-10: faixa T36–T65, conforme o agente; a ficha permite especificar o produto."),

    E("Leishmaniose Tegumentar Americana", ["LTA", "leishmaniose cutânea", "leishmaniose mucocutânea"],
      ["B55.1", "B55.2"], "semanal", "all", "leishmaniose_tegumentar.pdf"),

    E("Leishmaniose Visceral", ["calazar", "LV", "leishmaniose visceral"], ["B55.0"],
      "semanal", "all", "leishmaniose_visceral.pdf"),

    E("Leptospirose", ["leptospira", "doença do rato"], ["A27"], "imediata", ["SMS"],
      "leptospirose.pdf"),

    E("Lesões por Esforços Repetitivos/Distúrbios Osteomusculares Relacionados ao Trabalho (LER/DORT)",
      ["LER", "DORT", "LTC", "doença osteomuscular relacionada ao trabalho"],
      ["Z57.9"], "semanal", "all", "ler_dort.pdf",
      obs="CID Z57.9 conforme Portaria SES/RS 440/2024; se houver diagnóstico específico, codificar também a doença."),

    E("Malária na região amazônica", ["malária", "paludismo", "plasmodium"],
      ["B50", "B51", "B52", "B53", "B54"], "semanal", "all", "malaria.pdf"),

    E("Malária na região extra-Amazônica", ["malária importada", "malária fora da Amazônia"],
      ["B50", "B51", "B52", "B53", "B54"], "imediata", "all", "malaria.pdf",
      obs="Notificação imediata para MS, SES e SMS na região extra-Amazônica."),

    E("Monkeypox (mpox)", ["varíola dos macacos", "mpox", "monkeypox"], ["B04"],
      "imediata", "all", None, sistema="e-SUS Notifica", nome="e-SUS Notifica — módulo mpox",
      url=URL_ESUS, obs="Notificação em sistema eletrônico; não usar ficha SINAN."),

    E("Óbito infantil", ["morte infantil", "óbito em menor de 1 ano"], [],
      "semanal", "all", None, sistema="SIM", nome="SIM — Declaração de Óbito (DO)", url=URL_SIM,
      obs="Notificação/investigação no SIM; não há ficha SINAN. Verificar fluxo de investigação de óbito infantil do município."),

    E("Óbito materno", ["morte materna", "óbito na gestação", "óbito no puerpério"], [],
      "semanal", "all", None, sistema="SIM", nome="SIM — Declaração de Óbito (DO)", url=URL_SIM,
      obs="Notificação/investigação no SIM; não há ficha SINAN. Prazo e fluxo seguem a vigilância do óbito materno."),

    E("Perda Auditiva relacionada ao trabalho", ["PAIR", "perda auditiva ocupacional", "ruído"],
      ["H83.3"], "semanal", "all", "pair.pdf",
      obs="CID H83.3 conforme Portaria SES/RS 440/2024."),

    E("Pneumoconioses relacionadas ao trabalho", ["pneumoconiose", "silicose", "asbestose"],
      ["J64"], "semanal", "all", "pneumoconioses.pdf",
      obs="CID J64 conforme Portaria SES/RS 440/2024."),

    E("Peste", ["peste bubônica", "yersinia pestis"], ["A20"], "imediata", "all", "peste.pdf"),

    E("Poliomielite/Paralisia Flácida Aguda (PFA)", ["pólio", "PFA", "paralisia flácida"],
      ["A80"], "imediata", "all", "pfa.pdf",
      nome="Ficha de Notificação/Investigação — Poliomielite/PFA",
      obs="Notificar todo caso de PFA em menor de 15 anos ou com suspeita de pólio; CID A80 aplica-se à poliomielite."),

    E("Raiva humana", ["raiva", "hidrofobia", "lyssavirus"], ["A82"],
      "imediata", "all", "raiva_humana.pdf"),

    E("Síndrome da Rubéola Congênita", ["SRC", "rubéola congênita"], ["P35.0"],
      "imediata", "all", "src.pdf"),

    E("Sarampo", ["sarampo", "rubeola", "doença exantemática"], ["B05"],
      "imediata", "all", "exantematica.pdf",
      nome="Ficha de Notificação/Investigação — Doenças Exantemáticas (sarampo/rubéola)",
      obs="Usar a ficha conjunta de doenças exantemáticas; notificação imediata e bloqueio vacinal."),

    E("Rubéola", ["rubéola", "sarampo", "doença exantemática"], ["B06"],
      "imediata", "all", "exantematica.pdf",
      nome="Ficha de Notificação/Investigação — Doenças Exantemáticas (sarampo/rubéola)",
      obs="Usar a ficha conjunta de doenças exantemáticas; notificação imediata."),

    E("Sífilis adquirida", ["sífilis", "sífilis primária", "sífilis secundária", "sífilis latente"],
      ["A51", "A52", "A53"], "semanal", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificar também parcerias sexuais quando indicado."),

    E("Sífilis congênita", ["sífilis congênita", "sífilis neonatal"], ["A50"],
      "semanal", "all", "sifilis_congenita.pdf"),

    E("Sífilis em gestante", ["sífilis gestacional", "sífilis na gravidez"], ["O98.1"],
      "semanal", "all", "sifilis_gestante.pdf"),

    E("Síndrome Inflamatória Multissistêmica em Adultos (SIM-A) associada à covid-19",
      ["SIM-A", "MIS-A", "multissistêmica adulto"], [], "imediata", "all", None,
      sistema="e-SUS Notifica", nome="e-SUS Notifica — formulário eletrônico", url=URL_ESUS,
      obs="Notificação em sistema eletrônico; confirmar o módulo vigente no município/estado."),

    E("Síndrome Inflamatória Multissistêmica Pediátrica (SIM-P) associada à covid-19",
      ["SIM-P", "MIS-C", "multissistêmica pediátrica", "Kawasaki-like"], [], "imediata", "all", None,
      sistema="e-SUS Notifica", nome="e-SUS Notifica — formulário eletrônico", url=URL_ESUS,
      obs="Notificação em sistema eletrônico; confirmar o módulo vigente no município/estado."),

    E("Síndrome Respiratória Aguda Grave (SRAG) associada a coronavírus",
      ["SRAG", "SARS", "SRAG por covid-19", "SRAG hospitalizado"], ["U04", "U07.1"],
      "imediata", "all", None, sistema="SIVEP-Gripe", nome="SIVEP-Gripe — formulário eletrônico",
      url=URL_SIVEP,
      obs="Notificação no SIVEP-Gripe (hospitalizado ou óbito por SRAG); não usar ficha SINAN."),

    E("Síndrome Gripal por covid-19 confirmada", ["SG covid", "síndrome gripal covid-19", "gripe covid"],
      ["U07.1"], "imediata", "all", None, sistema="e-SUS Notifica",
      nome="e-SUS Notifica — formulário eletrônico", url=URL_ESUS,
      obs="Notificação em e-SUS Notifica; a covid-19 como agravo autônomo foi removida da lista pela Portaria 11.211/2026, permanecendo a SG confirmada e a SRAG."),

    E("Tétano acidental", ["tétano", "tetanus"], ["A35"], "imediata", ["SES", "SMS"],
      "tetano_acidental.pdf",
      obs="Periodicidade alterada pela Portaria 11.211/2026: imediata para SES e SMS."),

    E("Tétano neonatal", ["tétano do recém-nascido", "tétano umbilical"], ["A33"],
      "imediata", "all", "tetano_neonatal.pdf"),

    E("Toxoplasmose gestacional e congênita",
      ["toxoplasmose na gravidez", "toxoplasmose congênita", "toxoplasma gondii"],
      ["B58", "P37.1", "O98.6"], "semanal", "all", GEN, nome=GEN_NOME, obs=GEN_OBS),

    E("Transtornos mentais relacionados ao trabalho",
      ["transtorno mental ocupacional", "adoecimento mental no trabalho", "burnout ocupacional"],
      ["F99"], "semanal", "all", "transtornos_mentais.pdf",
      obs="CID F99 conforme Portaria SES/RS 440/2024 (transtorno mental não especificado)."),

    E("Tuberculose", ["TB", "bacilo de Koch", "tuberculose pulmonar", "tuberculose extrapulmonar"],
      ["A15", "A16", "A17", "A18", "A19"], "semanal", "all", "tuberculose.pdf"),

    E("Varicela", ["catapora", "varicela grave", "varicela em internado"],
      ["B01"], "imediata", ["SES", "SMS"], GEN, nome=GEN_NOME,
      obs=GEN_OBS + " A lista de 2026 voltou a incluir varicela, com notificação imediata para SES/SMS."),

    E("Violência doméstica e/ou outras violências",
      ["violência intrafamiliar", "violência física", "violência psicológica", "violência contra a mulher", "violência contra a pessoa idosa"],
      ["X85-Y09"], "semanal", "all", None, url="https://portalsinan.saude.gov.br/violencia-interpessoal-autoprovocada", nome="Ficha de Notificação Individual – Violência Interpessoal/Autoprovocada (SINAN)",
      obs=GEN_OBS + " Preencher também a ficha específica de violência quando disponível no município; sigilo e fluxo intersetorial."),

    E("Violência sexual e tentativa de suicídio",
      ["violência sexual", "estupro", "tentativa de suicídio", "autoprovocação"],
      ["X85-Y09"], "imediata", ["SMS"], None, url="https://portalsinan.saude.gov.br/violencia-interpessoal-autoprovocada", nome="Ficha de Notificação Individual – Violência Interpessoal/Autoprovocada (SINAN)",
      obs=GEN_OBS + " Notificação imediata à SMS; garantir sigilo, profilaxias e rede de apoio."),

    E("Parotidite (Caxumba)", ["caxumba", "parotidite epidêmica", "papeira"], ["B26"],
      "outra", "all", GEN, nome=GEN_NOME, prazo="CONFERIR: o texto da Portaria 11.211/2026 diz imediata (MS/SES/SMS); a tabela do anexo marca uma só coluna",
      obs=GEN_OBS + " Incluída na lista nacional pela Portaria GM/MS 11.211/2026. Confirme o prazo com a vigilância do município."),

    # ---------------- Lista estadual complementar (CEVS-RS) ----------------
    E("Hidatidose", ["equinococose", "cisto hidático", "echinococcus"], ["B67"],
      "semanal", ["SES", "SMS"], GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Agravo de interesse estadual no RS (Portaria SES/RS 440/2024), não incluído na lista nacional.",
      fonte=FONTE_RS),

    E("Síndrome mão-pé-boca (surto)", ["doença mão-pé-boca", "estomatite vesicular", "enterovírus"],
      ["B08.4"], "semanal", ["SES", "SMS"], GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Notificação de surto no RS (Anexo II da Portaria SES/RS 440/2024).",
      fonte=FONTE_RS),

    E("Toxoplasmose adquirida (surto)", ["toxoplasmose", "surto de toxoplasmose"], ["B58"],
      "imediata", "all", GEN, nome=GEN_NOME,
      obs=GEN_OBS + " Surto de toxoplasmose adquirida: notificação imediata no RS (Anexo II da Portaria SES/RS 440/2024).",
      fonte=FONTE_RS),

    # ---------------- Formularios gerais e fichas SINAN extra ----------------
    E("Ficha de Notificação Individual (genérica)", ["NINDIV", "ficha genérica", "notificação individual"],
      [], "outra", "all", GEN, nome=GEN_NOME,
      obs="Formulário universal do SINAN para agravos sem ficha específica; preencher os campos 1 a 39.",
      fonte=FONTE_SINAN),

    E("Ficha de Notificação/Conclusão (genérica)", ["ficha de conclusão", "encerramento de caso"],
      [], "outra", "all", "notificacao_conclusao.pdf",
      nome="Ficha de Notificação/Conclusão (genérica)",
      obs="Usada para conclusão/encerramento de casos notificados no SINAN.",
      fonte=FONTE_SINAN),

    E("Epizootia", ["epizootia", "morte de primatas", "animal doente"], [],
      "outra", "all", "epizootia.pdf",
      obs="Vigilância de epizootias (ex.: primatas não humanos para febre amarela); não é agravo humano individual da lista nacional.",
      fonte=FONTE_SINAN),

    E("Tracoma", ["tracoma folicular", "conjuntivite tracomatosa", "chlamydia trachomatis"], ["A71"],
      "outra", "all", "tracoma.pdf",
      obs="Agravo de vigilância com ficha SINAN (boletim de inquérito), não incluído na lista nacional de 2026.",
      fonte=FONTE_SINAN),

    E("Surto de doenças transmitidas por alimentos (DTA)",
      ["surto de DTA", "intoxicação alimentar coletiva", "doença transmitida por alimento"],
      [], "imediata", "all", "surto_dta.pdf",
      obs="Investigação de surto de DTA; integra a vigilância de eventos de saúde pública.",
      fonte=FONTE_SINAN),
]


def baixar(nome, url, tentativas=4, timeout=60):
    destino = os.path.join(FICHAS_DIR, nome)
    if os.path.exists(destino) and os.path.getsize(destino) > 1000:
        with open(destino, "rb") as fh:
            if fh.read(4) == b"%PDF":
                return True
    os.makedirs(FICHAS_DIR, exist_ok=True)
    for tentativa in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (baixar.py SINAN)"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                dados = resp.read()
            if dados[:4] != b"%PDF" or len(dados) < 1000:
                raise ValueError("resposta não é PDF válido (%d bytes)" % len(dados))
            tmp = destino + ".part"
            with open(tmp, "wb") as fh:
                fh.write(dados)
            os.replace(tmp, destino)
            print("  baixado: %s (%d bytes)" % (nome, len(dados)))
            return True
        except Exception as exc:
            print("  falha %s tentativa %d/%d: %s" % (nome, tentativa, tentativas, exc))
            time.sleep(2 * tentativa)
    return False


def main():
    os.makedirs(FICHAS_DIR, exist_ok=True)
    print("Baixando fichas do Portal SINAN...")
    resultados = {}
    for nome, rel in FICHAS.items():
        resultados[nome] = baixar(nome, BASE + "/" + rel)
        time.sleep(0.4)

    # preenche ficha_pdf apenas quando o arquivo local existe e e PDF
    for item in AGRAVOS:
        nome = item.pop("_ficha", None)
        if nome and resultados.get(nome):
            caminho = os.path.join(FICHAS_DIR, nome)
            if os.path.exists(caminho) and os.path.getsize(caminho) > 1000:
                item["ficha_pdf"] = "fichas/" + nome

    with open(os.path.join(ROOT, "indice.json"), "w", encoding="utf-8") as fh:
        json.dump(AGRAVOS, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    hoje = datetime.date.today().isoformat()
    total = len(AGRAVOS)
    com_pdf = sum(1 for x in AGRAVOS if x["ficha_pdf"])
    falhas = [n for n, ok in resultados.items() if not ok]
    sem_ficha = [x["agravo"] for x in AGRAVOS if not x["ficha_pdf"]]

    linhas = [
        "# Fontes e método",
        "",
        "**Data de acesso:** %s  " % hoje,
        "**Recorte:** Brasil, com notas para o Rio Grande do Sul (CEVS-RS).",
        "",
        "## Portaria vigente",
        "",
        "- **Lista Nacional de Notificação Compulsória:** Anexo 1 do Anexo V da "
        "Portaria de Consolidação GM/MS nº 4, de 28/09/2017, na redação dada pela "
        "**Portaria GM/MS nº 11.211, de 13/05/2026**.",
        "  - Texto: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11211_14_05_2026.html",
        "  - A 11.211/2026 incluiu caxumba e febre do Oropouche, removeu a covid-19 "
        "como agravo autônomo e alterou nomenclaturas/periodicidades (difteria, tétano, varicela etc.).",
        "- Atos anteriores relevantes: Portaria GM/MS nº 10.175/2026 (anomalias congênitas), "
        "nº 6.734/2025 (esporotricose), nº 5.201/2024 (agravos relacionados ao trabalho) e "
        "nº 217/2023.",
        "- **Lista estadual complementar (RS):** Portaria SES/RS nº 440/2024, disponível em "
        "https://www.cevs.rs.gov.br/upload/arquivos/202408/09144159-portaria-440-2024.pdf",
        "",
        "## Como a periodicidade foi lida",
        "",
        "- **Imediata (até 24h):** esferas marcadas com X na coluna correspondente (MS, SES e/ou SMS).",
        "- **Semanal:** a tabela oficial tem uma única coluna semanal, sem discriminar esfera; "
        "por isso o índice registra `[MS, SES, SMS]`. Na prática, o serviço notifica a SMS, que "
        "consolida e envia à SES/MS.",
        "- **Outra:** usada apenas para formulários gerais e fichas SINAN que não são agravos "
        "individuais da lista (ex.: ficha genérica, epizootia, tracoma, surto de DTA).",
        "",
        "## URLs usadas",
        "",
        "- Portal SINAN (fichas): https://portalsinan.saude.gov.br/doencas-e-agravos",
        "- Lista de agravos: https://portalsinan.saude.gov.br/doencas-e-agravos?showall=1",
        "- CEVS-RS: https://cevs.rs.gov.br/",
        "- e-SUS Notifica: %s" % URL_ESUS,
        "- SIVEP-Gripe: %s" % URL_SIVEP,
        "- SIM: %s" % URL_SIM,
        "- SINASC: %s" % URL_SINASC,
        "",
        "## Resultado do último processamento",
        "",
        "- Agravos no índice: **%d**." % total,
        "- Agravos com PDF local: **%d**." % com_pdf,
        "- PDFs únicos baixados: **%d/%d**." % (len(FICHAS) - len(falhas), len(FICHAS)),
        "",
        "## Limitações",
        "",
        "- Várias fichas do SINAN são formulários universais (NINDIV) ou conjuntos "
        "(dengue/chikungunya, sarampo/rubéola, hepatites). O campo `ficha_pdf` aponta para o "
        "arquivo realmente usado; `observacao` explica o compartilhamento.",
        "- Agravos notificados em outros sistemas (e-SUS Notifica, SIVEP-Gripe, SIM, SINASC) "
        "não têm ficha SINAN e trazem `ficha_pdf: null`, com o link do sistema em `ficha_url`.",
        "- Os CIDs foram conferidos na tabela CID-10 do DATASUS e, quando aplicável, na "
        "Portaria SES/RS 440/2024. Onde não havia código único seguro, `cids` ficou vazio e "
        "a observação explica.",
    ]
    if falhas:
        linhas += ["", "### Falhas de download", ""] + ["- `%s`" % f for f in falhas]
    if sem_ficha:
        linhas += ["", "### Agravos sem PDF local (usar link do sistema/ficha)", ""] + [
            "- %s" % a for a in sem_ficha
        ]
    with open(os.path.join(ROOT, "fontes.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(linhas) + "\n")

    print("\nÍndice: %d agravos; %d com PDF local." % (total, com_pdf))
    if falhas:
        print("Falhas: %s" % ", ".join(falhas))


if __name__ == "__main__":
    main()
