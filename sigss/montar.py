"""Gera sigss/index.html (página de instalação) a partir de sigss/lancar.js. Rodar depois de mudar o lancar.js."""
import html, pathlib, urllib.parse
aqui = pathlib.Path(__file__).parent
codigo = (aqui / 'lancar.js').read_text()
link = 'javascript:' + urllib.parse.quote(codigo, safe="()*!'-_.~")
pagina = (aqui / 'modelo.html').read_text().replace('{{LINK}}', html.escape(link, quote=True)).replace('{{CODIGO}}', html.escape(link))
(aqui / 'index.html').write_text(pagina)
print('ok', len(link), 'caracteres')
