/*
 * Modelos de evolução e impressos.
 *
 * Cada modelo tem:
 *   id, tipo ("evolucao" | "impresso"), titulo, sinonimos (para a busca),
 *   campos  — o que muda de paciente para paciente ou de procedimento para procedimento;
 *   linhas  — (evolução) o texto, uma linha por item; {campo} é trocado pelo valor.
 *             Uma linha pode ser { t: "...", se: "campo=valor" | "campo!=valor" | "campo" }.
 *   corpo   — (impresso) HTML do documento; {campo} vira o valor e {campo=valor} vira ☐/☒.
 *
 * Tipos de campo: texto, numero, opcoes, data, calc.
 *   lembrar: true  → o valor fica salvo neste aparelho para a próxima vez (lote, CRM, unidade).
 *   vazio: "..."  → como o campo aparece quando está em branco (padrão: o rótulo).
 *   paciente: true → nunca é salvo (nome, CNS, data de nascimento).
 *   livre: true    → em "opcoes", permite digitar outra resposta.
 *   calc           → calculado a partir de uma data: { de: "campo_data", anos: 3 } ou { de, dias: "campo_numero" }.
 *
 * Todos os textos são EXEMPLOS para revisão com o preceptor e com o protocolo da unidade.
 */
window.MODELOS = [
  {
    id: "diu",
    tipo: "evolucao",
    titulo: "Inserção de DIU",
    resumo: "Cobre ou hormonal, com ou sem bloqueio paracervical",
    sinonimos: ["diu", "dispositivo intrauterino", "cobre", "mirena", "kyleena", "levonorgestrel", "lng", "contracepção", "anticoncepção"],
    campos: [
      { id: "tipo_diu", rotulo: "DIU", tipo: "opcoes", opcoes: ["de cobre (TCu 380A)", "hormonal (levonorgestrel 52 mg)"], padrao: "de cobre (TCu 380A)" },
      { id: "criterio", rotulo: "Gravidez excluída por", vazio: "critério", tipo: "opcoes", livre: true,
        opcoes: ["até 7 dias do início da menstruação", "sem relação sexual desde a última menstruação", "uso correto de método confiável", "β-hCG negativo", "menos de 21 dias pós-parto", "até 7 dias pós-aborto"] },
      { id: "posicao", rotulo: "Útero ao toque", tipo: "opcoes", opcoes: ["em anteversoflexão", "em retroversoflexão", "em medioversão"], padrao: "em anteversoflexão" },
      { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", opcoes: ["clorexidina aquosa", "PVPI tópico"], padrao: "clorexidina aquosa", lembrar: true },
      { id: "bloqueio", rotulo: "Bloqueio paracervical", tipo: "opcoes", opcoes: ["sim", "não"], padrao: "sim" },
      { id: "lido_ml", rotulo: "Lidocaína 1% sem vaso", tipo: "numero", sufixo: "mL", padrao: "10", se: "bloqueio=sim", lembrar: true },
      { id: "histerometria", rotulo: "Histerometria", tipo: "numero", sufixo: "cm" },
      { id: "fio", rotulo: "Fios cortados a", tipo: "numero", sufixo: "cm", padrao: "3", lembrar: true },
      { id: "intercorrencia", rotulo: "Intercorrências", tipo: "opcoes", livre: true,
        opcoes: ["sem intercorrências", "reação vasovagal leve, resolvida com decúbito", "dificuldade para transpor o orifício interno, usada vela de Hegar"], padrao: "sem intercorrências" },
      { id: "lote", rotulo: "Lote", tipo: "texto", lembrar: true },
      { id: "validade", rotulo: "Validade", tipo: "texto", placeholder: "mm/aaaa", lembrar: true },
      { id: "tolerancia", rotulo: "Tolerou o procedimento", tipo: "opcoes", opcoes: ["bem", "com dor moderada", "com dor intensa"], padrao: "bem" },
      { id: "apoio", rotulo: "Método de apoio", tipo: "opcoes", opcoes: ["sem necessidade de método de apoio", "preservativo por 7 dias"], padrao: "sem necessidade de método de apoio" },
      { id: "retorno", rotulo: "Retorno", tipo: "opcoes", livre: true, opcoes: ["em 30 a 45 dias, após a próxima menstruação", "em 6 semanas"], padrao: "em 30 a 45 dias, após a próxima menstruação" }
    ],
    linhas: [
      "PROCEDIMENTO: inserção de DIU {tipo_diu}.",
      "Gravidez razoavelmente excluída: {criterio}. Orientada sobre o procedimento, riscos, benefícios e alternativas. TCLE assinado.",
      "Paciente em posição ginecológica. Toque bimanual: útero {posicao}, sem dor à mobilização. Colocado espéculo, colo sem alterações. Antissepsia do colo com {antisseptico}.",
      { t: "Bloqueio paracervical com lidocaína 1% sem vasoconstritor, {lido_ml} mL.", se: "bloqueio=sim" },
      "Pinçamento do lábio anterior com pinça de Pozzi. Histerometria: {histerometria} cm.",
      "Inserção do DIU {intercorrencia}. Fios cortados a {fio} cm do orifício externo.",
      "Lote {lote}, validade {validade}.",
      "Tolerou o procedimento {tolerancia}. Observação por 15 minutos, alta em bom estado geral.",
      "Orientações: analgesia se cólica; {apoio}; preservativo para prevenção de ISTs; sinais de alarme (dor forte, febre, corrimento com odor, sangramento intenso, não sentir os fios).",
      "Retorno {retorno}."
    ]
  },

  {
    id: "implanon",
    tipo: "evolucao",
    titulo: "Inserção de Implanon",
    resumo: "Implante subdérmico de etonogestrel, com data de remoção",
    sinonimos: ["implanon", "implante", "etonogestrel", "chip", "implante contraceptivo", "nxt", "contracepção"],
    campos: [
      { id: "data_proc", rotulo: "Data da inserção", tipo: "data", padrao: "hoje" },
      { id: "criterio", rotulo: "Gravidez excluída por", vazio: "critério", tipo: "opcoes", livre: true,
        opcoes: ["até 7 dias do início da menstruação", "sem relação sexual desde a última menstruação", "uso correto de método confiável", "β-hCG negativo", "amamentação exclusiva, amenorreica, < 6 meses pós-parto", "até 7 dias pós-aborto"] },
      { id: "braco", rotulo: "Braço", tipo: "opcoes", opcoes: ["esquerdo", "direito"], padrao: "esquerdo" },
      { id: "distancia", rotulo: "Acima do epicôndilo medial", tipo: "numero", sufixo: "cm", padrao: "8", lembrar: true },
      { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", opcoes: ["clorexidina alcoólica", "PVPI"], padrao: "clorexidina alcoólica", lembrar: true },
      { id: "lido_ml", rotulo: "Lidocaína 2% sem vaso", tipo: "numero", sufixo: "mL", padrao: "2", lembrar: true },
      { id: "intercorrencia", rotulo: "Intercorrências", tipo: "opcoes", livre: true, opcoes: ["sem intercorrências", "com pequeno sangramento local, contido com compressão"], padrao: "sem intercorrências" },
      { id: "lote", rotulo: "Lote", tipo: "texto", lembrar: true },
      { id: "validade", rotulo: "Validade", tipo: "texto", placeholder: "mm/aaaa", lembrar: true },
      { id: "apoio", rotulo: "Método de apoio", tipo: "opcoes", opcoes: ["sem necessidade de método de apoio", "preservativo ou abstinência por 7 dias"], padrao: "sem necessidade de método de apoio" },
      { id: "remocao", rotulo: "Remoção prevista", tipo: "calc", de: "data_proc", anos: 3 }
    ],
    linhas: [
      "PROCEDIMENTO: inserção de implante subdérmico de etonogestrel 68 mg (Implanon NXT).",
      "Gravidez razoavelmente excluída: {criterio}. Sem contraindicações identificadas. Aconselhada sobre padrão de sangramento imprevisível, duração de 3 anos e ausência de proteção contra ISTs. TCLE assinado.",
      "Decúbito dorsal, braço {braco} (não dominante) fletido e rodado externamente. Ponto de inserção na face interna do braço, {distancia} cm acima do epicôndilo medial e 3 a 5 cm posterior ao sulco bicipital.",
      "Antissepsia com {antisseptico} e campo estéril. Anestesia com lidocaína 2% sem vasoconstritor, {lido_ml} mL, no ponto de inserção e ao longo do trajeto.",
      "Inserção subdérmica com aplicador pré-carregado, {intercorrencia}. Implante palpável em toda a extensão (4 cm), confirmado pelo profissional e pela paciente.",
      "Lote {lote}, validade {validade}.",
      "Steri-Strip e curativo compressivo por 24 horas. Cartão da usuária preenchido e entregue.",
      "Orientações: hematoma e dor leve são esperados; {apoio}; retornar se sinais de infecção, implante não palpável, formigamento no braço ou suspeita de gravidez.",
      "Remoção prevista para {remocao}."
    ]
  },

  {
    id: "exerese",
    tipo: "evolucao",
    titulo: "Exérese de lesão de pele",
    resumo: "Excisão fusiforme, punch ou shaving, com retirada de pontos",
    sinonimos: ["exérese", "exerese", "retirada de lesão", "nevo", "pinta", "cisto", "lipoma", "biópsia", "biopsia", "punch", "shaving", "pequena cirurgia"],
    campos: [
      { id: "data_proc", rotulo: "Data do procedimento", tipo: "data", padrao: "hoje" },
      { id: "lesao", rotulo: "Lesão", tipo: "texto", placeholder: "ex.: nevo pigmentado" },
      { id: "local", rotulo: "Local", tipo: "texto", placeholder: "ex.: dorso, região escapular E" },
      { id: "tamanho", rotulo: "Tamanho", tipo: "numero", sufixo: "mm" },
      { id: "antisseptico", rotulo: "Antisséptico", tipo: "opcoes", opcoes: ["clorexidina alcoólica", "PVPI"], padrao: "clorexidina alcoólica", lembrar: true },
      { id: "lido_ml", rotulo: "Lidocaína 2% com vaso", tipo: "numero", sufixo: "mL", padrao: "3" },
      { id: "tecnica", rotulo: "Técnica", tipo: "opcoes", opcoes: ["excisão fusiforme", "punch", "shaving"], padrao: "excisão fusiforme" },
      { id: "margem", rotulo: "Margem", tipo: "numero", sufixo: "mm", padrao: "2", se: "tecnica!=shaving" },
      { id: "fio", rotulo: "Fio", tipo: "opcoes", opcoes: ["nylon 3-0", "nylon 4-0", "nylon 5-0"], padrao: "nylon 4-0", se: "tecnica!=shaving" },
      { id: "pontos", rotulo: "Pontos simples", tipo: "numero", se: "tecnica!=shaving" },
      { id: "ap", rotulo: "Anatomopatológico", tipo: "opcoes", opcoes: ["enviado para anatomopatológico", "não enviado para anatomopatológico"], padrao: "enviado para anatomopatológico" },
      { id: "dias_pontos", rotulo: "Retirar pontos em", tipo: "opcoes", sufixo: "dias", opcoes: ["5", "7", "10", "14"], padrao: "10", se: "tecnica!=shaving", ajuda: "face 5 · couro cabeludo 7 · tronco e membros 10 a 14" },
      { id: "retirada", rotulo: "Data da retirada", tipo: "calc", de: "data_proc", dias: "dias_pontos", se: "tecnica!=shaving" }
    ],
    linhas: [
      "PROCEDIMENTO: exérese de lesão cutânea.",
      "Lesão: {lesao} em {local}, medindo cerca de {tamanho} mm. Orientado sobre o procedimento, riscos de cicatriz, infecção e sangramento. TCLE assinado.",
      "Antissepsia com {antisseptico} e campo estéril. Anestesia local com lidocaína 2% com vasoconstritor, {lido_ml} mL.",
      { t: "Exérese por {tecnica}, com margem de {margem} mm. Hemostasia por compressão. Síntese com {fio}, {pontos} pontos simples.", se: "tecnica!=shaving" },
      { t: "Exérese por shaving. Hemostasia por compressão.", se: "tecnica=shaving" },
      "Material {ap}. Sem intercorrências. Curativo oclusivo.",
      "Orientações: manter curativo seco por 24 a 48 horas, depois lavar com água e sabão; analgesia se dor; retornar se vermelhidão, calor, secreção ou febre.",
      { t: "Retirada de pontos em {dias_pontos} dias ({retirada}), na unidade.", se: "tecnica!=shaving" },
      "Retorno com resultado do anatomopatológico quando disponível."
    ]
  },

  {
    id: "tcle-generico",
    tipo: "impresso",
    titulo: "Termo de consentimento padrão",
    resumo: "Para qualquer procedimento ambulatorial",
    sinonimos: ["tcle", "termo", "consentimento", "termo de consentimento", "autorização", "procedimento"],
    campos: [
      { id: "nome", rotulo: "Nome do(a) paciente", tipo: "texto", paciente: true },
      { id: "nasc", rotulo: "Data de nascimento", tipo: "texto", placeholder: "dd/mm/aaaa", paciente: true },
      { id: "cns", rotulo: "CNS / prontuário", tipo: "texto", paciente: true },
      { id: "procedimento", rotulo: "Procedimento", tipo: "texto", placeholder: "ex.: exérese de lesão de pele no dorso" },
      { id: "riscos", rotulo: "Riscos principais", tipo: "texto", placeholder: "ex.: dor, sangramento, infecção, cicatriz", padrao: "dor, sangramento, infecção e cicatriz no local" },
      { id: "unidade", rotulo: "Unidade", tipo: "texto", lembrar: true },
      { id: "data", rotulo: "Data", tipo: "data", padrao: "hoje" },
      { id: "medico", rotulo: "Médico(a)", tipo: "texto", lembrar: true },
      { id: "crm", rotulo: "CRM", tipo: "texto", lembrar: true }
    ],
    corpo: `
<h1>Termo de Consentimento Livre e Esclarecido</h1>
<p class="sub">Leia com calma, tire suas dúvidas e só assine se concordar. Você fica com uma cópia.</p>
<h2>Identificação</h2>
<p>Nome: {nome}</p>
<p>Data de nascimento: {nasc} &nbsp;&nbsp; CNS / prontuário: {cns}</p>
<p>Unidade: {unidade} &nbsp;&nbsp; Data: {data}</p>
<h2>Procedimento</h2>
<p>Fui informado(a) de que será realizado o seguinte procedimento: {procedimento}.</p>
<p>Recebi explicações sobre como ele é feito, por que está indicado, quais os benefícios esperados e quais as alternativas, inclusive a de não fazer.</p>
<h2>Riscos</h2>
<p>Entendi que todo procedimento tem riscos. Os principais neste caso são: {riscos}. Em situações raras pode ser necessário outro tratamento ou encaminhamento.</p>
<h2>Meus direitos</h2>
<ul>
<li>Tirar dúvidas antes, durante e depois do procedimento.</li>
<li>Desistir a qualquer momento, sem prejuízo ao meu atendimento na unidade.</li>
<li>Ter um acompanhante de minha escolha.</li>
</ul>
<p>Esta unidade recebe estudantes. Com minha autorização, um interno pode participar, sempre supervisionado pelo médico responsável.</p>
<p class="checks"><span>☐ Autorizo a participação do interno.</span><span>☐ Não autorizo.</span></p>
<h2>Declaração</h2>
<p>Declaro que li (ou que leram para mim) este termo, entendi as explicações e tive minhas perguntas respondidas. Autorizo, por vontade própria, a realização do procedimento.</p>
<div class="assin"><span></span>Assinatura do(a) paciente ou responsável legal</div>
<div class="assin"><span></span>Médico(a) responsável: {medico} &nbsp; CRM {crm}</div>
<p class="nota">Modelo para revisão. Confira com o protocolo da unidade antes de usar. Uma via fica com o(a) paciente e outra no prontuário.</p>
`
  },

  {
    id: "tcle-diu",
    tipo: "impresso",
    titulo: "TCLE: DIU com bloqueio anestésico",
    resumo: "O seu termo, com nome e data preenchidos na hora",
    sinonimos: ["tcle", "termo", "consentimento", "diu", "bloqueio", "paracervical", "dispositivo intrauterino"],
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
  }
];
