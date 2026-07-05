# Por que o sal some na água? — Dissolução do NaCl

Página web educacional, interativa e responsiva sobre a dissolução do cloreto de sódio (NaCl) em água, feita com **HTML5, CSS3 e JavaScript puro** (sem frameworks nem dependências externas de build). Pronta para publicar no GitHub Pages.

## Conteúdo da página

1. **Introdução (hero)** — animação contínua em canvas mostrando um cristal de sal se dissolvendo e se reformando.
2. **Explicação conceitual** — quatro cartões explicando ligação iônica, polaridade da água, hidratação dos íons e balanço energético, com a equação de dissociação.
3. **Animação didática por etapas** — 4 estágios navegáveis (com reprodução automática) ilustrando cristal → aproximação da água → hidratação das bordas → íons dispersos.
4. **Simulação interativa** — o usuário controla temperatura, quantidade de sal e agitação, e observa em tempo real a dissolução dos íons Na⁺ e Cl⁻ em um canvas com física simplificada.
5. **Gráfico dinâmico** — curva de % de sal dissolvido × tempo, desenhada em canvas e alimentada pelos dados da simulação.
6. **Quiz com feedback formativo** — 5 perguntas de múltipla escolha com explicação imediata para cada resposta.
7. **Pontuação final** — resultado com mensagem adaptada ao desempenho e opção de refazer o quiz.

## Estrutura de arquivos

```
├── index.html   # estrutura e conteúdo da página
├── style.css    # design system, layout responsivo e animações
├── script.js    # animações em canvas, simulação, gráfico e lógica do quiz
└── README.md    # este arquivo
```

Não há dependências de build: os três arquivos (`index.html`, `style.css`, `script.js`) podem ser abertos diretamente em um navegador ou hospedados em qualquer servidor estático. As únicas fontes externas são do Google Fonts (Space Grotesk, Inter, JetBrains Mono), carregadas via `<link>` no `<head>`.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `dissolucao-nacl`).
2. Faça upload dos quatro arquivos (`index.html`, `style.css`, `script.js`, `README.md`) para a raiz do repositório.
3. No repositório, vá em **Settings → Pages**.
4. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
5. Em **Branch**, selecione `main` (ou `master`) e a pasta `/ (root)`. Salve.
6. Aguarde alguns instantes e acesse o link gerado (algo como `https://seu-usuario.github.io/dissolucao-nacl/`).

Alternativamente, via linha de comando:

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Página inicial: dissolução do NaCl"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/dissolucao-nacl.git
git push -u origin main
```

Depois é só ativar o GitHub Pages como descrito acima.

## Uso em sala de aula

- A simulação (seção 4) pode ser usada como demonstração ao vivo: aumente a temperatura ou ative a agitação e peça aos alunos e alunas que prevejam o resultado antes de rodar.
- O gráfico (seção 5) é alimentado automaticamente pela simulação — é possível repetir o experimento com parâmetros diferentes e comparar as curvas geradas.
- O quiz (seção 6) pode ser usado como verificação de aprendizagem rápida ao final da aula; a pontuação e o feedback aparecem na hora, sem necessidade de correção manual.

## Acessibilidade e desempenho

- Marcação semântica (`header`, `main`, `section`, `footer`) e `aria-label`/`aria-live` nos elementos interativos e nos canvases.
- Link "Pular para o conteúdo" para navegação por teclado.
- Contraste de cores verificado para leitura confortável em fundo claro e escuro.
- Respeita `prefers-reduced-motion`: para quem ativa essa preferência no sistema operacional, as animações contínuas são substituídas por quadros estáticos.
- Totalmente responsivo, com layout reorganizado para telas de celular (colunas empilhadas, textos e botões redimensionados).
- Nenhuma biblioteca externa de JavaScript — apenas Canvas 2D API nativo, o que mantém o carregamento leve.

## Personalização

- **Cores dos íons**: variáveis `--ion-na` e `--ion-cl` em `style.css`.
- **Perguntas do quiz**: array `questions` no início da função `initQuiz()` em `script.js`.
- **Etapas da animação didática**: array `stages` na função `initStages()` em `script.js`.
- **Parâmetros da simulação** (tamanho do cristal, quantidade de moléculas de água, sensibilidade à temperatura/agitação): constantes no início de `initSimulationAndChart()` em `script.js`.

---

Projeto livre para uso, adaptação e distribuição em contexto educacional.
