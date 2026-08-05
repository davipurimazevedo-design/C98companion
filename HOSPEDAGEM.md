# Hospedagem

O aplicativo é estático: `npm run build` produz `dist/`, que qualquer
hospedagem de arquivos serve. Não há servidor, banco de dados nem chamada de
rede — o planejamento inteiro acontece no aparelho do piloto.

## Vercel

A configuração está em `vercel.json`. JSON não aceita comentário, então o porquê
de cada linha fica aqui.

**`rewrites` para `index.html`** — o aplicativo é de página única. Qualquer
endereço digitado precisa cair na aplicação, e não num 404 da hospedagem.

**`Cache-Control: must-revalidate` em `index.html`, `sw.js` e o manifesto** — é a
linha mais importante do arquivo. Um service worker preso no cache da borda faz
o piloto continuar planejando contra uma transcrição antiga do manual sem
nenhum sinal na tela. Estes três arquivos são reconferidos a cada abertura; os
demais são versionados pelo nome e podem ser cacheados para sempre.

**`assets/` imutável** — o Vite carimba o hash do conteúdo no nome do arquivo.
Nome novo a cada versão, então cachear por um ano é seguro e deixa o aplicativo
abrir instantaneamente.

**`engines.node`** no `package.json` — para a Vercel construir na mesma versão
em que o projeto compila localmente.

## Publicar

Duas formas, ambas exigindo login na conta da Vercel:

1. **Repositório no GitHub ligado à Vercel.** Cada `git push` reconstrói e
   publica. É o caminho recomendado: o histórico do que foi transcrito de qual
   revisão do manual fica versionado junto com o código.
2. **`npx vercel`** na pasta do projeto, sem GitHub. Mais rápido para o primeiro
   teste, sem histórico remoto.

## Depois de publicado

- Abrir o endereço no celular e instalar pelo menu do navegador. O aplicativo
  passa a ter ícone próprio e abre em tela cheia.
- Confirmar que abre em modo avião.
- Conferir a barra de rodapé: versão do aplicativo e revisão do manual precisam
  bater com a transcrição vigente.
- Ao publicar uma versão nova, o aplicativo aberto avisa "Há uma versão nova
  disponível" em vez de trocar por baixo do piloto no meio de um planejamento.

## O que não vai para o repositório

As digitalizações do manual não estão no projeto e não devem entrar. O que o
código guarda são os valores transcritos, cada um com a página de origem
anotada no comentário.
