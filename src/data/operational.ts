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
