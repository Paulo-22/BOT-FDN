
// Agendador de tarefas automáticas — FDN

const rankingService = require('./rankingService');
const { prisma } = require('../database/client');

const CHAVE_ULTIMO_RESET = 'ultimoResetMensal';

/**
 * Inicia o scheduler que verifica a cada hora se deve executar o reset mensal.
 * O reset ocorre no dia 1 de cada mês.
 * O estado é persistido no banco (EstadoSistema), então reinícios do bot
 * no dia 1 não disparam o reset de novo.
 */
function iniciarScheduler(client) {
  console.log('[SCHEDULER] Iniciado — verificação de reset mensal ativa.');
  setInterval(() => verificarReset(client), 60 * 60 * 1000);
  verificarReset(client);
}

async function verificarReset(client) {
  const agora = new Date();
  if (agora.getDate() !== 1) return;

  const chaveMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

  const estado = await prisma.estadoSistema
    .findUnique({ where: { chave: CHAVE_ULTIMO_RESET } })
    .catch(() => null);

  if (estado?.valor_texto === chaveMes) {
    // Já resetou neste mês — evita rodar de novo em caso de restart do bot
    return;
  }

  console.log('[SCHEDULER] Dia 1 detectado — executando reset mensal...');

  try {
    await rankingService.executarResetMensal(client);

    await prisma.estadoSistema.upsert({
      where: { chave: CHAVE_ULTIMO_RESET },
      create: { chave: CHAVE_ULTIMO_RESET, valor_texto: chaveMes },
      update: { valor_texto: chaveMes },
    });
  } catch (err) {
    console.error('[SCHEDULER] Erro no reset mensal:', err);
  }
}

module.exports = { iniciarScheduler };