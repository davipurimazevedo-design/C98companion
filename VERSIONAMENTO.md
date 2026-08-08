# Versionamento

O número em `package.json` segue [semver](https://semver.org/lang/pt-BR/):
`MAJOR.MINOR.PATCH`. Enquanto o aplicativo estiver em **beta** — hoje —, fica
em `0.MINOR.PATCH`: o zero à frente já é, por convenção, o sinal de que a
ferramenta ainda não foi validada para uso operacional independente.

## Quando subir cada número

**PATCH** (`0.2.0` → `0.2.1`) — ajuste que não muda o que o piloto pode fazer:
correção de texto, de arredondamento, de estilo, um defeito de tela. Nada que
mude a forma como um dado é lançado ou lido.

**MINOR** (`0.2.1` → `0.3.0`) — qualquer alteração perceptível ao piloto: uma
seção reorganizada, um recurso novo, um dado a mais na conferência. É a faixa
onde a maior parte dos pedidos vai cair.

**MAJOR** (`0.x.y` → `1.0.0`) — reservado para o dia em que o piloto declarar o
aplicativo validado contra planejamentos reais e pronto para uso operacional
independente, sem o selo "Beta" na tela. Depois de `1.0.0`, um novo `MAJOR`
passaria a significar uma mudança que quebra o que já existe — por exemplo, um
formato de dado salvo que não é mais lido por versões antigas.

## Regra prática

Ao final de uma rodada de mudanças — não a cada arquivo tocado — decidir o
tamanho do salto pela regra acima e:

1. Atualizar `version` em `package.json`.
2. Descrever o motivo no commit, como já é feito.

O rodapé do aplicativo (`VersionBar`) lê `__APP_VERSION__` direto do
`package.json` — não há número escrito à mão em nenhuma outra tela.

## Selo "Beta"

Aparece no topo da tela, ao lado do nome da aeronave — sinaliza que o
aplicativo ainda está em fase de testes, independente do número de versão.
Sai quando o piloto confirmar que o aplicativo foi conferido contra
planejamentos reais e pode ser usado sem essa ressalva. Essa decisão é
separada do versionamento: pode-se chegar a `0.9.0` ainda em beta, ou tirar o
selo num `0.x` se a validação vier antes de qualquer motivo para subir para
`1.0.0`.

## Histórico até aqui

| Versão | O que entrou |
|---|---|
| 0.1.0 | Cálculo completo: peso, limites, combustível, centragem, unidades alternativas |
| 0.2.0 | Mapa tocável da aeronave (assentos, pod, zonas), funções corretas de tripulação, seções de carga separadas, conferência em quilogramas, rodapé de procedência, selo Beta |
| 0.2.1 | Correção: "Distribuir pela média" dividia o peso total pelos assentos instalados, e não pela quantidade de passageiros informada |
| 0.2.2 | Correção: tripulantes extras (Mecânico e além) usavam o braço dianteiro fixo no cálculo de momento, e não o do assento da cabine que de fato ocupam. Mecânico travado ao assento 4, próximos tripulantes aos seguintes; assentos de passageiro e a estimativa de quantos cabem descontam os que a tripulação ocupou |
| 0.3.0 | Mecânico vira tripulante fixo, como piloto e copiloto: presente desde o início, sem precisar de "+ Adicionar tripulante", e sem botão de remover. Toda missão passa a ter 8 assentos de passageiro por padrão, refletindo o assento 4 já reservado |
| 0.3.1 | Correção: tripulante extra além do Mecânico reservava assento da cabine mesmo com o peso em branco, empurrando passageiros reais para assentos mais traseiros e deslocando o CG sem nenhum peso justificando |
| 0.4.0 | Módulo de Performance: distância de decolagem (flaps 20° e 0°) e de pouso, lidas das tabelas da Section 5 do POH, corrigidas para vento e comparadas com o comprimento da pista. Abas no topo separando as duas telas |
| 0.5.0 | Performance só com flaps 20° na decolagem — a tabela de flaps 0°, que vale para decolagem com fluido anti-gelo e para em 10 °C, saiu. Todas as distâncias passam a ser exibidas em metros; a altitude-pressão continua em pés |
| 0.6.0 | Margem de pista passa a comparar a CORRIDA NO SOLO, e não a distância para 50 pés; unidade nos cabeçalhos das colunas em metros. Combustível começa em 900 LB, o mínimo com que a unidade decola |
