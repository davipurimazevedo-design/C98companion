# Dados técnicos

Esta pasta é o **único lugar** do sistema onde entram números do manual e das
fichas de pesagem. Nenhum outro arquivo do projeto contém limite, peso ou
capacidade.

Consequência prática: para atualizar o aplicativo depois de uma revisão do
manual ou de uma nova pesagem, mexe-se só aqui. A interface e os cálculos não
mudam.

---

## Situação atual

**Cadastrado** — Cessna Model 208B (675 SHP), Pilot's Operating Handbook,
Section 6 — Weight & Balance / Equipment List, **Revision 23**, e
Section 5 — Performance, mesma revisão (ver `performance/` ao final).

| Dado | Valor | Página |
|---|---|---|
| Peso máximo de rampa | 8.785 LB | 6-15 |
| Peso máximo de decolagem | 8.750 LB | 6-13, 6-15 |
| Peso máximo de pouso | 8.500 LB | 6-15 |
| Carga máxima da cabine | 3.400 LB | 6-11 |
| Carga máxima do cargo pod | 1.090 LB | 6-22 |
| Combustível utilizável | 332 gal · 2.224 LB | 6-9 |
| Combustível de táxi | 35 LB | 6-13 |
| Limites das 6 zonas e dos 4 compartimentos | tabela | 6-22 |

**Pendente** — o peso básico vazio, o momento básico e a data de pesagem da
**FAB 2720**. Esses valores **não estão no manual do modelo**: vêm da ficha de
pesagem da própria cauda (*Airplane Weighing Form* / *Weight and Balance
Record*), normalmente no envelope plástico ao fim do manual da aeronave.

Enquanto faltarem, o aplicativo soma o carregamento normalmente, mas exibe `—`
no peso total, no peso disponível e no combustível adicional.

---

## Regra inegociável

Todo campo não cadastrado permanece com o valor `PENDING`. **Não preencha por
estimativa, por memória, por outra aeronave, por publicação da internet nem por
comparação com outro modelo.**

Um campo vazio produz uma tela honesta. Um campo errado produz uma decisão
errada no pátio.

---

## Arquivos

| Arquivo | O que contém | Fonte |
|---|---|---|
| `conversion.ts` | Fator kg → LB e política de arredondamento | Equivalência física |
| `aircraft/types.ts` | Contrato: quais campos existem | Estrutura, sem valores |
| `aircraft/c98.limits.ts` | Pesos máximos e limites de grupo | Manual, Seção 6 |
| `aircraft/c98.fuel.ts` | Capacidade de combustível | Manual, página 6-9 |
| `aircraft/c98.positions.ts` | Zonas da cabine e compartimentos do pod | Manual, página 6-22 |
| `aircraft/fleet.ts` | Matrículas e seus pesos básicos | Ficha de pesagem |
| `aircraft/index.ts` | Acesso aos dados | Código, não editar ao cadastrar |
| `aircraft/manual.test.ts` | Conferência de cada valor contra a página | Auditoria |

---

## Para cadastrar a FAB 2720

Abra `aircraft/fleet.ts` e substitua os três `PENDING` pelos valores da ficha de
pesagem. Nada mais precisa ser tocado — o aviso some da tela e todos os
cálculos passam a aparecer automaticamente.

---

## Para acrescentar outra aeronave

Copie o bloco inteiro dentro de `FLEET`, em `aircraft/fleet.ts`, e altere `id`,
`tail` e `hasCargoPod`. A nova matrícula aparece sozinha no seletor.

O campo `hasCargoPod` controla se os compartimentos A a D aparecem na tela e se
o limite de 1.090 LB do pod é verificado.

---

## Dois limites por zona

O manual publica limites diferentes conforme a carga esteja amarrada:

- **`maxSecuredLb`** — carga presa por tie-downs. É o máximo da baia.
- **`maxUnsecuredLb`** — carga apenas contida por divisórias. Exige densidade de
  até 7,9 lb/ft³ e baia com 75% ou mais de ocupação.

