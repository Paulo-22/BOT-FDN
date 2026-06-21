// Configuração central do bot FDN

module.exports = {
  // ID do servidor (guild) onde o bot opera. Necessário para tarefas em
  // background que não recebem uma `interaction` (ex: scheduler de punições).
  guildId: '1261915854459764766',

  // ============================================
  // CARGOS DA FACÇÃO (IDs dos cargos no Discord)
  // ============================================
  cargos: {
    admin:       '1515212078137479268',
    lider:       '1265868309467762729',
    subLider:    '1265868312504696833',
    coordenador: '1265868313662197851',

    // Hierarquia completa (índice 0 = mais baixo)
    hierarquia: [
      { nome: '「 ☠️」・  ᴏʙsᴇʀᴠᴀᴄᴀᴏ',        id: '1265868360613101658' },
      { nome: '「 ☠️ 」・ ᴄᴀᴍᴘᴀɴᴀ',           id: '1265868359682228317' },
      { nome: '「 ☠️ 」・ ᴄʀɪᴀ',              id: '1265868358469947396' },
      { nome: '「 ☠️ 」・  ᴠᴀᴘᴏʀ',            id: '1298063359153012786' },
      { nome: '「 ☠️ 」・  ᴏʟʜᴇɪʀᴏ',          id: '1265868356930633820' },
      { nome: '「 ☠️ 」・  ᴀᴠɪᴀᴏᴢɪɴʜᴏ',       id: '1298062889923510334' },
      { nome: '「 ☠️ 」・  ғᴏɢᴜᴇᴛᴇɪʀᴏ',       id: '1298063119146553344' },
      { nome: '「 ☠️ 」・  ᴄʀɪᴍɪɴᴏsᴏ',        id: '1298063355508035647' },
      { nome: '「 ☠️ 」・  ᴛʀᴀғɪᴄᴀɴᴛᴇ',       id: '1298063563621007372' },
      { nome: '「 ⚡ 」・  ʜᴏᴍɪᴄɪᴅᴀ',         id: '1298338702262665287' },
      { nome: '「 ⚡ 」・  ᴇxᴇᴄᴜᴛᴏʀ',         id: '1265868354690875515' },
      { nome: '「 ⚡ 」・  ᴍᴇʀᴄᴇɴᴀʀɪᴏ',       id: '1265868354074185831' },
      { nome: '「 ⚡ 」・ ᴍᴀᴛᴀᴅᴏʀ ᴅᴇ ᴀʟᴜɢᴜᴇʟ',id: '1265868352266440785' },
      { nome: '「 ⚡ 」・ ᴄᴏɴᴛʀᴀʙᴀɴᴅɪsᴛᴀ',    id: '1265868352996380805' },
      { nome: '「 🏴‍☠️ 」・  ᴍᴀɴᴅʀᴀᴋᴇ',         id: '1265868349796126795' },
      { nome: '「 🏴‍☠️ 」・  ʟᴀᴅʀᴀ̃ᴏ ᴅᴇ ᴄᴀʀɢᴀ',  id: '1265868349108125746' },
      { nome: '「 🏴‍☠️ 」・  sᴇʀɪᴀʟ ᴋɪʟᴇʀ',  id: '1265868347719942156' },
      { nome: '「 🏴‍☠️ 」・  ᴘɪʟᴏᴛᴏ ᴅᴇ ғᴜɢᴀ',   id: '1265868346470039554' },
      { nome: '「 🏴‍☠️ 」・ sᴇǫᴜᴇsᴛʀᴀᴅᴏʀ',      id: '1265868345027330103' },
      { nome: '「 🎓 」・  sᴜᴘᴇʀᴠɪsᴏʀ  ᴛᴇsᴛᴇ',     id: '1265868337473388617' },
      { nome: '「 🎓 」・  sᴜᴘᴇʀᴠɪsᴏʀ',       id: '1265868336038940714' },
      { nome: '「 🎓 」・  sᴜᴘᴇʀᴠɪsᴏʀ ɢᴇʀᴀʟ', id: '1265868334986170391' },
      { nome: '「 🎓 」・  sᴜʙ. ɢᴇʀᴇɴᴛᴇ',id: '1265868333908234361' },
      { nome: '「 🎓 」・ ɢᴇʀᴇɴᴛᴇ',      id: '1265868333010518047' },
      { nome: '「 🎓 」・ ɢᴇʀᴇɴᴛᴇ ɢᴇʀᴀʟ',id: '1265868331521675297' },
      { nome: '「⭐」・sᴇɢᴜʀᴀɴᴄ̧ᴀ ᴅᴏ ᴘᴀᴛʀᴀ̃ᴏ',id: '1265868324068392990' },
      { nome: '「⭐」・  ғʀᴇɴᴛᴇ ᴅᴏ ᴍᴏʀʀᴏ',  id: '1265868329713799319' },
      { nome: '「⭐」・  ʙʀᴀᴄ̧ᴏ ᴅɪʀᴇɪᴛᴏ', id: '1265868328661028885' },
      { nome: '「⭐」・ sᴜʙ. ᴄʜᴇғᴇ',     id: '1265868327239024803' },
      { nome: '「⭐」・ ᴄʜᴇғᴇ',          id: '1265868325662101605' },
      { nome: '「⭐」・  ᴅᴏɴᴏ ᴅᴏ ᴍᴏʀʀᴏ', id: '1265868325033082901' },
      { nome: '「⭐」 ・ ᴘᴀᴛʀᴀᴏ',        id: '1265868320725270581' },
      { nome: '「⭐」 ・sᴜʙ. ᴅᴏɴᴏ',      id: '1265868319890608330' },
      { nome: '「⭐」 ・ᴅᴏɴᴏ',           id: '1265868318548557894' },
      { nome: '「 👑 」・ sᴜʙ ғᴜɴ.',     id: '1265868313662197851' },
      { nome: '「 👑 」・  ғᴜɴᴅᴀᴅᴏʀ',    id: '1265868312504696833' },
    ],

    exonerado: '1265868381962108961',
    semCargo:  '1265868402178920559',

    // Cargo aplicado ao membro quando uma solicitação de TRANSFERÊNCIA é aprovada.
    // Troque pelo ID real do cargo de "Transferido" no servidor.
    transferido: '1265868387985260737',

    // Cargos aplicados pelo sistema de punição.
    // REMOCAO não está aqui: ela reaproveita o cargo `exonerado` acima.
    // Substitua os valores 'ID_PUNICAO_X' pelos IDs reais dos cargos no servidor.
    punicao: {
      PUNICAO_1: '1265868377113755678',
      PUNICAO_2: '1265868378057211944',
      PUNICAO_3: '1265868378833424446',
    },

    // Permissões por ação    //FUNDADOR,             SUB FUNDADOR,                COORDENADOR
    podePRomover:            ['1265868309467762729', '1265868312504696833', '1265868313662197851'],
    podeRebaixar:            ['1265868309467762729', '1265868312504696833', '1265868313662197851'],
    podeAdvertir:            ['1265868309467762729', '1265868312504696833', '1265868313662197851', '1265868318548557894'],
    podeExonerar:            ['1265868309467762729', '1265868312504696833'],
    podeAprovarAusencia:     ['1265868309467762729', '1265868312504696833', '1265868313662197851'],
    podeAprovarRecrutamento: ['1265868309467762729', '1265868312504696833', '1265868313662197851'],
    podeDashboard:           ['1265868309467762729', '1265868312504696833', '1265868313662197851'],
    podeTicketStaff:         ['1265868309467762729', '1265868312504696833', '1265868313662197851', '1265868318548557894'],

    // Permissões do sistema de EDITAL (formulário de recrutamento)
    podeAnalisarEdital: ['1265868396843499530', '1265868373062062162', '1265868313662197851'],

    // Cargos atribuídos ao aprovar o edital
    cargosAprovacaoEdital: ['1265868360613101658', '1265868398194327627'],
  },

  // ============================================
  // CANAIS
  // ============================================
  canais: {
    registro:         '1389278353143369818',
    recrutamento:     '1389279188724224062',
    transferencia:    '1518328266165850282',
    analise:          '1515128153721274550',

    // Canal de análise EXCLUSIVO para solicitações de transferência
    // (separado do canal de análise de candidatura/edital).
    // Troque pelo ID real do canal.
    analiseTransferencia: '1518331733739700305',

    batePonto:        '1304235934073749644',
    ausencias:        '1304237408425873488',
    adminPanel:       '1265868552099991608',
    punicao:          '1265868554788536383',
    tickets:          '1265868540494221435',
    categoriaTickets: '1515129942344466512',

    // Sistema de EDITAL
    categoriaEdital: '1515681495367548952',
    resultadoEdital: '1389279206390894784',
    analiseEdital:   '1515128153721274550',

    voiceAutorizados: [
      '1265868591971045408',
      '1265868593464217692',
      '1362165240338321669',
      '1297975693468242021',
      '1265868594655527044',
      '1265868597239218240',
    ],

    logs: {
      registro:      '1389278380414734356',
      recrutamento:  '1515125340421488741',
      promocoes:     '1265868579174355071',
      rebaixamentos: '1265868581967626333',
      advertencias:  '1265868580747219046',
      exoneracoes:   '1265868582722601064',
      ausencias:     '1515127504212594778',
      tickets:       '1515124815042711732',
      batePonto:     '1389278729120776192',
      punicoes:      '1265868580747219046',
      punicoesRemovidas: '1515127418145476629', // canal exclusivo para punições removidas (expiradas ou manuais) — troque pelo ID real do canal

      // Canal exclusivo para log de transferências aprovadas/reprovadas.
      // Troque pelo ID real do canal.
      transferencias: '1518327752451821658',
    },
  },

  // ============================================
  // CORES
  // ============================================
cores: {
  principal: 0xDC2626,
  sucesso: 0x22C55E,
  erro: 0xEF4444,
  aviso: 0xF59E0B,
  info: 0x3B82F6,
  neutro: 0x6B7280,
  gold: 0xFBBF24
}
};