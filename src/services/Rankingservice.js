
// Sistema de Ranking e Metas de Horas — FDN

const { EmbedBuilder } = require('discord.js');
const { prisma }       = require('../database/client');
const config           = require('../config');

const SEPARADOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

// ─────────────────────────────────────────────────────────────────────────────
// METAS POR CARGO (em horas mensais)
// ID do cargo → horas exigidas
// ─────────────────────────────────────────────────────────────────────────────
const METAS_POR_CARGO = {
  '1265868360613101658': 3,   // ᴏʙsᴇʀᴠᴀᴄᴀᴏ
  '1265868359682228317': 6,   // ᴄᴀᴍᴘᴀɴᴀ
  '1265868358469947396': 9,   // ᴄʀɪᴀ
  '1298063359153012786': 12,  // ᴠᴀᴘᴏʀ
  '1265868356930633820': 15,  // ᴏʟʜᴇɪʀᴏ
  '1298062889923510334': 18,  // ᴀᴠɪᴀᴏᴢɪɴʜᴏ
  '1298063119146553344': 21,  // ғᴏɢᴜᴇᴛᴇɪʀᴏ
  '1298063355508035647': 24,  // ᴄʀɪᴍɪɴᴏsᴏ
  '1298063563621007372': 27,  // ᴛʀᴀғɪᴄᴀɴᴛᴇ
  '1298338702262665287': 30,  // ʜᴏᴍɪᴄɪᴅᴀ
  '1265868354690875515': 35,  // ᴇxᴇᴄᴜᴛᴏʀ
  '1265868354074185831': 40,  // ᴍᴇʀᴄᴇɴᴀʀɪᴏ
  '1265868352266440785': 45,  // ᴍᴀᴛᴀᴅᴏʀ ᴅᴇ ᴀʟᴜɢᴜᴇʟ
  '1265868352996380805': 50,  // ᴄᴏɴᴛʀᴀʙᴀɴᴅɪsᴛᴀ
  '1265868349796126795': 55,  // ᴍᴀɴᴅʀᴀᴋᴇ
  '1265868349108125746': 60,  // ʟᴀᴅʀᴀ̃ᴏ ᴅᴇ ᴄᴀʀɢᴀ
  '1265868347719942156': 65,  // sᴇʀɪᴀʟ ᴋɪʟᴇʀ
  '1265868346470039554': 70,  // ᴘɪʟᴏᴛᴏ ᴅᴇ ғᴜɢᴀ
  '1265868345027330103': 75,  // sᴇǫᴜᴇsᴛʀᴀᴅᴏʀ
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

function formatarTempo(segundos) {
  const s = Math.abs(segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
}

function barraProgresso(atual, meta, tamanho = 10) {
  const pct     = Math.min(atual / meta, 1);
  const cheios  = Math.round(pct * tamanho);
  const vazios  = tamanho - cheios;
  const barra   = '█'.repeat(cheios) + '░'.repeat(vazios);
  const percent = Math.floor(pct * 100);
  return `\`${barra}\` ${percent}%`;
}

/** Retorna a meta em SEGUNDOS do cargo mais alto do membro na hierarquia */
function getMetaMembro(member) {
  if (!member) return null;
  for (let i = config.cargos.hierarquia.length - 1; i >= 0; i--) {
    const cargo = config.cargos.hierarquia[i];
    if (member.roles.cache.has(cargo.id) && METAS_POR_CARGO[cargo.id] !== undefined) {
      return {
        nome:     cargo.nome,
        horasMeta: METAS_POR_CARGO[cargo.id],
        segundos: METAS_POR_CARGO[cargo.id] * 3600,
      };
    }
  }
  return null;
}

/** Soma horas de um usuário a partir de uma data (ou total) */
async function somarHorasPeriodo(discordId, desde = null) {
  const where = { usuario: discordId, ativo: false, tempo_total: { not: null } };
  if (desde) where.inicio = { gte: desde };
  const registros = await prisma.hora.findMany({ where });
  return registros.reduce((acc, r) => acc + (r.tempo_total || 0), 0);
}

/** Início do mês atual */
function inicioMesAtual() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKING GERAL (all-time) — Top 10
// ─────────────────────────────────────────────────────────────────────────────
async function getRankingGeral() {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: { ativo: false, tempo_total: { not: null } },
    _sum: { tempo_total: true },
    orderBy: { _sum: { tempo_total: 'desc' } },
    take: 10,
  });
  return registros.map(r => ({ usuario: r.usuario, total: r._sum.tempo_total || 0 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKING MENSAL — Top 10 do mês atual
// ─────────────────────────────────────────────────────────────────────────────
async function getRankingMensal() {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: { ativo: false, tempo_total: { not: null }, inicio: { gte: inicioMesAtual() } },
    _sum: { tempo_total: true },
    orderBy: { _sum: { tempo_total: 'desc' } },
    take: 10,
  });
  return registros.map(r => ({ usuario: r.usuario, total: r._sum.tempo_total || 0 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// EMBED DO RANKING — exibido via botão no painel
// ─────────────────────────────────────────────────────────────────────────────
async function embedRanking() {
  const [geral, mensal] = await Promise.all([getRankingGeral(), getRankingMensal()]);

  const medalhas = ['🥇', '🥈', '🥉'];
  const fmt = (arr) =>
    arr.length
      ? arr.map((r, i) =>
          `${medalhas[i] ?? `\`#${i + 1}\``} <@${r.usuario}> — \`${formatarTempo(r.total)}\``
        ).join('\n')
      : '_Nenhum registro encontrado._';

  const agora  = new Date();
  const nomeMes = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return new EmbedBuilder()
    .setColor(config.cores.gold)
    .setAuthor({ name: '🏆  RANKING DE ATIVIDADE  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**🏆  TOP 10 — GERAL (All-time)**\n${fmt(geral)}\n\n` +
      `**📅  TOP 10 — ${nomeMes.toUpperCase()}**\n${fmt(mensal)}\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: `FDN — Atualizado em ${agora.toLocaleString('pt-BR')}` })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────────────────────
// EMBED DE HORAS DO MEMBRO — exibido via botão "HORAS"
// ─────────────────────────────────────────────────────────────────────────────
async function embedMinhasHoras(member) {
  const userId  = member.id;
  const agora   = new Date();
  const inicio  = inicioMesAtual();

  const [totalGeral, totalMes] = await Promise.all([
    somarHorasPeriodo(userId),
    somarHorasPeriodo(userId, inicio),
  ]);

  const meta = getMetaMembro(member);
  const nomeMes = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  let metaBloco = '';
  if (meta) {
    const restante  = Math.max(meta.segundos - totalMes, 0);
    const atingiu   = totalMes >= meta.segundos;
    metaBloco =
      `\n${SEPARADOR}\n\n` +
      `**🎯  META DO CARGO — ${nomeMes.toUpperCase()}**\n` +
      `**Cargo:** \`${meta.nome}\`\n` +
      `**Meta:** \`${meta.horasMeta}h\`\n` +
      `**Registrado:** \`${formatarTempo(totalMes)}\`\n` +
      `**Progresso:** ${barraProgresso(totalMes, meta.segundos)}\n` +
      (atingiu
        ? `\n✅ **Meta atingida!** Parabéns!`
        : `\n⏳ **Faltam:** \`${formatarTempo(restante)}\``);
  }

  return new EmbedBuilder()
    .setColor(config.cores.info)
    .setAuthor({ name: '⏱️  MINHAS HORAS  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${userId}>\n\n` +
      `**📅  Este mês (${nomeMes}):** \`${formatarTempo(totalMes)}\`\n` +
      `**🏆  Total geral:** \`${formatarTempo(totalGeral)}\`\n` +
      metaBloco +
      `\n\n${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Controle de Ponto' })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR META — checa se o membro bateu a meta ao encerrar ponto
// Retorna { atingiu, meta, totalMes }. "atingiu" só vem true na PRIMEIRA vez
// que a meta é batida no mês (evita notificação duplicada em pontos seguintes).
// ─────────────────────────────────────────────────────────────────────────────
async function verificarMeta(member) {
  const meta = getMetaMembro(member);
  if (!meta) return { atingiu: false };

  const totalMes = await somarHorasPeriodo(member.id, inicioMesAtual());
  const bateuMeta = totalMes >= meta.segundos;

  if (!bateuMeta) {
    return { atingiu: false, meta, totalMes };
  }

  // Tenta registrar a notificação. Se já existir (constraint única usuario+mes),
  // significa que essa meta já foi notificada antes neste mês.
  try {
    await prisma.metaAtingida.create({
      data: { usuario: member.id, mes: inicioMesAtual() },
    });
    return { atingiu: true, meta, totalMes };
  } catch (err) {
    if (err.code === 'P2002') {
      // Já notificado neste mês — não dispara de novo
      return { atingiu: false, meta, totalMes };
    }
    console.error('[RANKING] Erro ao registrar notificação de meta:', err);
    return { atingiu: false, meta, totalMes };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET MENSAL — zera registros criando snapshot no histórico
// Chamado pelo scheduler no dia 1 de cada mês
// ─────────────────────────────────────────────────────────────────────────────
async function executarResetMensal(client) {
  const agora   = new Date();
  const nomeMes = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  console.log(`[RANKING] Executando reset mensal — ${nomeMes}`);

  // Busca todos os usuários que tiveram horas no mês
  const inicio = inicioMesAtual();
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: { ativo: false, tempo_total: { not: null }, inicio: { gte: inicio } },
    _sum: { tempo_total: true },
  });

  // Salva snapshot no histórico mensal
  for (const r of registros) {
    await prisma.rankingSnapshot.upsert({
      where: { usuario_mes: { usuario: r.usuario, mes: inicio } },
      create: { usuario: r.usuario, mes: inicio, total: r._sum.tempo_total || 0 },
      update: { total: r._sum.tempo_total || 0 },
    }).catch(() => {});
  }

  // Envia resumo no canal de log de bate-ponto
  const canalId = config.canais.logs.batePonto;
  if (!canalId || canalId.startsWith('ID_')) return;
  const canal = await client.channels.fetch(canalId).catch(() => null);
  if (!canal) return;

  const top3 = registros
    .sort((a, b) => (b._sum.tempo_total || 0) - (a._sum.tempo_total || 0))
    .slice(0, 3);

  const medalhas = ['🥇', '🥈', '🥉'];
  const topTxt = top3.length
    ? top3.map((r, i) => `${medalhas[i]} <@${r.usuario}> — \`${formatarTempo(r._sum.tempo_total || 0)}\``).join('\n')
    : '_Nenhum registro._';

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.gold)
        .setAuthor({ name: `🔄  RESET MENSAL CONCLUÍDO  ·  FDN` })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> O ranking do mês de **${nomeMes}** foi encerrado.\n\n` +
          `**🏆  Pódio do mês:**\n${topTxt}\n\n` +
          `**📊  Total de membros:** \`${registros.length}\`\n` +
          `**📅  Novo ciclo iniciado em:** <t:${Math.floor(agora.getTime() / 1000)}:F>\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Reset Automático Mensal' })
        .setTimestamp(),
    ],
  });

  console.log(`[RANKING] Reset mensal concluído. ${registros.length} membros processados.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTÓRICO MENSAL DE UM MEMBRO
// ─────────────────────────────────────────────────────────────────────────────
async function getHistoricoMembro(discordId) {
  const snapshots = await prisma.rankingSnapshot.findMany({
    where: { usuario: discordId },
    orderBy: { mes: 'desc' },
    take: 6,
  }).catch(() => []);

  return snapshots;
}

module.exports = {
  embedRanking,
  embedMinhasHoras,
  verificarMeta,
  executarResetMensal,
  getHistoricoMembro,
  getRankingGeral,
  getRankingMensal,
  formatarTempo,
  getMetaMembro,
  METAS_POR_CARGO,
};