/*
 * Modelos de evolução, impressos e fichas de consulta.
 * Textos-base: modelos do ambulatório de Procedimentos Médicos de APS (Policlínica Central, Santa Maria – RS).
 *
 * Cada modelo:
 *   id, tipo ("evolucao" | "impresso" | "consulta"), grupo (seção da tela inicial),
 *   titulo, resumo, sinonimos (para a busca), campos, e:
 *   linhas — (evolução) uma linha por item. {campo} vira o valor.
 *            {#} numera o passo (1, 2, 3…) e {#.} repete o número do passo anterior (para "1.1.").
 *            Uma linha pode ser { t: "...", se: "campo=valor" | "campo!=valor" | "campo" (preenchido) }.
 *   corpo  — (impresso/consulta) HTML. {campo} vira o valor e {campo=valor} vira ☐/☒.
 *   fundo  — (impresso) imagem do formulário oficial; os campos têm pos: {x, y, w} em % da folha.
 *
 * Campos: tipo texto | textolongo | numero | opcoes | data | calc
 *   padrao: "hoje" → data de hoje.        lembrar: true  → fica salvo neste aparelho (lote, CRM…).
 *   paciente: true → nunca é salvo.       opcional: true → pode ficar vazio sem contar como pendente.
 *   copia: "X"     → o que vai no texto copiado quando o campo opcional está vazio (padrão: nada).
 *   livre: true    → em "opcoes", permite escrever outra resposta.
 *   vazio: "..."   → como o campo aparece quando está em branco (padrão: o rótulo).
 *   formato: "extenso" → data por extenso (4 de novembro de 2026).
 *   calc: { de: "campo_data", anos: 3 } | { idade: "campo_nascimento" }
 */
