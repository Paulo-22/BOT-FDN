
const { prisma } = require('../database/client');

async function iniciarPonto(discordId, canalId) {
  const pontoAtivo = await prisma.hora.findFirst({
    where: {
      usuario: discordId,
      ativo: true,
    },
  });

  if (pontoAtivo) {
    return { erro: 'Você já possui um ponto ativo!' };
  }

  const hora = await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      canal: canalId,
      ativo: true,
    },
  });

  return {
    sucesso: true,
    hora,
  };
}

async function encerrarPonto(discordId) {
  const pontoAtivo = await prisma.hora.findFirst({
    where: {
      usuario: discordId,
      ativo: true,
    },
  });

  if (!pontoAtivo) {
    return { erro: 'Você não possui ponto ativo.' };
  }

  const fim = new Date();

  const tempoTotal = Math.floor(
    (fim - pontoAtivo.inicio) / 1000
  );

  const hora = await prisma.hora.update({
    where: {
      id: pontoAtivo.id,
    },
    data: {
      fim,
      tempo_total: tempoTotal,
      ativo: false,
    },
  });

  return {
    sucesso: true,
    hora,
    tempoTotal,
  };
}

async function getEstatisticas(discordId) {
  const agora = new Date();

  const inicioDia = new Date(agora);
  inicioDia.setHours(0, 0, 0, 0);

  const inicioSemana = new Date(agora);
  inicioSemana.setDate(
    agora.getDate() - agora.getDay() + (agora.getDay() === 0 ? -6 : 1)
  );
  inicioSemana.setHours(0, 0, 0, 0);

  const inicioMes = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1
  );

  const [hoje, semana, mes, total] = await Promise.all([
    somarHoras(discordId, inicioDia),
    somarHoras(discordId, inicioSemana),
    somarHoras(discordId, inicioMes),
    somarHoras(discordId, null),
  ]);

  return {
    hoje,
    semana,
    mes,
    total,
  };
}

async function somarHoras(discordId, desde) {
  const filtro = {
    usuario: discordId,
    ativo: false,
    tempo_total: {
      not: null,
    },
  };

  if (desde) {
    filtro.inicio = {
      gte: desde,
    };
  }

  const registros = await prisma.hora.findMany({
    where: filtro,
  });

  return registros.reduce(
    (acc, registro) => acc + (registro.tempo_total || 0),
    0
  );
}

async function getRankingGeral() {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: {
      ativo: false,
      tempo_total: {
        not: null,
      },
    },
    _sum: {
      tempo_total: true,
    },
    orderBy: {
      _sum: {
        tempo_total: 'desc',
      },
    },
    take: 10,
  });

  return registros.map((registro) => ({
    usuario: registro.usuario,
    total: registro._sum.tempo_total || 0,
  }));
}

async function getRankingPeriodo(desde) {
  const registros = await prisma.hora.groupBy({
    by: ['usuario'],
    where: {
      ativo: false,
      tempo_total: {
        not: null,
      },
      inicio: {
        gte: desde,
      },
    },
    _sum: {
      tempo_total: true,
    },
    orderBy: {
      _sum: {
        tempo_total: 'desc',
      },
    },
    take: 10,
  });

  return registros.map((registro) => ({
    usuario: registro.usuario,
    total: registro._sum.tempo_total || 0,
  }));
}

async function adicionarHorasManual(discordId, horas) {
  await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      fim: new Date(),
      tempo_total: horas * 3600,
      ativo: false,
      canal: 'MANUAL',
    },
  });
}

async function removerHorasManual(discordId, horas) {
  await prisma.hora.create({
    data: {
      usuario: discordId,
      inicio: new Date(),
      fim: new Date(),
      tempo_total: horas * 3600 * -1,
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