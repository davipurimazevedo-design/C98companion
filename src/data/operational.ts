/**
 * Parâmetros operacionais.
 *
 * Não vêm do Manual de Peso e Balanceamento: são decisões de emprego, tomadas
 * pelo operador. Ficam nesta pasta mesmo assim, para que todo número que
 * influencia um resultado esteja num só lugar.
 */

/**
 * Peso médio por passageiro, em quilogramas, usado apenas para ESTIMAR quantos
 * passageiros ainda cabem no peso disponível.
 *
 * Não entra em nenhum cálculo de peso real — o peso dos passageiros embarcados
 * é sempre o que o piloto digita.
 *
 * O valor é deliberadamente conservador. Subestimar o médio faria o aplicativo
 * anunciar mais passageiros do que de fato cabem, e o erro só apareceria no
 * pátio, com gente já embarcada. Superestimar apenas deixa margem sobrando.
 *
 * >>> Se a unidade tiver peso padrão normatizado, ele prevalece sobre este. <<<
 */
export const AVERAGE_PASSENGER_KG = 90;

/**
 * Combustível com que todo planejamento começa, em LIBRAS.
 *
 * NÃO é limite do manual: é o mínimo com que a unidade decola, qualquer que
 * seja o combustível que a missão pediria. Por isso o campo já nasce
 * preenchido, em vez de em branco — planejar a partir de menos que isto seria
 * planejar um voo que não acontece.
 *
 * O piloto pode alterar o valor à vontade; o que muda é o ponto de partida.
 */
export const MINIMUM_TAKEOFF_FUEL_LB = 900;

/**
 * Percentual da pista a partir do qual a margem passa a ser sinalizada como
 * crítica, na tela de Performance.
 *
 * O POH NÃO publica esse critério: ele diz qual distância a aeronave exige, e
 * para. Decidir quanta sobra é pouca é decisão de emprego — aqui, consumir
 * mais de 80% da pista disponível acende o amarelo, e ultrapassar os 100%
 * acende o vermelho.
 *
 * A tela informa que este número não vem do manual, para que ninguém o
 * confunda com um limite publicado.
 */
export const RUNWAY_CRITICAL_USED_PCT = 80;
