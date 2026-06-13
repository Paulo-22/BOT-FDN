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
    lider:          '1265868309467762729',
    subLider:       '1265868312504696833',
    coordenador:    '1265868313662197851',

    // Hierarquia da facção (ordem crescente)
    hierarquia: [
      { nome: 'Recruta',      id: '1265868360613101658' },
      { nome: 'Membro',       id: '1265868359682228317' },
      { nome: 'Veterano',     id: '1265868320725270581' },
      { nome: 'Elite',        id: '1265868319890608330' },
      { nome: 'Oficial',      id: '1265868318548557894' },
      { nome: 'Coordenador',  id: '1265868313662197851' },
      { nome: 'Sub-Líder',    id: '1265868312504696833' },
      { nome: 'Líder',        id: '1265868309467762729' },
    ],

    // Cargo especial
    exonerado: '1265868381962108961',
    semCargo:  '1265868402178920559',

    // Cargos com permissão para cada ação
    podePRomover:    ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR'],
    podeRebaixar:    ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR'],
    podeAdvertir:    ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR', 'ID_CARGO_OFICIAL'],
    podeExonerar:    ['1265868309467762729', '1265868312504696833'],
    podeAprovarAusencia: ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR'],
    podeAprovarRecrutamento: ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR'],
    podeDashboard:   ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR'],
    podeTicketStaff: ['1265868309467762729', '1265868312504696833', 'ID_CARGO_COORDENADOR', 'ID_CARGO_OFICIAL'],
  },

  // ============================================
  // CANAIS (IDs dos canais no Discord)
  // ============================================
  canais: {
    // Canais funcionais
    registro:        '1389278353143369818',
    recrutamento:    '1389279188724224062',
    analise:         '1515128153721274550',
    batePonto:       '1304235934073749644',
    ausencias:       '1304237408425873488',
    adminPanel:      '1265868552099991608',
    tickets:         '1265868540494221435',

    // Categoria para tickets
    categoriaTickets: 'ID_CATEG1515129942344466512ORIA_TICKETS',

    // Canais de voz autorizados para bate-ponto
    voiceAutorizados: [
      '1265868591971045408',
      '1265868593464217692',
      '1362165240338321669',
      '1297975693468242021',
      '1265868594655527044',
      '1265868597239218240',
    ],

    // Canais de logs
    logs: {
      registro:       '1389278380414734356',
      recrutamento:   '1515125340421488741',
      promocoes:      '1265868579174355071',
      rebaixamentos:  '1265868581967626333',
      advertencias:   '1265868580747219046',
      exoneracoes:    '1265868582722601064',
      ausencias:      '1515127504212594778',
      tickets:        '1515124815042711732',
      batePonto:      '1389278729120776192',
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
