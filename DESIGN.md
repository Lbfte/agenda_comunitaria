---
version: "1.0"
theme: "Muted Forest Night"
colors:
  primary:
    base: "#7A8F6B"
    foreground: "#1E1E1E"
    transparent_25: "rgba(122, 143, 107, 0.25)"
    transparent_10: "rgba(122, 143, 107, 0.10)"
  background:
    base: "#1E1E1E"
  foreground:
    base: "#E8E8E8"
    muted_60: "rgba(255, 255, 255, 0.60)"
    muted_50: "rgba(255, 255, 255, 0.50)"
    muted_40: "rgba(255, 255, 255, 0.40)"
    muted_35: "rgba(255, 255, 255, 0.35)"
    muted_14: "rgba(255, 255, 255, 0.14)"
  card:
    base: "#3A3A3A"
    foreground: "#E8E8E8"
    transparent_35: "rgba(58, 58, 58, 0.35)"
  secondary:
    base: "#2A2A2A"
    foreground: "#E8E8E8"
    transparent_60: "rgba(42, 42, 42, 0.60)"
  muted:
    base: "#2A2A2A"
    foreground: "#999999"
  border:
    base: "rgba(255, 255, 255, 0.08)"
    dark: "#222222"
    card: "#3A3A3A"
typography:
  font_families:
    primary: "'Lexend', sans-serif"
    secondary: "'Comfortaa', sans-serif"
  sizes:
    base: "16px"
    sm: "14px"
    xs: "13px"
    xxs: "12px"
    tiny: "11px"
  weights:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
radii:
  sm: "6px"
  md: "8px"
  base: "10px"
  lg: "14px"
  pill: "16px"
motion:
  transitions:
    all: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
  scale:
    active: "scale(0.98)"
---

# Design System: Agenda Comunitária

## Visão Geral
O sistema de design adota uma estética noturna, elegante e aconchegante, focada em tons escuros e acentos sutis inspirados na natureza (tons de verde sálvia). Ele foi projetado para transmitir tranquilidade e foco, reduzindo o cansaço visual por meio de um fundo escuro suave e contrastes tipográficos controlados. O visual faz uso de elementos semitransparentes ("glassmorphism" orgânico) para indicar interatividade e hierarquia sem sobrecarregar a interface.

## Filosofia Visual

### Cores e Atmosfera
A paleta principal é ancorada em tons escuros foscos (`#1E1E1E` e `#2A2A2A`), fugindo do preto absoluto para manter uma atmosfera mais macia e aconchegante. O grande diferencial está no uso do verde sálvia (`#7A8F6B`) como cor de destaque. Esta cor não é excessivamente vibrante, o que mantém a interface com um tom maduro e calmante. Elementos interativos fazem amplo uso de camadas semitransparentes (ex: botões e cards com fundos em `rgba`), criando uma sensação de profundidade por meio da sobreposição de opacidades, em vez de depender apenas de luzes ou sombras sólidas.

### Tipografia
O design combina duas famílias tipográficas distintas que se complementam harmoniosamente:
- **Lexend:** Utilizada como a base principal para garantir proporções amplas e uma legibilidade excepcional, mesmo nos tamanhos menores (11px ou 12px) empregados em metadados.
- **Comfortaa:** Traz formas geométricas e altamente arredondadas que conferem uma personalidade amigável e suave, quebrando a rigidez típica e a formalidade de muitas interfaces escuras.

O uso sistemático de opacidades variadas (de 14% a 60%) sobre o texto claro estabelece uma hierarquia visual clara, guiando naturalmente os olhos do usuário das informações cruciais para detalhes secundários, datas e rótulos inativos.

### Formas, Espaçamento e Bordas
As interfaces evitam ativamente os cantos retos. Cards e contêineres principais adotam arredondamentos precisos (8px a 10px), enquanto botões seccionais e elementos de filtragem frequentemente assumem formatos de "pílula" (16px / `rounded-2xl`). 

Linhas divisórias são usadas com extrema parcimônia e, quando presentes, são bordas extremamente finas e sutis (`rgba(255, 255, 255, 0.08)` ou o tom escuro `#222222`) que separam o conteúdo sem pesar a interface visualmente. O design também incorpora pequenos ícones geométricos sólidos (como triângulos e triângulos invertidos) para sinalizar diferentes estados contextuais.

### Movimento e Interação
As interações foram pensadas para serem táteis e responsivas. Elementos clicáveis reagem imediatamente com transições suaves de cor e, fundamentalmente, apresentam um pequeno efeito físico de encolhimento (`scale(0.98)`) quando pressionados ativamente. Isso cria uma sensação táctil, imitando o comportamento de botões de um equipamento de hardware premium, o que engaja o usuário de maneira natural.
