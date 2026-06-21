// Verifica periodicamente punições temporárias expiradas e remove o cargo automaticamente.

const config     = require('../config');
const { prisma } = require('../database/client');
const logger     = require('../logs/logger');

const INTERVALO_MS = 5 * 60 * 1000; // a cada 5 minutos

let intervalo = null;

/**
 * Verifica e processa todas as punições ativas cuja data de expiração já passou.
 */
async function processarExpiracoes(client) {
  const agora = new Date();

  const expiradas = await prisma.punicao.findMany({
    where: {
      status: 'ATIVA',
      expira_em: { not: null, lte: agora },
    },
  });

  for (const punicao of expiradas) {
    await removerPunicao(client, punicao, 'EXPIRADA');
  }
}

/**
 * Remove o cargo de punição do membro no Discord e atualiza o registro no banco.
 * `motivoStatus` é 'EXPIRADA' (automático) ou 'REMOVIDA_MANUAL' (admin removeu antes do prazo).
 * `responsavelId` só é usado quando motivoStatus === 'REMOVIDA_MANUAL' — é o discord_id
 * de quem removeu a punição pelo painel.
 */
async function removerPunicao(client, punicao, motivoStatus = 'EXPIRADA', responsavelId = null) {
  try {
    const guildId = config.guildId;
    let membro = null;

    if (!guildId || guildId.startsWith('ID_')) {
      console.error('[PUNICAO SCHEDULER] config.guildId não configurado. Defina o ID do servidor em src/config.js.');
    } else {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      membro = guild ? await guild.members.fetch(punicao.usuario).catch(() => null) : null;
    }

    const removidaManualmente = motivoStatus === 'REMOVIDA_MANUAL';

    if (membro) {
      const cargoId = config.cargos.punicao[punicao.tipo];
      if (cargoId && !cargoId.startsWith('ID_')) {
        await membro.roles.remove(cargoId).catch(() => {});
      }

      membro.send({
        embeds: [
          {
            color: config.cores.sucesso,
            title: '✅ Punição removida',
            description: removidaManualmente
              ? `Sua punição (**${punicao.tipo}**) foi removida manualmente pela equipe, antes do prazo original.\n` +
                `**Motivo original:** ${punicao.motivo}`
              : `Sua punição (**${punicao.tipo}**) expirou e o cargo foi removido automaticamente.\n` +
                `**Motivo original:** ${punicao.motivo}`,
            timestamp: new Date().toISOString(),
          },
        ],
      }).catch(() => {});
    }

    await prisma.punicao.update({
      where: { id: punicao.id },
      data: {
        status: motivoStatus,
        removida_em: new Date(),
        removido_por: removidaManualmente ? responsavelId : null,
      },
    });

    if (removidaManualmente) {
      await logger.logPunicaoRemovidaManual(client, punicao, responsavelId);
    } else {
      await logger.logPunicaoExpirada(client, punicao);
    }
  } catch (err) {
    console.error(`[PUNICAO SCHEDULER] Erro ao processar punição #${punicao.id}:`, err.message);
  }
}

/**
 * Inicia o scheduler. Deve ser chamado uma vez, após o client estar pronto (ready).
 */
function iniciar(client) {
  if (intervalo) return; // evita registrar múltiplos intervalos

  // Primeira verificação logo na subida do bot, depois a cada INTERVALO_MS
  processarExpiracoes(client).catch(err =>
    console.error('[PUNICAO SCHEDULER] Erro na verificação inicial:', err.message),
  );

  intervalo = setInterval(() => {
    processarExpiracoes(client).catch(err =>
      console.error('[PUNICAO SCHEDULER] Erro na verificação periódica:', err.message),
    );
  }, INTERVALO_MS);

  console.log(`⏱️  Scheduler de punições iniciado (verificação a cada ${INTERVALO_MS / 60000} min).`);
}

function parar() {
  if (intervalo) {
    clearInterval(intervalo);
    intervalo = null;
  }
}

module.exports = { iniciar, parar, processarExpiracoes, removerPunicao };