(function(){

const SIM_NAO = ["sim", "não"];
const hoje = { tipo: "data", padrao: "hoje" };

/* cabeçalho de dados da paciente usado nas evoluções de contracepção */
const CAB_CAMPOS = [
  { id: "cabecalho", rotulo: "Cabeçalho da paciente", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
  { id: "g", rotulo: "Gestações", vazio: "X", tipo: "numero", opcional: true, copia: "X", paciente: true },
  { id: "pv", rotulo: "Partos vaginais", vazio: "X", tipo: "numero", opcional: true, copia: "X", paciente: true },
  { id: "pc", rotulo: "Partos cesáreos", vazio: "X", tipo: "numero", opcional: true, copia: "X", paciente: true },
  { id: "ab", rotulo: "Abortos", vazio: "X", tipo: "numero", opcional: true, copia: "X", paciente: true },
  { id: "escolaridade", rotulo: "Escolaridade", vazio: "…", tipo: "texto", opcional: true, paciente: true },
  { id: "estado_civil", rotulo: "Estado civil", vazio: "…", tipo: "texto", opcional: true, paciente: true },
  { id: "ocupacao", rotulo: "Ocupação", vazio: "…", tipo: "texto", opcional: true, paciente: true },
  { id: "genero", rotulo: "Identidade de gênero", vazio: "…", tipo: "texto", opcional: true, paciente: true },
  { id: "email", rotulo: "E-mail", vazio: "…", tipo: "texto", opcional: true, paciente: true }
];
const CAB_LINHAS = [
  { t: "# G{g} PV{pv} PC{pc} A{ab}", se: "cabecalho=sim" },
  { t: "# Escolaridade: {escolaridade}", se: "cabecalho=sim" },
  { t: "# Estado civil: {estado_civil}", se: "cabecalho=sim" },
  { t: "# Ocupação: {ocupacao}", se: "cabecalho=sim" },
  { t: "# Identidade de gênero: {genero}", se: "cabecalho=sim" },
  { t: "# E-mail: {email}", se: "cabecalho=sim" }
];

const ANTISS_PELE = { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", livre: true, lembrar: true,
  opcoes: ["Clorexidina solução aquosa", "Clorexidina 2% solução aquosa", "PVPI solução aquosa"], padrao: "Clorexidina solução aquosa" };
const INTERC = (padrao) => ({ id: "intercorrencia", rotulo: "Intercorrências", tipo: "opcoes", livre: true,
  opcoes: ["sem intercorrências", "com pequeno sangramento local, contido com compressão"], padrao: padrao || "sem intercorrências" });

/* textos comuns dos termos */
const DECL_FINAL = `
<p>Entendi as explicações que me foram prestadas, em linguagem clara e simples, esclarecendo-me todas as dúvidas que me ocorreram.</p>`;
const CONSINTO = `
<p>Assim, declaro que estou satisfeita com as informações recebidas e que compreendo o alcance e os riscos do tratamento. Consinto, portanto, ao (a) médico (a) a realizar o(s) procedimento(s) e permito que utilize seu julgamento técnico para que sejam alcançados os melhores resultados possíveis através dos recursos conhecidos na atualidade pela Medicina e disponíveis no local onde se realiza o(s) tratamento(s).</p>
<p>Confirmo que recebi explicações, li, compreendi e concordo com os itens acima referidos e apesar de ter entendido as explicações que me foram prestadas, de terem sido esclarecidas todas as dúvidas e estando plenamente satisfeito (a) com as informações recebidas RESERVO-ME o direito de revogar este consentimento antes que o procedimento, objeto deste documento, se realize.</p>`;
const EXPLIQUEI = (quem) => `
<div class="assin"><span></span>Assinatura da paciente/responsável</div>
<p class="local">{cidade}, {data}</p>
<p>Expliquei todo o procedimento, exame, tratamento e/ou cirurgia a que o paciente acima referido está sujeito, ao próprio paciente e/ou seu responsável, sobre os benefícios, riscos e alternativas, tendo respondido às perguntas formuladas pelos mesmos. De acordo com o meu entendimento, o paciente e/ou seu responsável, está em condições de compreender o que lhes foi informado.</p>
<div class="assin"><span></span>Assinatura e carimbo do profissional que prestou as informações</div>
<div class="assin"><span></span>Assinatura e carimbo do profissional que ${quem}</div>
<p class="local">{cidade}, {data}</p>`;
const CAMPOS_TERMO = [
  { id: "nome", rotulo: "Nome", tipo: "texto", paciente: true },
  { id: "nasc", rotulo: "Data de nascimento", tipo: "texto", placeholder: "dd/mm/aaaa", vazio: "dd/mm/aaaa", paciente: true },
  { id: "idade", rotulo: "Idade", tipo: "calc", idade: "nasc" },
  { id: "cpf", rotulo: "CPF", tipo: "texto", paciente: true },
  { id: "medico", rotulo: "Médico(a)", tipo: "texto", lembrar: true },
  { id: "crm", rotulo: "CRM", tipo: "texto", lembrar: true },
  { id: "cidade", rotulo: "Cidade", tipo: "texto", padrao: "Santa Maria – RS", lembrar: true },
  { id: "data", rotulo: "Data", tipo: "data", padrao: "hoje", formato: "extenso" }
];
const EU_CONSINTO = (proc) => `<p>Eu {nome} data de nascimento {nasc} CPF {cpf} com {idade} anos de idade, consinto que o médico(a) {medico} CRM {crm} realize em mim o procedimento de ${proc}.</p>`;

window.MODELOS = [

/* ===================== CONTRACEPÇÃO ===================== */
{
  id: "diu", tipo: "evolucao", grupo: "Contracepção",
  titulo: "DIU · inserção",
  resumo: "Cobre ou hormonal, com cabeçalho da paciente e passos numerados",
  sinonimos: ["diu", "dispositivo intrauterino", "cobre", "mirena", "kyleena", "inserção", "colocação", "contracepção"],
  campos: [
    ...CAB_CAMPOS,
    { id: "bhcg", rotulo: "β-HCG de laboratório", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "bhcg_data", rotulo: "Data do β-HCG", vazio: "XX/XX/XXXX", tipo: "texto", placeholder: "dd/mm/aaaa" },
    { id: "trg", rotulo: "Teste rápido hoje", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "colo", rotulo: "Colo uterino", tipo: "opcoes", livre: true, opcoes: ["dentro da normalidade"], padrao: "dentro da normalidade" },
    { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", livre: true, lembrar: true, opcoes: ["Clorexidina 2% solução aquosa", "PVPI solução aquosa"], padrao: "Clorexidina 2% solução aquosa" },
    { id: "bloqueio", rotulo: "Bloqueio paracervical", tipo: "opcoes", opcoes: SIM_NAO, padrao: "não" },
    { id: "lido_ml", rotulo: "Lidocaína 1% sem vaso", tipo: "numero", sufixo: "mL", padrao: "10", lembrar: true },
    { id: "histerometria", rotulo: "Histerometria", tipo: "numero", sufixo: "cm", vazio: "X" },
    { id: "tipo_diu", rotulo: "DIU", tipo: "opcoes", livre: true, opcoes: ["de Cobre", "hormonal (Mirena)", "hormonal (Kyleena)"], padrao: "de Cobre" },
    INTERC(),
    { id: "fio", rotulo: "Fio cortado a", tipo: "numero", sufixo: "cm", padrao: "2", lembrar: true },
    { id: "ustv", rotulo: "USTV de controle", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Ibuprofeno e Paracetamol", "Paracetamol", "Ibuprofeno"], padrao: "Ibuprofeno e Paracetamol" },
    { id: "retorno", rotulo: "Retorno em", tipo: "opcoes", livre: true, opcoes: ["30 a 45 dias"], padrao: "30 a 45 dias" }
  ],
  linhas: [
    ...CAB_LINHAS,
    "PROCEDIMENTO DE INSERÇÃO DE DIU:",
    "- Inicialmente conversado a respeito de método e fornecido TCLE. Orientações gerais, orientações de complicações possíveis inerentes ao procedimento (como por exemplo risco de endometrite/doença inflamatória pélvica pós procedimento, perfuração de endométrio/miométrio pelo histerômetro/DIU no momento do procedimento, etc). Paciente ciente, deseja inserção de método.",
    "- Paciente nega contraindicações ao método.",
    { t: "- LAB ({bhcg_data}): Beta-HCG: inferior a 25,0 (NEGATIVO).", se: "bhcg=sim" },
    { t: "- Teste rápido gestacional na data de hoje: NEGATIVO.", se: "trg=sim" },
    "{#}. Introduzido espéculo vaginal e centralizado colo uterino.",
    "{#.}.1. Colo uterino {colo}.",
    "{#}. Realizada assepsia vaginal com {antisseptico}.",
    { t: "{#}. Realizado bloqueio paracervical com Lidocaína 1% sem vasoconstrictor ({lido_ml} mL).", se: "bloqueio=sim" },
    "{#}. Pinçado colo uterino na porção anterior.",
    "{#}. Realizada histerometria, evidenciando {histerometria}cm.",
    "{#}. Realizada inserção de DIU {tipo_diu} {intercorrencia}.",
    "{#}. Cortado fio de DIU a cerca de {fio}cm do orifício cervical externo.",
    "{#}. Retirado espéculo e finalizado procedimento sem intercorrências.",
    { t: "- Solicito USTV de controle para posicionamento.", se: "ustv=sim" },
    { t: "- Oriento uso de preservativo até posicionamento adequado de método.", se: "ustv=sim" },
    "- Deixo {analgesia} para analgesia.",
    "- Retorno para reavaliação em {retorno} com equipe de enfermagem/médica para reavaliação ou antes se necessário.",
    "- Ao pronto socorro se necessário."
  ]
},
{
  id: "diu-retirada", tipo: "evolucao", grupo: "Contracepção",
  titulo: "DIU · retirada",
  resumo: "Retirada com pinça, cabeçalho da paciente",
  sinonimos: ["diu", "retirada", "remoção", "tirar diu", "dispositivo intrauterino", "cobre", "mirena"],
  campos: [
    ...CAB_CAMPOS,
    { id: "trg", rotulo: "Teste rápido hoje", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "colo", rotulo: "Colo uterino", tipo: "opcoes", livre: true, opcoes: ["sem particularidades"], padrao: "sem particularidades" },
    { id: "pinca", rotulo: "Pinça", tipo: "opcoes", livre: true, opcoes: ["Cheron", "Pozzi"], padrao: "Cheron", lembrar: true },
    { id: "tipo_diu", rotulo: "DIU", tipo: "opcoes", livre: true, opcoes: ["de Cobre", "hormonal"], padrao: "de Cobre" },
    INTERC(),
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Ibuprofeno e/ou Paracetamol", "Paracetamol"], padrao: "Ibuprofeno e/ou Paracetamol" }
  ],
  linhas: [
    ...CAB_LINHAS,
    "PROCEDIMENTO DE RETIRADA DE DIU:",
    "- Inicialmente conversado a respeito de método e fornecidas informações gerais. Orientações de complicações possíveis inerentes ao procedimento. Paciente ciente, deseja retirada de método.",
    "- Paciente nega chance de estar grávida.",
    { t: "- Teste rápido gestacional na data de hoje: NEGATIVO.", se: "trg=sim" },
    "{#}. Introduzido espéculo vaginal e centralizado colo uterino.",
    "{#.}.1. Colo uterino {colo}, com presença de fio de DIU.",
    "{#}. Pinçado fios de DIU com pinça {pinca}.",
    "{#}. Tracionado fios de DIU {tipo_diu} e retirado dispositivo {intercorrencia}.",
    "{#}. Retirado espéculo e finalizado procedimento sem intercorrências.",
    "- Orientações gerais e cuidados.",
    "- Oriento uso de preservativo para evitar gravidez indesejada e ISTs.",
    "- Oriento {analgesia} para analgesia.",
    "- Seguimento com ESF/UBS de referência.",
    "- Ao pronto socorro se necessário."
  ]
},
{
  id: "implanon", tipo: "evolucao", grupo: "Contracepção",
  titulo: "Implanon · inserção",
  resumo: "Braço, sutura, curativo e data prevista de remoção",
  sinonimos: ["implanon", "implante", "etonogestrel", "chip", "nxt", "inserção", "contracepção"],
  campos: [
    ...CAB_CAMPOS,
    { id: "bhcg", rotulo: "β-HCG de laboratório", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "bhcg_data", rotulo: "Data do β-HCG", vazio: "XX/XX/XXXX", tipo: "texto", placeholder: "dd/mm/aaaa" },
    { id: "trg", rotulo: "Teste rápido hoje", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    ANTISS_PELE,
    { id: "braco", rotulo: "Braço", tipo: "opcoes", opcoes: ["MSE", "MSD"], padrao: "MSE" },
    INTERC(),
    { id: "sutura", rotulo: "Sutura", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "fio", rotulo: "Fio", tipo: "opcoes", livre: true, opcoes: ["nylon 5-0", "nylon 4-0"], padrao: "nylon 5-0", lembrar: true },
    { id: "pontos", rotulo: "Pontos", tipo: "opcoes", livre: true, opcoes: ["1 ponto simples", "2 pontos simples"], padrao: "1 ponto simples" },
    { id: "curativo", rotulo: "Curativo", tipo: "opcoes", livre: true, opcoes: ["hemoblock", "gaze e micropore"], padrao: "hemoblock", lembrar: true },
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Ibuprofeno e/ou Paracetamol", "Paracetamol"], padrao: "Ibuprofeno e/ou Paracetamol" },
    { id: "data_proc", rotulo: "Data da inserção", ...hoje },
    { id: "remocao_linha", rotulo: "Data de remoção no texto", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "remocao", rotulo: "Remoção prevista", tipo: "calc", de: "data_proc", anos: 3 }
  ],
  linhas: [
    ...CAB_LINHAS,
    "PROCEDIMENTO DE INSERÇÃO DE IMPLANON:",
    "- Inicialmente conversado a respeito de método e fornecido TCLE. Orientações gerais, orientações de complicações possíveis inerentes ao procedimento (como por exemplo dor local, algum inchaço ou hematoma pequeno no local da colocação, etc). Paciente ciente, deseja inserção de método.",
    "- Paciente nega contraindicações ao método.",
    "- Paciente nega alergia medicamentosa.",
    { t: "- LAB ({bhcg_data}): Beta-HCG: inferior a 25,0 (NEGATIVO).", se: "bhcg=sim" },
    { t: "- Teste rápido gestacional na data de hoje: NEGATIVO.", se: "trg=sim" },
    "{#}. Realizada limpeza de pele com {antisseptico}.",
    "{#}. Realizada anestesia local com Lidocaína 2% sem vasoconstrictor.",
    "{#}. Realizada colocação de dispositivo em topografia subdérmica de {braco} {intercorrencia}.",
    { t: "{#}. Realizada anastomose primária com fio {fio} com {pontos}.", se: "sutura=sim" },
    "{#}. Realizada limpeza externa de pele com soro fisiológico 0,9%.",
    "{#}. Realizado curativo com {curativo}.",
    "- Orientações gerais e cuidados.",
    "- Oriento uso de preservativo por no mínimo 7 dias para evitar gravidez indesejada. Reforço importância do uso de preservativo para evitar ISTs.",
    "- Oriento uso de {analgesia} para analgesia se necessário.",
    { t: "- Remoção prevista para {remocao} (3 anos).", se: "remocao_linha=sim" },
    "- Seguimento de rotina com UBS/ESF de referência.",
    "- Ao pronto socorro se necessário."
  ]
},
{
  id: "implanon-retirada", tipo: "evolucao", grupo: "Contracepção",
  titulo: "Implanon · retirada",
  resumo: "Retirada do implante com anestesia local",
  sinonimos: ["implanon", "implante", "etonogestrel", "chip", "retirada", "remoção", "tirar implante"],
  campos: [
    ...CAB_CAMPOS,
    { id: "trg", rotulo: "Teste rápido hoje", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    ANTISS_PELE,
    { id: "braco", rotulo: "Braço", tipo: "opcoes", opcoes: ["MSE", "MSD"], padrao: "MSE" },
    INTERC(),
    { id: "sutura", rotulo: "Sutura", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "fio", rotulo: "Fio", tipo: "opcoes", livre: true, opcoes: ["nylon 5-0", "nylon 4-0"], padrao: "nylon 5-0", lembrar: true },
    { id: "pontos", rotulo: "Pontos", tipo: "opcoes", livre: true, opcoes: ["1 ponto simples", "2 pontos simples"], padrao: "1 ponto simples" },
    { id: "curativo", rotulo: "Curativo", tipo: "opcoes", livre: true, opcoes: ["hemoblock", "gaze e micropore"], padrao: "hemoblock", lembrar: true },
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Ibuprofeno e/ou Paracetamol", "Paracetamol"], padrao: "Ibuprofeno e/ou Paracetamol" }
  ],
  linhas: [
    ...CAB_LINHAS,
    "PROCEDIMENTO DE RETIRADA DE IMPLANON:",
    "- Inicialmente conversado a respeito de método e fornecidas informações gerais. Orientações de complicações possíveis inerentes ao procedimento. Paciente ciente, deseja retirada de método.",
    "- Paciente nega chance de estar grávida.",
    "- Paciente nega alergia medicamentosa.",
    { t: "- Teste rápido gestacional na data de hoje: NEGATIVO.", se: "trg=sim" },
    "{#}. Realizada limpeza de pele com {antisseptico}.",
    "{#}. Realizada anestesia local com Lidocaína 2% sem vasoconstrictor.",
    "{#}. Realizada retirada de dispositivo em topografia subdérmica de {braco} {intercorrencia}.",
    { t: "{#}. Realizada anastomose primária com fio {fio} com {pontos}.", se: "sutura=sim" },
    "{#}. Realizada limpeza externa de pele com soro fisiológico 0,9%.",
    "{#}. Realizado curativo com {curativo}.",
    "- Orientações gerais e cuidados.",
    "- Oriento uso de preservativo para evitar gravidez indesejada. Reforço importância do uso de preservativo para evitar ISTs.",
    "- Oriento uso de {analgesia} para analgesia se necessário.",
    "- Seguimento de rotina com UBS/ESF de referência.",
    "- Ao pronto socorro se necessário."
  ]
},
{
  id: "tcle-diu", tipo: "impresso", grupo: "Contracepção",
  titulo: "TCLE · DIU (cobre e hormonais)",
  resumo: "Termo completo, com nome, idade, médico e CRM preenchidos",
  sinonimos: ["tcle", "termo", "consentimento", "diu", "cobre", "hormonal", "mirena", "kyleena"],
  campos: CAMPOS_TERMO,
  corpo: `
<h1>Termo de consentimento informado para colocação de dispositivo intrauterino (DIU)</h1>
${EU_CONSINTO("inserção de dispositivo intrauterino")}
<p>Compreendo que o dispositivo intrauterino (DIU) é um dispositivo pequeno em forma de T ou Y implantado no útero por um médico. Existem DIUs não hormonais (DIU de Cobre e DIU de Cobre e/ou Prata) e DIU hormonal (DIU Mirena ou DIU Kyleena).</p>
<p>Os DIUs não hormonais consistem numa haste revestida com os metais citados (prata e/ou cobre). Eles liberam pequenas quantidades desses metais no útero, causando algumas alterações no endométrio (tecido que recobre a parte interna deste órgão), no muco e na motilidade das trompas, tornando a região hostil ao espermatozóide.</p>
<p>O DIU hormonal (DIU Mirena ou DIU Kyleena), além de produzir essas mesmas alterações no útero, possui em sua estrutura um reservatório que contém o hormônio chamado levonorgestrel, um tipo de progesterona. Esse hormônio é liberado aos poucos, dentro da cavidade uterina, e uma pequena quantidade pode ser absorvida pela corrente sanguínea causando alguns efeitos colaterais (1 a 10% das usuárias) como formação de cistos ovarianos, aumento de oleosidade da pele, acnes e queda de cabelo, porém, a maior concentração hormonal encontra-se dentro da cavidade uterina.</p>
<p>Também compreendi que a efetividade do DIU como método contraceptivo não é de 100%. Existe uma porcentagem de falha (0,2 a 0,8%) que independe do paciente ou médico, logo, há possibilidade de ocorrência de gravidez com o uso deste método e ela é menor que 1%. Os estudos médicos existentes indicam que quando as pacientes portadoras de DIU engravidam existe uma ocorrência maior de gravidez ectópica – gestação nas trompas (0,5 a 1%), de aborto séptico, isto é, com infecção associada (&lt;0,5%), às vezes associado à septicemia (isto é, infecção no sangue), ao choque séptico e até à morte.</p>
<p>Estou ciente de que todo procedimento médico se associa a alguns riscos. Poderá ocorrer penetração parcial ou total do DIU na parede do útero ocasionando perfuração do útero (0,2%) e eventualmente migração do dispositivo para o abdômen com necessidade de cirurgia.</p>
<p>Entendo também que após a colocação do DIU, poderão ocorrer cólicas e (ou) dores abdominais, associadas ou não a sangramentos e que o DIU que contém cobre poderá desenvolver uma reação cutânea alérgica do tipo urticária, sendo necessária sua remoção.</p>
<p>Os dispositivos intrauterinos têm prazo de validade (DIU Cobre - 10 anos, DIU Cobre/Prata - 5 anos e DIU Mirena - 8 anos e DIU Kyleena - 5 anos) e após este período um novo DIU deverá ser implantado para manutenção da contracepção.</p>
<p>O implante do DIU pode ser realizado em qualquer fase do ciclo menstrual, desde que seja excluída a possibilidade de uma gestação em curso. É necessária a presença de um acompanhante, pois algumas pacientes podem cursar com cólicas e tonturas após o procedimento.</p>
<p>Também fui informada sobre a existência de outros métodos contraceptivos não definitivos como preservativos masculinos e femininos (camisinhas), medicamentos hormonais anticoncepcionais (pílulas, injeção, anel e implante), alguns com taxas de falha maior que os DIUs e definitivos, como vasectomia e laqueadura tubária.</p>
<p>Entendi as explicações que me foram prestadas, em linguagem clara e simples, esclarecendo-me todas as dúvidas que me ocorreram. Também entendi que, a qualquer momento, antes que a inserção do DIU se realize e sem necessidade de dar nenhuma explicação, poderei revogar o consentimento que agora presto.</p>
${CONSINTO}
${EXPLIQUEI("colocou o DIU")}
`
},
{
  id: "tcle-diu-curto", tipo: "impresso", grupo: "Contracepção",
  titulo: "TCLE · DIU (versão curta, 8 itens)",
  resumo: "Com dados de identificação completos da paciente",
  sinonimos: ["tcle", "termo", "consentimento", "diu", "curto"],
  campos: [
    { id: "nome", rotulo: "Nome", tipo: "texto", paciente: true },
    { id: "nasc", rotulo: "Data de nascimento", tipo: "texto", placeholder: "dd/mm/aaaa", paciente: true },
    { id: "idade", rotulo: "Idade", tipo: "calc", idade: "nasc" },
    { id: "nacionalidade", rotulo: "Nacionalidade", tipo: "texto", paciente: true },
    { id: "estado_civil", rotulo: "Estado civil", tipo: "texto", paciente: true },
    { id: "endereco", rotulo: "Endereço", tipo: "texto", paciente: true },
    { id: "profissao", rotulo: "Profissão", tipo: "texto", paciente: true },
    { id: "naturalidade", rotulo: "Naturalidade", tipo: "texto", paciente: true },
    { id: "telefone", rotulo: "Telefone", tipo: "texto", paciente: true },
    { id: "rg", rotulo: "RG", tipo: "texto", paciente: true },
    { id: "cpf", rotulo: "CPF", tipo: "texto", paciente: true },
    { id: "cidade", rotulo: "Cidade", tipo: "texto", padrao: "Santa Maria – RS", lembrar: true },
    { id: "data", rotulo: "Data", tipo: "data", padrao: "hoje", formato: "extenso" }
  ],
  corpo: `
<h1>Termo de consentimento informado para colocação de dispositivo intrauterino (DIU)</h1>
<p>Nome: {nome} &nbsp; Data de nascimento: {nasc}</p>
<p>Idade: {idade} &nbsp; Nacionalidade: {nacionalidade} &nbsp; Estado civil: {estado_civil}</p>
<p>Endereço: {endereco}</p>
<p>Profissão: {profissao}</p>
<p>Naturalidade: {naturalidade}</p>
<p>Telefone: {telefone} &nbsp; RG: {rg} &nbsp; CPF: {cpf}</p>
<p>Declaro para os devidos fins que manifesto meu desejo de usar como método anticoncepcional o dispositivo intrauterino (DIU), depois de ter sido orientada sobre os demais métodos anticoncepcionais para o meu caso.</p>
<p>Declaro que recebi as seguintes informações:</p>
<ol>
<li>DIU é um pequeno objeto plástico que será colocado dentro do útero, por profissional habilitado, podendo ser retirado a qualquer momento, se houver necessidade ou se for meu desejo retirá-lo.</li>
<li>Como qualquer outro método anticoncepcional, mesmo quando bem indicado e bem colocado, pode apresentar falhas. Cinco a oito mulheres em cada mil engravidaram usando DIU no primeiro ano. Este número diminui ao longo do tempo.</li>
<li>Como qualquer procedimento, a colocação do DIU não é livre de riscos. Pode ocorrer em casos raros, perfuração uterina, hemorragia ou infecções. Se, no momento da colocação, surgir algum imprevisto, o procedimento será suspenso, visando garantir minha saúde e bem estar.</li>
<li>Mulheres que usam DIU podem ter alteração no ciclo menstrual e cólicas. Esses sintomas são mais comuns nos primeiros três meses e diminuem ou desaparecem com o passar do tempo.</li>
<li>Para diminuir a possibilidade de complicações e aumentar a eficácia do método, é muito importante que sejam seguidas as informações fornecidas pelo profissional de saúde, bem como as revisões periódicas programadas.</li>
<li>Se aparecerem sintomas que possam indicar problemas com o DIU, como hemorragias, dor intensa, corrimento vaginal amarelado ou febre sem explicação, devo me dirigir à unidade onde meu DIU foi colocado ou à emergência para avaliação.</li>
<li>Declaro, ainda, que recebi a orientação de que o DIU funciona apenas como anticoncepcional e não serve para prevenir doenças sexualmente transmissíveis, tendo sido orientada de como preveni-las.</li>
<li>Entendi as informações que me foram fornecidas em linguagem clara e simples e tive todas as minhas dúvidas esclarecidas. Recebi o cartão da paciente onde constam informações sobre o tipo do meu DIU, quando devo fazer a próxima revisão e quando devo trocá-lo.</li>
</ol>
<div class="assin"><span></span>Assinatura e carimbo do profissional que prestou as informações</div>
<div class="assin"><span></span>Assinatura e carimbo do profissional que colocou o DIU</div>
<div class="assin"><span></span>Assinatura da paciente</div>
<p class="local">{cidade}, {data}</p>
`
},
{
  id: "tcle-diu-bloqueio", tipo: "impresso", grupo: "Contracepção",
  titulo: "TCLE · DIU com bloqueio anestésico",
  resumo: "O seu rascunho em linguagem simples, com tabela de riscos",
  sinonimos: ["tcle", "termo", "consentimento", "diu", "bloqueio", "paracervical", "anestesia", "interno"],
  campos: [
    { id: "nome", rotulo: "Nome da paciente", tipo: "texto", paciente: true },
    { id: "nasc", rotulo: "Data de nascimento", tipo: "texto", placeholder: "dd/mm/aaaa", paciente: true },
    { id: "cns", rotulo: "CNS / prontuário", tipo: "texto", paciente: true },
    { id: "tipo_diu", rotulo: "Tipo de DIU", tipo: "opcoes", opcoes: ["cobre", "hormonal"], padrao: "cobre" },
    { id: "unidade", rotulo: "Unidade", tipo: "texto", lembrar: true },
    { id: "data", rotulo: "Data do procedimento", tipo: "data", padrao: "hoje" },
    { id: "medico", rotulo: "Médico(a)", tipo: "texto", lembrar: true },
    { id: "crm", rotulo: "CRM", tipo: "texto", lembrar: true }
  ],
  corpo: `
<h1>TCLE – Inserção de DIU com bloqueio anestésico</h1>
<p class="sub"><b>Termo de Consentimento Livre e Esclarecido.</b> Leia com calma, tire todas as dúvidas antes de assinar e só assine se concordar. Você fica com uma cópia.</p>
<h2>1. Identificação</h2>
<p>Nome da paciente: {nome}</p>
<p>Data de nascimento: {nasc} &nbsp;&nbsp; Prontuário / CNS: {cns}</p>
<p>Unidade: {unidade} &nbsp;&nbsp; Data do procedimento: {data}</p>
<p>Médico(a) responsável: {medico} &nbsp;&nbsp; CRM: {crm}</p>
<p class="checks">Tipo de DIU: <span>{tipo_diu=cobre} DIU de cobre</span><span>{tipo_diu=hormonal} DIU hormonal (levonorgestrel)</span></p>
<h2>2. O que vai ser feito</h2>
<p>O DIU é um pequeno objeto em forma de "T" colocado dentro do útero para evitar gravidez. Ele funciona por anos e pode ser retirado quando você quiser, com retorno da fertilidade.</p>
<p>A colocação é feita no consultório, em posição ginecológica, e dura em média 10 a 20 minutos:</p>
<ol>
<li>Exame de toque e colocação do espéculo (o mesmo do preventivo).</li>
<li>Limpeza do colo do útero com antisséptico.</li>
<li><b>Bloqueio anestésico:</b> aplicação de anestésico local (lidocaína) com agulha fina no colo do útero e ao redor dele, para diminuir a dor. Pode arder ou dar uma picada no momento da aplicação.</li>
<li>Medida do tamanho do útero com um instrumento específico.</li>
<li>Colocação do DIU e corte dos fios, que ficam dentro da vagina.</li>
</ol>
<p>O anestésico diminui a dor, mas não tira toda a sensação. É esperado sentir cólica durante e logo depois do procedimento. Você pode pedir para parar a qualquer momento.</p>
<h2>3. Benefícios e riscos</h2>
<p>O DIU é um dos métodos mais eficazes para evitar gravidez: menos de 1 em cada 100 mulheres engravida por ano usando. Não depende de lembrar de tomar remédio e dura de 3 a 10 anos, conforme o tipo. O DIU hormonal costuma diminuir o fluxo e as cólicas menstruais.</p>
<table>
<tr><th>O que pode acontecer</th><th>Frequência</th><th>O que significa</th></tr>
<tr><td>Cólica e pequeno sangramento</td><td>Comum</td><td>Esperado nos primeiros dias; melhora com analgésico.</td></tr>
<tr><td>Mudança na menstruação</td><td>Comum</td><td>DIU de cobre: fluxo e cólica podem aumentar. DIU hormonal: sangramento irregular nos primeiros meses, às vezes a menstruação para.</td></tr>
<tr><td>Tontura, palidez ou desmaio</td><td>Pouco comum</td><td>Reação do corpo à dor ou ao procedimento; costuma passar deitada, em minutos.</td></tr>
<tr><td>Saída do DIU (expulsão)</td><td>Cerca de 1 em 20</td><td>Mais comum nos primeiros meses. Pode exigir nova colocação.</td></tr>
<tr><td>Infecção no útero</td><td>Rara</td><td>Risco maior nas primeiras 3 semanas. Tem tratamento com antibiótico.</td></tr>
<tr><td>Perfuração do útero</td><td>Cerca de 1 em 1.000</td><td>O DIU atravessa a parede do útero. Pode ser preciso retirá-lo em hospital.</td></tr>
<tr><td>Reação ao anestésico</td><td>Rara</td><td>Alergia, ou formigamento na boca, gosto metálico, zumbido ou tontura. Avise na hora: a equipe está preparada para atender.</td></tr>
<tr><td>Gravidez com o DIU</td><td>Menos de 1 em 100 por ano</td><td>Se acontecer, há mais chance de ser fora do útero (ectópica), o que exige atendimento rápido.</td></tr>
</table>
<h2>4. Alternativas, seus direitos e participação do interno</h2>
<p><b>Alternativas.</b> Você pode escolher outro método (implante, injeção, pílula, preservativo, laqueadura ou vasectomia do parceiro). Também pode colocar o DIU sem o bloqueio anestésico, só com analgésico por boca.</p>
<p><b>Seus direitos.</b></p>
<ul>
<li>Tirar dúvidas antes, durante e depois do procedimento.</li>
<li>Desistir a qualquer momento, inclusive já na maca, sem perder o atendimento na unidade.</li>
<li>Ter um acompanhante de sua escolha na sala.</li>
<li>Pedir a retirada do DIU quando quiser.</li>
</ul>
<p><b>Participação de interno.</b> Esta unidade recebe estudantes de Medicina (internos). Com sua autorização, um interno poderá realizar partes do procedimento, sempre com o médico preceptor presente na sala, supervisionando e assumindo quando necessário. Recusar não muda em nada seu atendimento.</p>
<p class="checks"><span>☐ Autorizo a participação do interno, com supervisão do preceptor.</span><span>☐ Não autorizo. Quero que o procedimento seja feito apenas pelo médico.</span></p>
<h2>5. Depois da colocação</h2>
<p>Você fica em observação na unidade por 15 a 30 minutos antes de ir para casa. Siga as orientações da equipe sobre analgésico, relações sexuais e uso de outro método nos primeiros dias. O DIU não protege contra infecções sexualmente transmissíveis: continue usando preservativo.</p>
<p>Retorno marcado para: ____ / ____ / ________</p>
<p><b>Procure a unidade ou um pronto atendimento se tiver:</b></p>
<ul>
<li>Dor forte na barriga que não melhora com analgésico.</li>
<li>Febre ou calafrios.</li>
<li>Corrimento com mau cheiro.</li>
<li>Sangramento maior que uma menstruação forte.</li>
<li>Dor na relação sexual.</li>
<li>Sentir o DIU saindo, não sentir mais os fios ou sentir a parte dura do DIU.</li>
<li>Atraso menstrual ou sinais de gravidez.</li>
</ul>
<h2>6. Declaração e assinaturas</h2>
<p>Declaro que li (ou que leram para mim) este termo, que entendi as explicações e que tive a chance de fazer perguntas, todas respondidas. Escolho, por vontade própria, colocar o DIU com bloqueio anestésico. Sei que posso desistir a qualquer momento.</p>
<p>Local e data: {unidade}, {data}</p>
<div class="assin"><span></span>Assinatura da paciente (ou responsável legal)</div>
<div class="assin"><span></span>Testemunha ou acompanhante (nome e assinatura)</div>
<div class="assin"><span></span>Médico(a) responsável: {medico} &nbsp; CRM {crm}</div>
<div class="assin"><span></span>Interno(a), se participou (nome e assinatura)</div>
<p class="nota">Este termo é um modelo em revisão. Confira com o preceptor e com o protocolo da unidade antes de usar. Uma via fica com a paciente e outra no prontuário.</p>
`
},
{
  id: "tcle-implanon", tipo: "impresso", grupo: "Contracepção",
  titulo: "TCLE · Implanon",
  resumo: "Termo do implante de etonogestrel",
  sinonimos: ["tcle", "termo", "consentimento", "implanon", "implante", "etonogestrel", "chip"],
  campos: CAMPOS_TERMO,
  corpo: `
<h1>Termo de consentimento informado para inserção de implante contraceptivo de etonogestrel</h1>
${EU_CONSINTO("inserção de implante contraceptivo de etonogestrel")}
<p>Compreendo que o implante contraceptivo é um pequeno tubo de plástico, de cerca de 4 centímetros de comprimento por 2 milímetros de largura contendo um progestagênio (hormônio), chamado etonogestrel e é colocado debaixo da pele do braço que você não escreve (braço não dominante). Quem realiza a colocação é um médico treinado e habilitado para tanto. A ação do implante é contínua por 3 anos e acontece com a liberação do hormônio etonogestrel para o sangue da mulher, e funciona principalmente de dois modos: impede a ovulação e espessa o muco do colo do útero, o que dificulta a passagem dos espermatozóides para o útero. O implante tem eficácia superior a 99%, igual ou superior a eficácia da laqueadura tubária (5 gravidezes em 10.000 mulheres que usem o implante).</p>
<p>Compreendi ainda que as principais vantagens do implante são:</p>
<ul>
<li>É um método prático e de longa duração (3 anos).</li>
<li>Evita ter que tomar a pílula todos os dias.</li>
<li>Não interfere com a relação sexual.</li>
<li>Não interfere com a amamentação.</li>
<li>Melhora as cólicas menstruais.</li>
<li>Pode ser usado pelas mulheres que não podem tomar pílulas contendo estrogênio.</li>
<li>Não diminui a massa óssea (osteoporose).</li>
</ul>
<p>Também foram a mim apresentadas as desvantagens desse método:</p>
<ul>
<li>Irregularidades da menstruação. Na maioria dos casos, há sangramento irregular, podendo haver aumento do fluxo menstrual ou ausência de menstruação. Essas alterações são mais comuns no primeiro ano, sendo que a cada 100 mulheres, 15 podem ter sangramento mais frequente.</li>
<li>Pode ocorrer algumas alterações da pele, dores de cabeça, enjoos, aumento da sensibilidade mamária e variações do humor (semelhantes às que ocorrem com outros métodos contraceptivos como a pílula).</li>
<li>Podem aparecer cistos benignos nos ovários, que geralmente não necessitam de tratamento.</li>
</ul>
<p>Foi informado a mim também que o implante pode ser colocado até 5 dias após o início da sua menstruação (para garantir que não há gravidez). Nas puérperas (mulheres que tiveram parto recente), pode ser colocado imediatamente após o parto a depender do desejo da mulher. É eficaz logo após a colocação.</p>
<p>É colocado na parte interna do braço, debaixo da pele, como se fosse uma injeção. É necessária anestesia no local para inserção do implante. Pode ocorrer alguma dor, algum inchaço ou hematoma pequeno no local da colocação, mas passa rapidamente.</p>
<p>É removido 3 anos após a sua inserção, ou antes, se a seu pedido. Para a remoção do implante, também é preciso ser aplicada a anestesia.</p>
${DECL_FINAL}
<p>Também entendi que, a qualquer momento, antes que seja inserido o implante contraceptivo se realize e sem necessidade de dar nenhuma explicação, poderei revogar o consentimento que agora presto.</p>
${CONSINTO}
${EXPLIQUEI("inseriu o implante")}
`
},
{
  id: "orient-implanon", tipo: "impresso", grupo: "Contracepção",
  titulo: "Orientações pós-inserção · Implanon",
  resumo: "Folha para entregar à paciente",
  sinonimos: ["orientações", "orientacao", "implanon", "implante", "pós", "cuidados", "folheto", "paciente"],
  campos: [],
  corpo: `
<h1>Orientações pós-inserção de Implanon</h1>
<ul class="folheto">
<li>Protege contra a gravidez por até 03 (três) anos.</li>
<li>Não protege contra infecções sexualmente transmissíveis.</li>
<li>Há o retorno da ovulação e da menstruação após 03 (três) meses da remoção em mais de 90% das mulheres.</li>
<li>Durante o uso do Implanon, as mulheres ficam suscetíveis a mudanças no padrão de sangramento menstrual que podem incluir alterações na frequência (ausente, menos frequente, mais frequente ou contínua), na intensidade (reduzida ou aumentada) ou na duração do sangramento.</li>
<li>A ausência de menstruação foi relatada por aproximadamente 1 a cada 5 mulheres, enquanto 1 a cada 5 mulheres relatou sangramento frequente e/ou prolongado. Ocasionalmente, sangramento intenso tem sido relatado.</li>
<li>A dor da menstruação tende a melhorar durante o uso do Implanon. O padrão de sangramento durante os três primeiros meses é sugestivo do padrão de sangramento futuro para muitas mulheres.</li>
<li>Medicamentos que podem reduzir a eficácia do Implanon: fenitoína, fenobarbital, primidona, bosentana, carbamazepina, rifampicina e, possivelmente também, oxcarbazepina, topiramato, felbamato, griseofulvina, alguns inibidores da protease do HIV (por exemplo, ritonavir, nelfinavir, nevirapina) e inibidores não-nucleosídeo da transcriptase reversa (por exemplo, efavirenz), medicamentos utilizados no tratamento de hepatite C (por exemplo, boceprevir, telaprevir), e produtos fitoterápicos contendo Hypericum perforatum – erva-de-são-joão ou St. John’s wort. Os anticoncepcionais hormonais podem interferir no metabolismo de outros medicamentos e, consequentemente, as concentrações plasmáticas e tissulares podem ser aumentadas (por exemplo, ciclosporina) ou diminuídas (por exemplo, lamotrigina). Se for decidido continuar com o uso do Implanon, as mulheres devem ser orientadas a utilizar, adicionalmente, um método anticoncepcional não-hormonal durante o tempo de administração concomitante do medicamento e por 28 dias após a descontinuação.</li>
</ul>
`
},
{
  id: "cuidados-diu", tipo: "impresso", grupo: "Contracepção",
  titulo: "Cuidados pós-inserção · DIU de cobre",
  resumo: "Linha do tempo do dia da inserção até 10 anos",
  sinonimos: ["cuidados", "orientações", "diu", "cobre", "pós", "folheto", "paciente", "ultrassom"],
  campos: [],
  corpo: `
<h1>Cuidados pós-inserção de DIU de cobre</h1>
<h2>No dia da inserção</h2>
<ul>
<li>Dê ao seu corpo um tempo para descansar e se recuperar.</li>
<li>Pode haver desconforto como cólicas e/ou sangramento vaginal de leve a moderado.</li>
<li>É possível fazer uso de bolsa de água morna posicionada abaixo do umbigo para alívio, além das medicações prescritas.</li>
</ul>
<h2>Até 7 dias após</h2>
<ul>
<li>Não ter relação sexual de nenhum tipo.</li>
<li>Não praticar exercícios físicos de nenhum tipo.</li>
<li>Não levantar peso maior do que 5kg.</li>
<li>Observar se sintomas estão aliviando dia após dia.</li>
</ul>
<h2>Até 20-30 dias após</h2>
<ul>
<li>Período ideal para realização do ultrassom transvaginal solicitado.</li>
<li>O profissional que realizará o exame já irá informar se o DIU está bem-posicionado.</li>
<li><b>Importante:</b> manter algum outro método contraceptivo (método anteriormente utilizado e/ou preservativo) até essa avaliação durante o exame.</li>
<li>Quando o resultado ficar pronto, agende uma consulta e traga seu ultrassom para ser avaliado, registrado e para que o(a) médico(a) verifique como está sendo sua adaptação.</li>
</ul>
<h2>Até 3 a 6 meses após</h2>
<ul>
<li>Essa é duração do período de adaptação do seu útero ao DIU, quando seu ciclo menstrual pode apresentar-se com mais dias, maior fluxo e mais cólicas do que o usual.</li>
<li>Após esse período, a tendência é seu ciclo voltar a ser como era sem contraceptivos hormonais.</li>
</ul>
<h2>De 1 a 10 anos após</h2>
<ul>
<li>No seu serviço de saúde de referência, você pode solicitar realização de ultrassom transvaginal anualmente para reavaliar posicionamento.</li>
<li>Seguir fazendo a rotina de exame citopatológico preventivo conforme orientado onde você consulta.</li>
</ul>
<h2>10 anos após</h2>
<ul>
<li>Tempo máximo de duração do seu DIU.</li>
<li>Para retirá-lo, solicite procedimento ou encaminhamento em seu posto de saúde de referência.</li>
</ul>
<h2>Atenção</h2>
<p><b>Sinais de alarme:</b> febre ou calafrios, dor abdominal que não melhora com medicação, inchaço abdominal, corrimento vaginal fétido, sangramento abundante, mal-estar e demais sintomas de alarme. Nesses casos, procurar pronto-atendimento imediatamente.</p>
<p><b>Sinais de deslocamento do DIU:</b> dor em baixo ventre, sangramento fora do ciclo, dor na relação sexual, mudança do padrão de ciclo menstrual anteriormente estabelecido. Nesses casos, agendar consulta para avaliação e solicitação de ultrassom transvaginal extra.</p>
`
},
{
  id: "diu-contraindicacoes", tipo: "consulta", grupo: "Contracepção",
  titulo: "DIU · contraindicações e cuidados",
  resumo: "Cobre e hormonal, e quando pedir ultrassom",
  sinonimos: ["diu", "contraindicação", "contraindicacoes", "cuidados", "mirena", "cobre", "wilson", "dip", "ultrassom"],
  campos: [],
  corpo: `
<h1>DIU · contraindicações e cuidados</h1>
<h2>Contraindicações (DIU)</h2>
<ul>
<li>Distorção da cavidade uterina;</li>
<li>Endometrite pós-parto ou após aborto nos últimos três meses;</li>
<li>Sangramento transvaginal de origem desconhecida;</li>
<li>Doença de Wilson;</li>
<li>DIU previamente instalado e que não foi retirado;</li>
<li>Gravidez confirmada ou suspeitada;</li>
<li>Doença inflamatória pélvica (DIP) ou comportamento de risco para tal doença;</li>
<li>Suspeita ou diagnóstico de câncer de corpo ou colo uterino;</li>
<li>Cervicite mucopurulenta;</li>
<li>Alergia a qualquer componente do dispositivo, principalmente ao Cobre.</li>
</ul>
<h2>Contraindicações (DIU hormonal)</h2>
<p><b>1. Contraindicações universais:</b></p>
<ul>
<li>Gestação ou suspeita de gravidez;</li>
<li>ISTs no momento da inserção incluindo cervicite, vaginite ou quaisquer outras infecções trato genital inferior;</li>
<li>Anomalia congênita deformando a cavidade uterina dificultando a inserção do dispositivo;</li>
<li>Doença inflamatória pélvica aguda;</li>
<li>Antecedente de doença inflamatória pélvica, a menos que uma gravidez intrauterina após tenha acontecido;</li>
<li>História de aborto séptico ou endometrite puerperal nos últimos 3 meses;</li>
<li>Neoplasia cervical ou uterina confirmada ou suspeita;</li>
<li>Sangramento uterino não diagnosticado;</li>
<li>Qualquer condição que aumente a chance de infecções pélvicas;</li>
<li>História de inserção de DIU prévio que não foi removido;</li>
<li>Hipersensibilidade a quaisquer componentes do dispositivo.</li>
</ul>
<p><b>2. Contraindicações específicas para DIU de Levonorgestrel:</b></p>
<ul>
<li>Neoplasia de mama confirmada ou suspeita ou outra neoplasia dependente de progesterona;</li>
<li>Tumores hepáticos malignos ou benignos;</li>
<li>Doença hepática aguda.</li>
</ul>
<h2>Cuidados</h2>
<ul>
<li>O DIU costuma ser eficaz se introduzido em menos de 48 horas do parto, com ou sem aleitamento, desde que não haja infecção puerperal; ou após 4 semanas do parto;</li>
<li>Menstruação intensa ou dolorosa: geralmente melhora em 3-6 meses;</li>
<li>Levar absorvente e informar que pode ocorrer pequeno sangramento após o procedimento;</li>
<li>Ultrassonografia deverá ser solicitada se:
  <ul>
  <li>Difícil inserção (estenose/tortuosidade de canal cervical, resistência na inserção, história de alterações anatômica uterina);</li>
  <li>Dor intensa fora do período menstrual.</li>
  </ul>
</li>
</ul>
`
},

/* ===================== PEQUENAS CIRURGIAS ===================== */
{
  id: "exerese", tipo: "evolucao", grupo: "Pequenas cirurgias",
  titulo: "Exérese de lesão de pele",
  resumo: "Incisão elipsoide, sutura, retirada de pontos e biópsia",
  sinonimos: ["exérese", "exerese", "retirada de lesão", "lesão de pele", "nevo", "pinta", "cisto", "lipoma", "biópsia", "biopsia", "pequena cirurgia"],
  campos: [
    { id: "lesao", rotulo: "Lesão", tipo: "texto", vazio: "lesão X", placeholder: "ex.: nevo em dorso, região escapular E" },
    { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", livre: true, lembrar: true, opcoes: ["Clorexidina 2% solução aquosa", "Clorexidina 1% solução aquosa", "PVPI solução aquosa"], padrao: "Clorexidina 2% solução aquosa" },
    { id: "vaso", rotulo: "Lidocaína 2%", tipo: "opcoes", opcoes: ["sem vasoconstrictor", "com vasoconstrictor"], padrao: "sem vasoconstrictor" },
    { id: "tecnica", rotulo: "Técnica", tipo: "opcoes", livre: true, opcoes: ["incisão local elipsoide com bisturi", "exérese com punch", "exérese por shaving"], padrao: "incisão local elipsoide com bisturi" },
    INTERC(),
    { id: "sutura", rotulo: "Sutura", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "fio", rotulo: "Fio", tipo: "opcoes", livre: true, opcoes: ["nylon 2-0", "nylon 3-0", "nylon 4-0", "nylon 5-0"], padrao: "nylon 2-0", lembrar: true },
    { id: "pontos", rotulo: "Número de pontos", tipo: "numero", vazio: "XX" },
    { id: "curativo", rotulo: "Curativo", tipo: "opcoes", livre: true, opcoes: ["gaze e micropore"], padrao: "gaze e micropore" },
    { id: "dias_pontos", rotulo: "Retirada de pontos em", tipo: "opcoes", livre: true, opcoes: ["5-7", "7-10", "10-14"], padrao: "10-14", ajuda: "face 5-7 · couro cabeludo 7-10 · tronco e membros 10-14" },
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Paracetamol", "Dipirona", "Paracetamol e/ou Ibuprofeno"], padrao: "Paracetamol" },
    { id: "ap", rotulo: "Anatomopatológico", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "laboratorio", rotulo: "Laboratório", tipo: "texto", padrao: "Diagnóstika", lembrar: true }
  ],
  linhas: [
    "PROCEDIMENTO DE EXÉRESE DE LESÃO DE PELE:",
    "- Retorna para execução de procedimento em {lesao}.",
    "- Inicialmente conversado a respeito de procedimento e fornecidas informações gerais, cuidados e riscos inerentes ao procedimento.",
    "- Paciente ciente, deseja execução do procedimento.",
    "- Paciente nega alergia medicamentosa.",
    "{#}. Realizada limpeza de pele com {antisseptico}.",
    "{#}. Realizada anestesia local com Lidocaína 2% {vaso}.",
    "{#}. Colocados campos estéreis.",
    "{#}. Realizada {tecnica} e retirada lesão de pele {intercorrencia}.",
    { t: "{#}. Realizada anastomose primária com fio {fio} com {pontos} pontos simples.", se: "sutura=sim" },
    "{#}. Realizada limpeza externa de pele com soro fisiológico 0,9%.",
    "{#}. Realizado curativo com {curativo}.",
    "- Orientado cuidados gerais com ferida operatória e curativos diários.",
    { t: "- Orientado retirada de pontos em UBS em {dias_pontos} dias, conforme cicatrização.", se: "sutura=sim" },
    "- Deixado {analgesia} para analgesia se necessário.",
    { t: "- Fornecido ao usuário solicitação e material de biópsia e orientado levar material para laboratório de referência para análise ({laboratorio}). Retorno conforme agenda com resultado de exame.", se: "ap=sim" },
    "- Ao pronto socorro ou UBS de referência se necessário."
  ]
},
{
  id: "cantoplastia", tipo: "evolucao", grupo: "Pequenas cirurgias",
  titulo: "Cantoplastia",
  resumo: "Unha encravada, com anestesia troncular",
  sinonimos: ["cantoplastia", "unha encravada", "onicocriptose", "unha", "canto", "hálux", "halux"],
  campos: [
    { id: "local", rotulo: "Local (opcional)", tipo: "texto", opcional: true, placeholder: "ex.: canto lateral do hálux direito" },
    { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", livre: true, lembrar: true, opcoes: ["Clorexidina 2% solução aquosa", "Clorexidina 1% solução aquosa", "PVPI solução aquosa"], padrao: "Clorexidina 2% solução aquosa" },
    { id: "analgesia", rotulo: "Analgesia", tipo: "opcoes", livre: true, opcoes: ["Paracetamol", "Dipirona"], padrao: "Paracetamol" }
  ],
  linhas: [
    "PROCEDIMENTO DE CANTOPLASTIA:",
    { t: "- Vem para procedimento em {local}.", se: "local" },
    "- Inicialmente conversado a respeito de procedimento e fornecidas informações gerais, cuidados e riscos inerentes ao procedimento.",
    "- Paciente ciente, deseja execução do procedimento.",
    "- Paciente nega alergia medicamentosa.",
    "{#}. Realizada limpeza de pele com {antisseptico}.",
    "{#}. Colocados campos estéreis.",
    "{#}. Realizada anestesia local e troncular com Lidocaína 2% sem vasoconstrictor.",
    "{#}. Realizado descolamento de leito ungueal afetado com tentacânula sem intercorrências.",
    "{#}. Realizado secção de região afetada com tesoura íris até leito ungueal de forma retilínea sem intercorrências.",
    "{#}. Realizada retirada de canto de unha com pinça hemostática pequena (mosquito).",
    "{#}. Revisado leito ungueal e trajeto cirúrgico.",
    "{#}. Realizada limpeza com soro fisiológico 0,9%.",
    "{#}. Realizado curativo com gaze, micropore/esparadrapo e dedo de luva.",
    "{#}. Finalizado procedimento sem intercorrências.",
    "- Orientado cuidados gerais com ferida operatória e curativos diários.",
    "- Deixado {analgesia} para analgesia se necessário.",
    "- Ao pronto socorro ou UBS de referência se necessário."
  ]
},
{
  id: "pre-op", tipo: "evolucao", grupo: "Pequenas cirurgias",
  titulo: "Avaliação pré-operatória",
  resumo: "Cirurgia ambulatorial: identificação, anamnese, antecedentes e plano",
  sinonimos: ["pré-operatório", "pre operatorio", "avaliação", "pré-op", "preop", "cirurgia ambulatorial", "antecedentes"],
  campos: [
    { id: "nome", rotulo: "Nome", tipo: "texto", opcional: true, paciente: true, vazio: "…" },
    { id: "idade", rotulo: "Idade", tipo: "texto", opcional: true, paciente: true, vazio: "…" },
    { id: "cpf", rotulo: "CPF", tipo: "texto", opcional: true, paciente: true, vazio: "…" },
    { id: "telefone", rotulo: "Telefone", tipo: "texto", opcional: true, paciente: true, vazio: "…" },
    { id: "subjetivo", rotulo: "Subjetivo", tipo: "textolongo", vazio: "queixa e história" },
    { id: "localizacao", rotulo: "Localização", tipo: "texto" },
    { id: "tempo", rotulo: "Tempo de evolução", tipo: "texto" },
    { id: "objetivo", rotulo: "Objetivo", tipo: "textolongo", vazio: "exame da lesão" },
    { id: "complementares", rotulo: "Informações complementares", tipo: "textolongo", opcional: true, vazio: "…" },
    { id: "has", rotulo: "Hipertensão arterial", tipo: "opcoes", livre: true, opcoes: ["NÃO", "SIM"], padrao: "NÃO" },
    { id: "dm", rotulo: "Diabetes mellitus", tipo: "opcoes", livre: true, opcoes: ["NÃO", "SIM"], padrao: "NÃO" },
    { id: "epilepsia", rotulo: "Epilepsia", tipo: "opcoes", livre: true, opcoes: ["NÃO", "SIM"], padrao: "NÃO" },
    { id: "etilismo", rotulo: "Etilismo", tipo: "opcoes", livre: true, opcoes: ["NÃO", "SIM"], padrao: "NÃO" },
    { id: "tabagismo", rotulo: "Tabagismo", tipo: "opcoes", livre: true, opcoes: ["NÃO", "SIM"], padrao: "NÃO" },
    { id: "outras", rotulo: "Outras doenças", tipo: "opcoes", livre: true, opcoes: ["NÃO"], padrao: "NÃO" },
    { id: "cirurgias", rotulo: "Cirurgias prévias", tipo: "opcoes", livre: true, opcoes: ["NÃO"], padrao: "NÃO" },
    { id: "alergias", rotulo: "Alergias", tipo: "opcoes", livre: true, opcoes: ["NÃO"], padrao: "NÃO" },
    { id: "medicamentos", rotulo: "Medicamentos em uso", tipo: "opcoes", livre: true, opcoes: ["NÃO"], padrao: "NÃO" },
    { id: "hd", rotulo: "Hipóteses diagnósticas", tipo: "texto" },
    { id: "conduta", rotulo: "Conduta", tipo: "textolongo" },
    { id: "equipe", rotulo: "Equipe (rodapé)", tipo: "texto", opcional: true, lembrar: true, placeholder: "ex.: MFC fulano | R3 MFC ciclana" }
  ],
  linhas: [
    "PROCEDIMENTOS CIRÚRGICOS AMBULATORIAIS",
    "AVALIAÇÃO PRÉ-OPERATÓRIA",
    "1. Identificação do usuário:",
    "Nome: {nome}",
    "Idade: {idade}",
    "CPF: {cpf}",
    "Telefone: {telefone}",
    "2. Anamnese/Exame físico (Subjetivo/Objetivo):",
    "- Subjetivo: {subjetivo}",
    "- Localização: {localizacao}",
    "- Tempo de evolução: {tempo}",
    "- Objetivo: {objetivo}",
    "- Informações complementares: {complementares}",
    "3. Antecedentes pessoais:",
    "- Hipertensão Arterial: {has}.",
    "- Diabetes Mellitus: {dm}.",
    "- Epilepsia: {epilepsia}.",
    "- Etilismo: {etilismo}. Tabagismo: {tabagismo}.",
    "- Outras doenças: {outras}.",
    "- Cirurgias prévias: {cirurgias}.",
    "- Alergias: {alergias}.",
    "- Medicamentos em uso: {medicamentos}.",
    "4. Hipóteses diagnósticas (Avaliação):",
    "- {hd}",
    "5. Conduta (Plano):",
    "- {conduta}",
    { t: "{equipe}", se: "equipe" }
  ]
},
{
  id: "tcle-cirurgia", tipo: "impresso", grupo: "Pequenas cirurgias",
  titulo: "TCLE · cirurgia ambulatorial",
  resumo: "Termo geral para qualquer procedimento, com campo do procedimento",
  sinonimos: ["tcle", "termo", "consentimento", "cirurgia", "ambulatorial", "procedimento", "exérese", "cantoplastia", "biópsia"],
  campos: [
    { id: "nome", rotulo: "Nome", tipo: "texto", paciente: true },
    { id: "nasc", rotulo: "Data de nascimento", tipo: "texto", placeholder: "dd/mm/aaaa", paciente: true },
    { id: "idade", rotulo: "Idade", tipo: "calc", idade: "nasc" },
    { id: "endereco", rotulo: "Endereço", tipo: "texto", paciente: true },
    { id: "telefone", rotulo: "Telefone", tipo: "texto", paciente: true },
    { id: "cpf", rotulo: "CPF", tipo: "texto", paciente: true },
    { id: "procedimento", rotulo: "Procedimento", tipo: "texto", placeholder: "ex.: exérese de lesão de pele em dorso" },
    { id: "quem", rotulo: "Quem assina", tipo: "opcoes", opcoes: ["paciente", "responsavel"], padrao: "paciente" },
    { id: "cidade", rotulo: "Cidade", tipo: "texto", padrao: "Santa Maria - RS", lembrar: true },
    { id: "data", rotulo: "Data", tipo: "data", padrao: "hoje", formato: "extenso" }
  ],
  corpo: `
<h1>Termo de consentimento livre e esclarecido (TCLE) · Cirurgia ambulatorial</h1>
<p>Nome: {nome} &nbsp; Data de nasc.: {nasc} &nbsp; Idade: {idade}</p>
<p>Endereço: {endereco}</p>
<p>Telefone: {telefone} &nbsp; CPF: {cpf}</p>
<div class="caixa"><b>Procedimento ou cirurgia solicitada/indicada:</b><br>{procedimento}</div>
<p><b>1. O que é uma cirurgia ou procedimento invasivo?</b> Cirurgia é uma forma de tratamento por meio da utilização de processos operatórios (com necessidade de incisões na pele ou mucosas) e instrumentais. Um procedimento invasivo é uma forma de tratamento que também requer o uso de instrumentais para realização de procedimentos no meio interno do paciente, seja para tratamento ou para diagnóstico.</p>
<p><b>2. Porque serei submetido(a) a este procedimento/cirurgia?</b> Conforme explicação prévia de meu médico(a), entendi a necessidade e as vantagens da realização do procedimento ou cirurgia, seja para tratamento ou para diagnóstico.</p>
<p><b>3. Precisa de anestesia local?</b> Sim, para que o procedimento seja sem dor e confortável. No caso de não realização da anestesia, o procedimento proposto pode não ser realizado. A anestesia pode ser realizada em qualquer procedimento cirúrgico, invasivo ou diagnóstico em que haja dor ou incômodo para o paciente desde que os benefícios superem os riscos de realizar a anestesia. A imensa maioria dos procedimentos cirúrgicos ou invasivos só é possível devido à anestesia, que é um procedimento seguro permitindo inclusive a realização de procedimentos cirúrgicos ou invasivos em pacientes graves. A anestesia envolve diversos riscos e pode levar a uma série de complicações e efeitos colaterais com diferentes níveis de gravidade. Na anestesia regional, a qual utilizamos em cirurgias ambulatoriais, as complicações poderão ser as seguintes: Cefaleia (raquianestesia e anestesia peridural), Infecção, Lesão nervosa, Falha parcial ou total da técnica, Intoxicação por anestésico local, Parada cardiorrespiratória, Óbito.</p>
<p><b>4. Quais os riscos e desconfortos de um procedimento/cirurgia?</b> Na maioria dos procedimentos cirúrgicos, a paciente poderá apresentar dor depois da cirurgia, que será amenizada com medicações. É comum um inchaço na área operada e poderá ocorrer também alteração da sensibilidade. Sempre haverá formação da cicatriz, permanente, que pode ficar grossa (queloide), podendo também deixar alguma mancha em decorrência da cicatrização. Existe também o risco de infecção após uma cirurgia, mesmo que todos os cuidados para evitar que isto aconteça sejam tomados. Haverá sempre um risco menor de sangramento e hemorragia no local, podendo acumular líquidos como linfa (seroma) e sangue (hematoma) que podem drenar através dos pontos, sem configurar falha no cuidado. Poderá ocorrer deiscência (abertura dos pontos) e haver necessidade de outros procedimentos cirúrgicos no futuro para correção. Todo procedimento e cirurgia aumenta o risco de tromboembolismo (sangue coagulado de uma veia que se desloca de seu local de formação e migra para um dos pulmões). O risco de óbito existe, mas geralmente é muito baixo e depende do procedimento a ser realizado e do estado prévio de saúde do paciente. Mais raramente, existe também o risco de necrose (desvitalização do tecido), que podem necessitar de novas cirurgias reparadoras, às vezes com resultados somente paliativos. Alguns pacientes apresentam transtornos do comportamento afetivo (ansiedade ou depressão) após resultados cirúrgicos abaixo de suas expectativas.</p>
<p><b>5. E se algo não correr como esperado?</b> Neste caso, concordo e autorizo meu médico(a) a realizar, durante o procedimento, todos os atos necessários para preservar minha vida, inclusive transfusão de sangue e hemocomponentes, modificar a técnica cirúrgica definida e novos exames ou procedimentos diferentes daqueles propostos inicialmente, para o melhor resultado da minha cirurgia.</p>
<div class="caixa">
<p><b>Deve ser preenchido pelo paciente ou responsável</b></p>
<p>Diante do exposto, declaro que li e entendi os riscos e benefícios referentes ao procedimento, tendo a oportunidade de esclarecer minhas dúvidas. Também entendi que, a qualquer momento e sem necessidade de explicação, poderei revogar este consentimento e desistir do procedimento proposto (antes que o procedimento/cirurgia se realize), sem qualquer penalização ou prejuízo do meu cuidado. Autorizo que qualquer órgão ou tecido removido cirurgicamente durante o procedimento realizado seja encaminhado para exames complementares, desde que necessário para o esclarecimento diagnóstico e terapêutico. Os riscos e benefícios, complicações potenciais e alternativas me foram explicadas claramente pelo médico(a). Também estou ciente que podem ocorrer complicações durante o tratamento/procedimento, assim como podem ser necessárias a modificação da proposta inicial em virtude de situações imprevistas. Estou ciente de que a documentação produzida com a realização de meu procedimento/cirurgia, sejam fotos ou vídeos, bem como dados do meu prontuário, podem servir como fonte de consultas para pesquisas e publicações científicas, bem como sua divulgação no meio acadêmico, para fins educacionais.</p>
<p class="checks"><span>{quem=paciente} PACIENTE</span><span>{quem=responsavel} RESPONSÁVEL (preencher grau de parentesco)</span></p>
<p>Nome legível: <span class="ln longa"></span></p>
<p>Assinatura: <span class="ln"></span> &nbsp; Grau de parentesco: <span class="ln"></span></p>
<p>RG ou CPF: <span class="ln"></span> &nbsp; {cidade}, {data}</p>
</div>
<div class="caixa">
<p><b>Deve ser preenchido pelo médico(a)</b></p>
<p>Declaro que expliquei de forma clara e objetiva todo o procedimento, exame, tratamento e/ou cirurgia ao paciente e/ou seu responsável, assim como os benefícios, riscos e alternativas, tendo respondido a perguntas para esclarecer todas as dúvidas pertinentes. De acordo com meu entendimento, o paciente e/ou seu responsável legal está em condições de compreender o tratamento/procedimento proposto/desejado.</p>
<p>Assinatura e carimbo do profissional: <span class="ln longa"></span></p>
<p>{cidade}, {data}</p>
</div>
`
},
{
  id: "requisicao-ap", tipo: "impresso", grupo: "Pequenas cirurgias",
  titulo: "Requisição de anatomopatológico",
  resumo: "Formulário oficial da 4ª CRS, preenchido por cima",
  sinonimos: ["anatomopatológico", "anatomo patologico", "ap", "biópsia", "biopsia", "requisição", "diagnóstika", "diagnostika", "histopatológico"],
  fundo: "img/requisicao-ap.jpg",
  campos: [
    { id: "nome", rotulo: "Nome", tipo: "texto", paciente: true, pos: { x: 20.5, y: 26.3, w: 53 } },
    { id: "idade", rotulo: "Idade", tipo: "texto", paciente: true, pos: { x: 80.2, y: 26.3, w: 6 } },
    { id: "endereco", rotulo: "Endereço", tipo: "texto", paciente: true, pos: { x: 24.5, y: 29.5, w: 61.5 } },
    { id: "cep", rotulo: "CEP", tipo: "texto", paciente: true, pos: { x: 65.5, y: 32.7, w: 20 } },
    { id: "dados", rotulo: "Dados clínicos", tipo: "textolongo", pos: { x: 13.9, y: 36.2, w: 72, h: 6.6 } },
    { id: "exame1", rotulo: "Exame 1", tipo: "texto", padrao: "Exame anatomopatológico de peça cirúrgica", pos: { x: 13.9, y: 49.4, w: 39.5 } },
    { id: "cid1", rotulo: "CID 1", tipo: "texto", pos: { x: 57.3, y: 49.4, w: 28.5 } },
    { id: "exame2", rotulo: "Exame 2", tipo: "texto", opcional: true, pos: { x: 13.9, y: 52.5, w: 39.5 } },
    { id: "cid2", rotulo: "CID 2", tipo: "texto", opcional: true, pos: { x: 57.3, y: 52.5, w: 28.5 } },
    { id: "exame3", rotulo: "Exame 3", tipo: "texto", opcional: true, pos: { x: 13.9, y: 55.6, w: 39.5 } },
    { id: "cid3", rotulo: "CID 3", tipo: "texto", opcional: true, pos: { x: 57.3, y: 55.6, w: 28.5 } },
    { id: "data", rotulo: "Data", tipo: "texto", padrao: "hoje", pos: { x: 66.2, y: 68.4, w: 13.5 } }
  ]
},

/* ===================== OUTROS PROCEDIMENTOS ===================== */
{
  id: "infiltracao", tipo: "evolucao", grupo: "Outros procedimentos",
  titulo: "Infiltração articular",
  resumo: "Corticoide + lidocaína, com volumes editáveis",
  sinonimos: ["infiltração", "infiltracao", "articulação", "joelho", "ombro", "túnel do carpo", "corticoide", "dexametasona"],
  campos: [
    { id: "articulacao", rotulo: "Articulação", tipo: "opcoes", livre: true, opcoes: ["joelho direito", "joelho esquerdo", "ombro direito", "ombro esquerdo"], vazio: "nome da articulação" },
    { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", livre: true, lembrar: true, opcoes: ["Clorexidina solução aquosa", "PVPI solução aquosa"], padrao: "Clorexidina solução aquosa" },
    { id: "corticoide", rotulo: "Corticoide", tipo: "opcoes", livre: true, opcoes: ["dexametasona 4mg/mL"], padrao: "dexametasona 4mg/mL", lembrar: true },
    { id: "cort_ml", rotulo: "Volume do corticoide", tipo: "numero", sufixo: "mL", padrao: "2,5", lembrar: true },
    { id: "lido_ml", rotulo: "Volume de lidocaína", tipo: "numero", sufixo: "mL", padrao: "2,5", lembrar: true },
    INTERC()
  ],
  linhas: [
    "PROCEDIMENTO DE INFILTRAÇÃO DE ARTICULAÇÃO:",
    "- Vem para execução de procedimento de infiltração em articulação {articulacao}.",
    "- Inicialmente conversado a respeito de procedimento e fornecidas informações gerais, cuidados e riscos inerentes ao procedimento. Paciente ciente, deseja execução do procedimento.",
    "- Paciente nega alergia medicamentosa.",
    "{#}. Realizada limpeza de pele com {antisseptico}.",
    "{#}. Realizada anestesia local (botão anestésico em pele) com Lidocaína 2% sem vasoconstrictor.",
    "{#}. Realizada infiltração local de articulação com {corticoide} ({cort_ml}mL) + lidocaína 2% sem vasoconstrictor ({lido_ml}mL) {intercorrencia}.",
    "{#}. Realizada limpeza externa de pele com soro fisiológico 0,9%.",
    "{#}. Realizado curativo com gaze e micropore.",
    "- Orientado cuidados gerais e cuidados com articulação infiltrada.",
    "- Orientado importância de repouso relativo nos primeiros 2 a 3 dias pós procedimento.",
    "- Ao pronto socorro ou UBS de referência se necessário."
  ]
},
{
  id: "lavagem", tipo: "evolucao", grupo: "Outros procedimentos",
  titulo: "Lavagem otológica",
  resumo: "SOAP curto; escolher o lado uma vez preenche o texto todo",
  sinonimos: ["lavagem", "otológica", "otologica", "ouvido", "cerume", "cera", "orelha"],
  campos: [
    { id: "orelhas", rotulo: "Orelhas", tipo: "opcoes", opcoes: ["orelha direita", "orelha esquerda", "ambas as orelhas"], padrao: "ambas as orelhas" },
    { id: "cerumin", rotulo: "Ceruminolítico prévio", tipo: "opcoes", opcoes: SIM_NAO, padrao: "sim" },
    { id: "ceruminolitico", rotulo: "Ceruminolítico", tipo: "opcoes", livre: true, opcoes: ["Cerumin gotas"], padrao: "Cerumin gotas" },
    { id: "dias", rotulo: "Há quantos dias", tipo: "numero", sufixo: "dias", padrao: "7" },
    INTERC()
  ],
  linhas: [
    "PROCEDIMENTO DE LAVAGEM OTOLÓGICA:",
    "Subjetivo:",
    "- Paciente encaminhado para lavagem otológica de {orelhas}. Nega sintomas de otalgia, otorreia e febre.",
    { t: "- Em uso de {ceruminolitico} há cerca de {dias} dias.", se: "cerumin=sim" },
    "Objetivo:",
    "Otoscopia: presença de cerume em {orelhas}.",
    "Impressão:",
    "- Cerume em {orelhas}, sem sinais infecciosos, com necessidade de lavagem otológica.",
    "Conduta:",
    "- Realizada lavagem otológica em {orelhas} {intercorrencia}.",
    "- Orientações gerais e cuidados locais.",
    "- Seguimento com ESF/UBS de referência.",
    "- Ao pronto socorro ou UBS de referência se piora clínica/se julgar necessário."
  ]
},

/* ===================== ADMINISTRATIVO ===================== */
{
  id: "faltante", tipo: "evolucao", grupo: "Administrativo",
  titulo: "Paciente faltante",
  resumo: "Registro de falta sem aviso, com data e turno",
  sinonimos: ["falta", "faltante", "não compareceu", "nao compareceu", "ausência", "absenteísmo"],
  campos: [
    { id: "servico", rotulo: "Serviço", tipo: "texto", padrao: "ambulatório de Procedimentos Médicos de APS da Policlínica Central", lembrar: true },
    { id: "data", rotulo: "Data", ...hoje },
    { id: "turno", rotulo: "Turno", tipo: "opcoes", opcoes: ["manhã", "tarde", "noite"], padrao: "manhã" }
  ],
  linhas: [
    "Paciente não compareceu em consulta médica em {servico} em {data}, pelo turno da {turno}, tampouco entrou em contato para avisar falta ou remarcar data. Para nova consulta neste serviço, conforme necessidade de usuário, oriento nova consulta em UBS/ESF para nova avaliação e encaminhamento."
  ]
}

];
})();
