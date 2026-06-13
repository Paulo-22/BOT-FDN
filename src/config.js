// src/config.js
// Configuração central do bot FDN
// Edite os IDs conforme seu servidor Discord

module.exports = {
  // ============================================
  // CARGOS DA FACÇÃO (IDs dos cargos no Discord)
  // ============================================
  cargos: {
    // Cargos que podem acessar comandos administrativos
    admin:          '1515212078137479268',
    fundador:          '1265868312504696833',
    subFundador:       '1265868313662197851',
    gerente:    '1265868318548557894',

    // Hierarquia da facção (ordem crescente)
    hierarquia: [
      { nome: 'Recruta',      id: 'ID_CARGO_RECRUTA' },
      { nome: 'Membro',       id: 'ID_CARGO_MEMBRO' },
      { nome: 'Veterano',     id: 'ID_CARGO_VETERANO' },
      { nome: 'Elite',        id: 'ID_CARGO_ELITE' },
      { nome: 'Sub-dono',      id: '1265868319890608330' },
      { nome: 'Dono',  id: '1265868318548557894' },
      { nome: 'Sub-Fundador',    id: '1265868313662197851' },
      { nome: 'Fundador',        id: '1265868312504696833' },
    ],

    // Cargo especial
    exonerado: 'ID_CARGO_EXONERADO',
    semCargo:  'ID_CARGO_SEM_CARGO',

    // Cargos com permissão para cada ação
    podePRomover:    ['1265868312504696833', '1265868312504696833', '1265868364597821521'],
    podeRebaixar:    ['1265868312504696833', '1265868312504696833', '1265868364597821521'],
    podeAdvertir:    ['1265868312504696833', '1265868312504696833', '1265868365650722897', 'ID_CARGO_OFICIAL'],
    podeExonerar:    ['1265868312504696833', '1265868312504696833'],
    podeAprovarAusencia: ['1265868312504696833', '1265868312504696833', '1265868365650722897'],
    podeAprovarRecrutamento: ['1265868312504696833', '1265868312504696833', '1265868365650722897'],
    podeDashboard:   ['1265868312504696833', '1265868312504696833', '1265868365650722897'],
    podeTicketStaff: ['1265868312504696833', '1265868312504696833', '1265868365650722897', 'ID_CARGO_OFICIAL'],
  },

  // ============================================
  // CANAIS (IDs dos canais no Discord)
  // ============================================
  canais: {
    // Canais funcionais
    registro:        '1389278353143369818',
    recrutamento:    '1389279188724224062',
    analise:         '1389279206390894784',
    batePonto:       '1304235934073749644',
    ausencias:       '1304237408425873488',
    adminPanel:      '1265868552099991608',
    tickets:         '1265868540494221435',

    // Categoria para tickets
    categoriaTickets: '1515129942344466512',

    // Canais de voz autorizados para bate-ponto
    voiceAutorizados: [
      '1265868591971045408',
      '1265868593464217692',
      '1362165240338321669',
      '1297975693468242021',
      '1265868594655527044',
      '1265868596236521484',
      '1265868597239218240',
    ],

    // Canais de logs
    logs: {
      registro:       '1515126923733499955',
      recrutamento:   '1515126992729673738',
      promocoes:      '1515127175420969201',
      rebaixamentos:  '1515127343004520478',
      advertencias:   '1515127418145476629',
      exoneracoes:    '1515127460276994098',
      ausencias:      '1515127504212594778',
      tickets:        '1515124815042711732',
      batePonto:      '1389344544524468324',
    },
  },

  // ============================================
  // CORES DOS EMBEDS
  // ============================================
  cores: {
    principal:  0x1a1a2e,   // Azul escuro
    sucesso:    0x00b894,   // Verde
    erro:       0xe17055,   // Vermelho
    aviso:      0xfdcb6e,   // Amarelo
    info:       0x74b9ff,   // Azul claro
    neutro:     0x636e72,   // Cinza
    gold:       0xf9ca24,   // Dourado
  },
};
