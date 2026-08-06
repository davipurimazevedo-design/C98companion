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
