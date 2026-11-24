/*
 * Lançar vários procedimentos no SIGSS (gestaosaude.santamaria.rs.gov.br) de uma vez.
 * Roda como favorito (bookmarklet) com a tela "Procedimento ambulatorial" aberta, já com o paciente.
 * Usa as funções da própria tela, uma por procedimento:
 *   escolher o procedimento → grava() → "Deseja inserir outro procedimento?" Sim → novo(true).
 * Guarda no navegador só os códigos favoritos. Nada do paciente.
 */
(function () {
  var ID = 'lancar-procs';
  var velho = document.getElementById(ID); if (velho) { velho.remove(); return; }

  // a tela de procedimento pode estar na própria página ou dentro de um iframe
  function acha(w) {
    try { if (w.$COMBO_PRCI && typeof w.grava === 'function') return w; } catch (e) {}
    var fs = []; try { fs = w.frames; } catch (e) {}
    for (var i = 0; i < fs.length; i++) { var r = acha(fs[i]); if (r) return r; }
    return null;
  }
  var W = acha(window);
  if (!W) { alert('Abra a tela de Procedimento ambulatorial do paciente e clique de novo.'); return; }
  var D = W.document;
  var campo = function (id) { return D.getElementById(id); };
  var val = function (id) { var e = campo(id); return e ? String(e.value || '') : ''; };
  var textoSel = function (id) { var e = campo(id); return e && e.selectedIndex >= 0 && e.options[e.selectedIndex] ? e.options[e.selectedIndex].text.trim() : ''; };

  var lista = [];
  try { lista = W.$COMBO_PRCI.populate() || []; } catch (e) {}
  if (!lista.length) { alert('Não consegui ler a lista de procedimentos. Confira se o profissional e a unidade estão preenchidos.'); return; }
  lista = lista.map(function (p) { return { idp: p[0], ids: p[1], cod: String(p[2]).trim(), nome: String(p[3]).trim() }; });

  var FAV = 'lancarProcs.favoritos';
  var favs = []; try { favs = JSON.parse(localStorage.getItem(FAV) || '[]'); } catch (e) {}
  var salvaFavs = function () { try { localStorage.setItem(FAV, JSON.stringify(favs)); } catch (e) {} };
  var marcados = {};   // cod → observação

  var css = '#' + ID + '{position:fixed;top:12px;right:12px;z-index:2147483647;width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 24px);display:flex;flex-direction:column;gap:8px;background:#f3f5f9;color:#202c38;border:1px solid #c4d3e6;border-radius:12px;box-shadow:0 10px 40px rgba(20,40,60,.25);padding:14px;font:14px/1.4 system-ui,sans-serif}' +
    '#' + ID + ' *{box-sizing:border-box;font:inherit;color:inherit}' +
    '#' + ID + ' .t{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:16px}' +
    '#' + ID + ' .pac{background:#e1ecf9;border-radius:8px;padding:6px 10px}' +
    '#' + ID + ' input[type=search],#' + ID + ' input.obs{width:100%;border:1px solid #c4d3e6;border-radius:8px;padding:7px 10px;background:#fff}' +
    '#' + ID + ' .l{overflow:auto;flex:1;min-height:80px;background:#fff;border:1px solid #dde4ed;border-radius:8px}' +
    '#' + ID + ' .i{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-top:1px solid #eef2f7}' +
    '#' + ID + ' .i:first-child{border-top:0}' +
    '#' + ID + ' .i label{flex:1;cursor:pointer}' +
    '#' + ID + ' .i small{color:#5d6977}' +
    '#' + ID + ' .h{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5d6977;padding:6px 8px 2px}' +
    '#' + ID + ' button{border:1px solid #c4d3e6;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}' +
    '#' + ID + ' button.p{background:#c4daf3;border-color:#9dbde3;font-weight:700;padding:10px}' +
    '#' + ID + ' button.e{border:0;background:none;font-size:18px;padding:0 4px;color:#8a97a6}' +
    '#' + ID + ' button.e.on{color:#d8ab3d}' +
    '#' + ID + ' .log{background:#fff;border-radius:8px;padding:6px 10px;white-space:pre-wrap;max-height:140px;overflow:auto}' +
    '#' + ID + ' .ok{color:#2d6a4d}#' + ID + ' .erro{color:#9b2c2c}';

  var box = document.createElement('div'); box.id = ID;
  box.innerHTML = '<style>' + css + '</style>' +
    '<div class="t"><span>Lançar procedimentos</span><button type="button" data-a="fechar">Fechar</button></div>' +
    '<div class="pac"></div>' +
    '<input type="search" placeholder="Buscar por nome ou código">' +
    '<div class="l"></div>' +
    '<button type="button" class="p" data-a="lancar"></button>' +
    '<div class="log" hidden></div>';
  document.body.appendChild(box);
  var q = box.querySelector('input[type=search]'), L = box.querySelector('.l'), bt = box.querySelector('[data-a=lancar]'), log = box.querySelector('.log');

  function paciente() {
    var n = textoSel('prreco.usuarioServico.isenPK');
    box.querySelector('.pac').textContent = n ? 'Paciente: ' + n : 'Paciente não identificado na tela';
    return n;
  }
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  function linha(p) {
    var d = document.createElement('div'); d.className = 'i';
    var on = p.cod in marcados, fav = favs.indexOf(p.cod) >= 0;
    d.innerHTML = '<input type="checkbox"' + (on ? ' checked' : '') + '>' +
      '<label><span></span><br><small></small></label>' +
      '<button type="button" class="e' + (fav ? ' on' : '') + '" title="Favorito">' + (fav ? '★' : '☆') + '</button>';
    d.querySelector('span').textContent = p.nome;
    d.querySelector('small').textContent = p.cod;
    var cb = d.querySelector('input');
    d.querySelector('label').onclick = function () { cb.checked = !cb.checked; cb.onchange(); };
    cb.onchange = function () { if (cb.checked) marcados[p.cod] = marcados[p.cod] || ''; else delete marcados[p.cod]; desenha(); };
    d.querySelector('.e').onclick = function () {
      var i = favs.indexOf(p.cod); if (i >= 0) favs.splice(i, 1); else favs.push(p.cod); salvaFavs(); desenha();
    };
    if (on) {
      var o = document.createElement('input'); o.className = 'obs'; o.placeholder = 'Observação (opcional)'; o.value = marcados[p.cod];
      o.oninput = function () { marcados[p.cod] = o.value; };
      d.querySelector('label').appendChild(o);
      o.onclick = function (e) { e.stopPropagation(); };
    }
    return d;
  }
  function titulo(t) { var h = document.createElement('div'); h.className = 'h'; h.textContent = t; return h; }
  function desenha() {
    L.innerHTML = '';
    var termos = norm(q.value).split(/\s+/).filter(Boolean);
    var sel = lista.filter(function (p) { return p.cod in marcados; });
    if (sel.length) { L.appendChild(titulo('Marcados')); sel.forEach(function (p) { L.appendChild(linha(p)); }); }
    if (termos.length) {
      var achados = lista.filter(function (p) { var t = norm(p.cod + ' ' + p.nome); return !(p.cod in marcados) && termos.every(function (x) { return t.indexOf(x) >= 0; }); }).slice(0, 40);
      L.appendChild(titulo(achados.length ? 'Busca' : 'Nada encontrado'));
      achados.forEach(function (p) { L.appendChild(linha(p)); });
    } else {
      var fs = lista.filter(function (p) { return favs.indexOf(p.cod) >= 0 && !(p.cod in marcados); });
      if (fs.length) L.appendChild(titulo('Favoritos'));
      else if (!favs.length) L.appendChild(titulo('Busque e toque na ☆ para guardar nos favoritos'));
      fs.forEach(function (p) { L.appendChild(linha(p)); });
    }
    var n = Object.keys(marcados).length;
    bt.textContent = n ? 'Lançar ' + n + (n === 1 ? ' procedimento' : ' procedimentos') : 'Marque os procedimentos';
    bt.disabled = !n;
  }
  q.oninput = desenha;
  box.querySelector('[data-a=fechar]').onclick = function () { box.remove(); };

  // diálogo "Deseja inserir outro procedimento…": responde Sim (a própria tela chama novo(true))
  function respondeOutro() {
    var bts = D.querySelectorAll('button, a, input[type=button]');
    for (var i = 0; i < bts.length; i++) {
      var b = bts[i], dlg = b.closest('.ui-dialog, [role=dialog]');
      if (!dlg || !dlg.offsetParent || !/inserir outro procedimento/i.test(dlg.textContent)) continue;
      if (/^\s*sim\s*$/i.test(b.textContent || b.value || '')) { b.click(); return true; }
    }
    return false;
  }
  function pronto() { return val('prreco.prrecoPK.idp') === ''; }

  bt.onclick = function () {
    var pac = paciente();
    var sel = lista.filter(function (p) { return p.cod in marcados; });
    if (!sel.length) return;
    if (!val('prreco.usuarioServico.isenPK.idp') && !val('prreco.usuarioServico.isenPK')) { alert('Escolha o paciente na tela antes.'); return; }
    if (W.TUCI_COD && W.TUCI_COD !== 'OP') { alert('Esta tela não está em procedimento individual (BPA).'); return; }
    if (!confirm('Lançar para ' + (pac || 'o paciente da tela') + ':\n\n' + sel.map(function (p) { return '• ' + p.cod + ' ' + p.nome; }).join('\n'))) return;
    log.hidden = false; log.innerHTML = ''; bt.disabled = true;
    var escreve = function (cls, t) { var s = document.createElement('div'); s.className = cls; s.textContent = t; log.appendChild(s); log.scrollTop = 1e9; };
    var i = 0;
    (function proximo() {
      if (i >= sel.length) { escreve('ok', 'Pronto. Confira a lista de procedimentos do paciente.'); desenha(); return; }
      var p = sel[i];
      try {
        if (!pronto()) { if (!respondeOutro()) W.novo(true); }
        if (!pronto()) throw new Error('a tela não voltou para um lançamento novo');
        W.selectItemChosen('prreco.procedimento.prciPK', [p.idp, p.ids], [p.cod, p.nome]);
        W.callback.procedimento();
        if (marcados[p.cod]) { var o = campo('prreco.prrecoObs'); if (o) o.value = marcados[p.cod]; }
        W.grava();
        if (pronto()) throw new Error('o sistema não gravou. Veja a mensagem na tela; os próximos não foram lançados');
        escreve('ok', '✓ ' + p.cod + ' ' + p.nome);
        delete marcados[p.cod];   // já gravado: não entra de novo se precisar repetir
        respondeOutro();
        i++;
        setTimeout(proximo, 400);
      } catch (e) {
        escreve('erro', '✗ ' + p.cod + ' ' + p.nome + ': ' + e.message);
        desenha();
      }
    })();
  };
  paciente(); desenha(); q.focus();
})();