O piloto escolhe o modo no planejamento, e todos os limites mudam junto. Os
compartimentos do cargo pod têm um único valor publicado, repetido nos dois
campos.

---

## O que o manual não publica

Ausentes do sistema de propósito, por não constarem da Seção 6:

- **Peso máximo zero combustível** — não declarado para o 208B.
- **Carga útil máxima geral** — o manual limita por zona, por cabine e por pod,
  não por um total de carga útil.

Limites que existem mas o aplicativo não tem como verificar, por dependerem das
dimensões do volume embarcado:

- Piso da cabine: 200 lb/ft² entre as estações 100 e 332 (página 6-18).
- Cargo pod: 30 lb/ft² (página 6-22).

---

## Combustível e temperatura

A capacidade utilizável está cadastrada como 2.224 LB, que é 332 gal × 6,7
lb/gal a 60 °F. O manual adverte que o combustível pesa cerca de 0,1 lb/gal a
mais a cada 25 °F de queda de temperatura — os mesmos 332 galões chegam a
2.258 LB a 35 °F.

Portanto o limite em libras é uma referência, não um teto físico absoluto: em
dia frio cabe mais peso de combustível dentro do mesmo volume.

---

## Ao acrescentar um limite novo

1. Acrescente o campo em `aircraft/types.ts`.
2. O compilador apontará todos os pontos que precisam considerá-lo.
3. Preencha o valor no arquivo correspondente, anotando a página.
4. Inclua o rótulo em `describeMissingData`, em `aircraft/index.ts`.
5. Acrescente a asserção em `aircraft/manual.test.ts`.

---

## Tabelas de performance (`performance/`)

Transcrição da **Section 5 — Performance**, mesma Revision 23, somente do
bloco *AIRPLANES WITH CARGO POD INSTALLED*: toda a frota da unidade tem pod, e
as tabelas sem pod não estão cadastradas.

| Arquivo | Tabela | Figura | Páginas |
|---|---|---|---|
| `c98.takeoff20.ts` | Decolagem short field, flaps 20° | 5-9 | 5-22, 5-23 |
| `c98.takeoff0.ts` | Decolagem, flaps 0° | 5-9A | 5-24, 5-25 |
| `c98.landing.ts` | Pouso short field, flaps 30° | 5-23 | 5-59, 5-60 |

Cada tabela carrega os **próprios eixos**. A de flaps 0° vai de −20 a 10 °C, e
as outras de −10 a 40 °C — ler uma com o eixo da outra devolveria a coluna
errada em silêncio.

São cerca de novecentos números copiados à mão, e um dígito trocado não
aparece como erro: aparece como distância plausível e falsa. Duas auditorias
automáticas defendem a transcrição:

- **`monotonia.test.ts`** — a distância cresce com altitude, com temperatura e
  com peso em toda a grade publicada, e os traços do manual só aparecem no
  canto quente e alto. Qualquer inversão é praticamente sempre dígito trocado.
  Vale para qualquer tabela nova, só por ela ser registrada em `index.ts`.
- **`manual.test.ts`** — repete os cantos de cada bloco com a página anotada,
  para pegar linha ou coluna deslocada, que preserva a ordem e escaparia da
  monotonia.

Além delas, os dois *Sample Problems* do próprio manual (páginas 5-7 e 5-11)
são teste em `domain/performance/index.test.ts`.

### Para acrescentar uma tabela

1. Transcreva num arquivo novo, seguindo o formato de `types.ts`.
2. Registre em `index.ts` — as auditorias passam a valer sozinhas.
3. Acrescente os cantos e as particularidades em `manual.test.ts`.

---

## Conferência

- `npm run test` — a suíte inclui `manual.test.ts`, que repete cada valor
  publicado e a página de origem.
- Reproduza pelo menos dois exemplos de carregamento do próprio manual e
  confira os resultados número a número.
- Confirme que o aviso de dados pendentes desapareceu da tela.
