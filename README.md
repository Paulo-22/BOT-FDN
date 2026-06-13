# 🤖 FDN Bot — Família do Norte

Bot completo para Discord da facção FDN (Família do Norte) no MTA, desenvolvido com **Discord.js v14**, **PostgreSQL** e **Prisma ORM**.

---

## 📦 Tecnologias

| Tecnologia     | Versão    |
|----------------|-----------|
| Node.js        | >= 18     |
| Discord.js     | v14       |
| Prisma ORM     | v5        |
| PostgreSQL     | >= 14     |

---

## 🗂️ Estrutura de Pastas

```
src/
├── events/
│   ├── ready.js              # Inicialização do bot
│   ├── interactionCreate.js  # Roteador de interações
│   └── voiceStateUpdate.js   # Auto encerramento de ponto
├── buttons/
│   └── buttonHandler.js      # Handler de botões
├── modals/
│   ├── modals.js             # Definição dos formulários
│   └── modalHandler.js       # Handler de modals
├── services/
│   └── horasService.js       # Lógica de horas/ponto
├── database/
│   └── client.js             # Prisma Client
├── embeds/                   # (para embeds reutilizáveis futuras)
├── utils/
│   └── permissoes.js         # Verificação de cargos
├── panels/
│   └── paineis.js            # Construção de painéis
├── logs/
│   └── logger.js             # Sistema de logs
├── config.js                 # ⚙️ CONFIGURAÇÃO CENTRAL
└── index.js                  # Entrada do bot
prisma/
└── schema.prisma             # Schema do banco de dados
```

---

## ⚙️ Instalação

### 1. Clone o projeto
```bash
git clone https://github.com/seu-repo/fdn-bot.git
cd fdn-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com seus dados
```

### 4. Configure o banco de dados
```bash
# Crie o banco PostgreSQL
createdb fdn_bot

# Execute as migrações
npx prisma migrate dev --name init

# Gere o client
npx prisma generate
```

### 5. Configure o bot (`src/config.js`)

Edite o arquivo `src/config.js` e substitua todos os valores `ID_...` pelos IDs reais do seu servidor Discord.

#### Como obter IDs:
1. Ative o **Modo Desenvolvedor** no Discord (Configurações → Avançado → Modo Desenvolvedor)
2. Clique com o botão direito em qualquer cargo/canal/servidor e selecione **Copiar ID**

### 6. Inicie o bot
```bash
# Produção
npm start

# Desenvolvimento (com reload automático)
npm run dev
```

---

## 📋 Sistemas

### 🔐 Registro
- Painel com botão "REALIZAR REGISTRO"
- Formulário: Nome MTA, ID Gamer, Telefone (opcional)
- Salva no banco, gera log

### 🎯 Recrutamento
- Candidatura com formulário completo
- Canal de análise com botões Aprovar/Reprovar
- DM automática para o candidato
- Log em canal dedicado

### ⏱️ Bate-Ponto
- Verificação de canal de voz autorizado
- Encerramento automático ao sair da call (evento voiceStateUpdate)
- Horas diárias, semanais, mensais e totais
- Ranking top 10 (geral, semanal, mensal)

### 📅 Ausências
- Solicitação com período e motivo
- Aprovação/reprovação pela liderança
- Log em canal dedicado

### ⚠️ Advertências
- Painel administrativo com formulário
- DM automática para o advertido
- Histórico consultável

### ⬆️ Promoções / ⬇️ Rebaixamentos
- Troca automática de cargos no Discord
- DM para o membro
- Histórico salvo no banco
- Log em canal dedicado

### 🚫 Exonerações
- Remove todos os cargos FDN
- Adiciona cargo Exonerado
- DM + log

### 🎫 Tickets
- 4 tipos: Suporte, Denúncia, Dúvida, Recurso
- Canal privado com permissões automáticas
- Transcript gerado ao fechar
- Log em canal dedicado

---

## 🚀 Deploy (painéis)

Para enviar os painéis nos canais pela **primeira vez**:

1. Certifique-se que todos os IDs de canais estão configurados em `src/config.js`
2. No arquivo `src/events/ready.js`, **descomente** a linha:
   ```js
   await configurarPaineis(client);
   ```
3. Inicie o bot — os painéis serão enviados automaticamente
4. **Recomente** a linha para não duplicar nas próximas inicializações

---

## 🛡️ Permissões

Configure os cargos autorizados em `src/config.js`:

```js
podePRomover:    ['ID_CARGO_LIDER', 'ID_CARGO_SUB_LIDER', ...],
podeRebaixar:    ['ID_CARGO_LIDER', ...],
podeAdvertir:    ['ID_CARGO_LIDER', ...],
podeExonerar:    ['ID_CARGO_LIDER', 'ID_CARGO_SUB_LIDER'],
...
```

---

## 📊 Banco de Dados

### Tabelas criadas pelo Prisma:
| Tabela         | Descrição                         |
|----------------|-----------------------------------|
| `usuarios`     | Cadastro dos membros              |
| `horas`        | Registros de ponto                |
| `ausencias`    | Solicitações de ausência          |
| `advertencias` | Advertências aplicadas            |
| `promocoes`    | Histórico de promoções            |
| `rebaixamentos`| Histórico de rebaixamentos        |
| `exoneracoes`  | Histórico de exonerações          |
| `candidaturas` | Candidaturas de recrutamento      |
| `tickets`      | Histórico de tickets              |

### Visualizar banco:
```bash
npm run db:studio
```

---

## 📝 Variáveis de Ambiente

| Variável        | Descrição                        |
|-----------------|----------------------------------|
| `DISCORD_TOKEN` | Token do bot Discord             |
| `GUILD_ID`      | ID do servidor (opcional)        |
| `DATABASE_URL`  | URL de conexão ao PostgreSQL     |

---

## 🔧 Manutenção

```bash
# Verificar logs do Prisma
npm run db:studio

# Resetar banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Aplicar nova migration
npx prisma migrate dev --name nome_da_migration
```

---

## 📌 Requisitos de Permissão do Bot

O bot precisa das seguintes permissões no servidor Discord:
- Gerenciar Cargos
- Gerenciar Canais
- Ver Canais
- Enviar Mensagens
- Enviar Mensagens em Threads
- Ler Histórico de Mensagens
- Adicionar Reações
- Usar Comandos de Aplicativo
- Enviar Mensagens Diretas

---

*FDN Bot — Desenvolvido para a Família do Norte*
