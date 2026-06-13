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
    lider:          '1265868312504696833',
    subLider:       '1265868313662197851',
    coordenador:    '1265868318548557894',

    // Hierarquia da facção (ordem crescente)
    hierarquia: [
      { nome: 'Recruta',      id: '1265868327239024803' },
      { nome: 'Membro',       id: '1265868325662101605' },
      { nome: 'Veterano',     id: '1265868325033082901' },
      { nome: 'Elite',        id: '1265868320725270581' },
      { nome: 'Oficial',      id: '1265868319890608330' },
      { nome: 'Coordenador',  id: '1265868318548557894' },
      { nome: 'Sub-Líder',    id: '1265868313662197851' },
      { nome: 'Líder',        id: '1265868312504696833' },
    ],

    // Cargo especial
    exonerado: '1265868381962108961',
    semCargo:  '1265868402178920559',

    // Cargos com permissão para cada ação
    podePRomover:    ['1265868312504696833', '1265868313662197851', 's'],
    podeRebaixar:    ['1265868312504696833', '1265868313662197851', 's'],
    podeAdvertir:    ['1265868312504696833', '1265868313662197851', 's', 'ID_CARGO_OFICIAL'],
    podeExonerar:    ['1265868312504696833', '1265868313662197851'],
    podeAprovarAusencia: ['1265868312504696833', '1265868313662197851', 's'],
    podeAprovarRecrutamento: ['1265868312504696833', '1265868313662197851', 's'],
    podeDashboard:   ['1265868312504696833', '1265868313662197851', 's'],
    podeTicketStaff: ['1265868312504696833', '1265868313662197851', 's', 'ID_CARGO_OFICIAL'],
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
      registro:       '1389278380414734356,1515126923733499955',
      recrutamento:   '1515126992729673738',
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
