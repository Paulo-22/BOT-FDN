// src/services/horasService.js
// Lógica de cálculo de horas do bate-ponto

const { prisma } = require('../database/client');

/**
 * Inicia o ponto de um usuário
 */
async function iniciarPonto(discordId, canalId) {
  // Verifica se já tem ponto ativo
  const pontoAtivo = await prisma.hora.findFirst({
    where: { usuario: discordId, ativo: true },
  });

  if (pontoAtivo) return { erro: 'Você já possui um ponto ativo!' };

  const hora = await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      canal: canalId,
      ativo: true,
    },
  });

  return { sucesso: true, hora };
}

/**
 * Encerra o ponto de um usuário
 */
async function encerrarPonto(discordId) {
  const pontoAtivo = await prisma.hora.findFirst({
    where: { usuario: discordId, ativo: true },
  });

  if (!pontoAtivo) return { erro: 'Você não possui ponto ativo.' };

  const fim = new Date();
  const tempoTotal = Math.floor((fim - pontoAtivo.inicio) / 1000); // em segundos

  const hora = await prisma.hora.update({
    where: { id: pontoAtivo.id },
    data: { fim, tempo_total: tempoTotal, ativo: false },
  });

  return { sucesso: true, hora, tempoTotal };
}

/**
 * Retorna estatísticas de horas de um usuário
 */
async function getEstatisticas(discordId) {
  const agora = new Date();

  // Início do dia
  const inicioDia = new Date(agora);
  inicioDia.setHours(0, 0, 0, 0);

  // Início da semana (segunda-feira)
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay() + (agora.getDay() === 0 ? -6 : 1));
  inicioSemana.setHours(0, 0, 0, 0);

  // Início do mês
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [hoje, semana, mes, total] = await Promise.all([
    somarHoras(discordId, inicioDia),
    somarHoras(discordId, inicioSemana),
    somarHoras(discordId, inicioMes),
    somarHoras(discordId, null),
  ]);

  return { hoje, semana, mes, total };
}

/**
 * Soma horas de um usuário a partir de uma data
 */
async function somarHoras(discordId, desde) {
  const filtro = {
    usuario: discordId,
    ativo: false,
    tempo_total: { not: null },
  };

  if (desde) filtro.inicio = { gte: desde };

  const registros = await prisma.hora.findMany({ where: filtro });
  return registros.reduce((acc, r) => acc + (r.tempo_total || 0), 0);
}

/**
 * Retorna top 10 ranking geral
 */
async function getRankingGeral() {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: { ativo: false, tempo_total: { not: null } },
    _sum: { tempo_total: true },
    orderBy: { _sum: { tempo_total: 'desc' } },
    take: 10,
  });

  return registros.map(r => ({
    usuario: r.usuario,
    total: r._sum.tempo_total || 0,
  }));
}

/**
 * Retorna ranking de um período específico
 */
async function getRankingPeriodo(desde) {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: { ativo: false, tempo_total: { not: null }, inicio: { gte: desde } },
    _sum: { tempo_total: true },
    orderBy: { _sum: { tempo_total: 'desc' } },
    take: 10,
  });

  return registros.map(r => ({
    usuario: r.usuario,
    total: r._sum.tempo_total || 0,
  }));
}

/**
 * Adiciona horas manualmente (admin)
 */
async function adicionarHorasManual(discordId, horas) {
  const segundos = horas * 3600;
  await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      fim: new Date(),
      tempo_total: segundos,
      ativo: false,
      canal: 'MANUAL',
    },
  });
}

/**
 * Remove horas manualmente (admin) — cria registro negativo
 */
async function removerHorasManual(discordId, horas) {
  const segundos = horas * 3600 * -1;
  await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      fim: new Date(),
      tempo_total: segundos,
      ativo: false,
      canal: 'MANUAL_REMOCAO',
    },
  });
}

module.exports = {
  iniciarPonto,
  encerrarPonto,
  getEstatisticas,
  getRankingGeral,
  getRankingPeriodo,
  adicionarHorasManual,
  removerHorasManual,
  somarHoras,
};
