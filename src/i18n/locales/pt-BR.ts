export type Translations = {
  lang: { label: string; short: string }
  nav: {
    home: string; download: string; hallOfFame: string; login: string; register: string
    dashboard: string; discord: string
  }
  hallOfFame: {
    kicker: string; title: string; subtitle: string
    searchLabel: string; searchPlaceholder: string
    loading: string; empty: string
    colPosition: string; colClass: string; colPlayer: string
    colPoints: string; colWins: string; colLosses: string
    tabGeneral: string; tabMonthly: string; monthlyUnavailable: string
  }
  auth: {
    email: string; emailPlaceholder: string; password: string
    newPassword: string; confirmPassword: string; confirmNewPassword: string
    passwordPlaceholder: string; newPasswordPlaceholder: string
    confirmNewPasswordPlaceholder: string
    recaptchaRequired: string
  }
  login: {
    title: string; subtitle: string; forgotPassword: string
    submit: string; submitting: string; noAccount: string; signUp: string
    oldAccount: string; updateAccount: string; resendEmail: string; resending: string
    resendIn: string; resendSuccess: string
    verifyCodeInstruction: string; verifyCodeLabel: string; verifyCodeButton: string
    verifyCodeSubmitting: string; verifyCodeSuccess: string; verifyCodeError: string
  }
  register: {
    title: string; subtitle: string; usernameLabel: string; usernamePlaceholder: string
    usernameLowercaseNotice: string
    confirmPasswordLabel: string; confirmPasswordPlaceholder: string
    terms1: string; termsLink: string; terms2: string; privacyLink: string
    submit: string; submitting: string; hasAccount: string; signIn: string
  }
  verifyEmail: {
    title: string; subtitle: string; codeLabel: string; codePlaceholder: string
    submit: string; submitting: string; resend: string; resending: string
    resendIn: string; backToLogin: string; loading: string; codeSent: string
    emailSuccess: string; tokenInvalid: string; noEmail: string
    noEmailCode: string; codeInvalid: string
  }
  forgotPassword: {
    title: string; subtitle: string; submit: string; submitting: string
    rememberPassword: string; backToLogin: string
  }
  resetPassword: {
    title: string; subtitle: string; passwordLabel: string; passwordPlaceholder: string
    confirmLabel: string; confirmPlaceholder: string; submit: string
    submitting: string; backToLogin: string; invalidToken: string
  }
  migration: {
    title: string; subtitle: string; gameLoginLabel: string; gameLoginPlaceholder: string
    currentPasswordLabel: string; currentPasswordPlaceholder: string
    securityNote: string; submit: string; submitting: string
    step2Title: string; step2Subtitle: string; accountFound: string
    emailLabel: string; emailPlaceholder: string; newPasswordLabel: string
    newPasswordPlaceholder: string; confirmPasswordLabel: string
    confirmPasswordPlaceholder: string; finish: string; finishing: string
    doneTitle: string; doneSubtitle: string; goToLogin: string; loading: string
    unavailable: string
    gameLoginInvalid: string; invalidCredentials: string; alreadyMigrated: string
    weakPassword: string; passwordsNotMatch: string; passwordRequirementsTitle: string
    passwordRuleMin: string; passwordRuleLower: string; passwordRuleDigits: string
    passwordRuleNoSequence: string; passwordRuleNoLogin: string
  }
  panel: {
    validating: string; playerArea: string; userPanel: string; logout: string
    loggingOut: string; menuLabel: string
    nav: { panel: string; store: string; rewards: string; support: string }
    homeLink: string; loading: string; loadError: string
    dashboardKicker: string; dashboardTitle: string; dashboardSubtitle: string
  }
  store: {
    kicker: string; title: string; subtitle: string; loading: string; loadError: string
    noPackages: string; retry: string; createError: string
    emailNotVerified: string; resendVerification: string
    orderCreated: string; orderPaid: string; orderWaiting: string; orderCreatedNote: string
    packageLabel: string; unicoinLabel: string; valueLabel: string; statusLabel: string
    pixCopiaECola: string; copyPix: string; pixCopied: string
    simulatePayment: string; simulating: string; simulateError: string
    confirm: string; closeOrder: string; pixWaiting: string; paidDescription: string
    buy: string; buying: string
    orderSummaryLabel: string; pixQrAlt: string
  }
  rewards: {
    loadError: string; loading: string
    scaleKicker: string; scaleTitle: string; scaleDescription: string
    youtubeNote: string; youtubeLinkLabel: string
    noScaleData: string; claimSuccess: string; claimError: string
    retryButton: string; scaleCycleNote: string
    progressTitle: string; progressSummary: string; progressNote: string
    nextRank: string; missing: string
    statusLocked: string; statusEligible: string; statusClaimed: string
    statusDeliveryPending: string; statusDelivered: string
    goal: string; itemsInBox: string; itemInBox: string
    rewardBox: string; viewRewards: string; claimBox: string; claiming: string
    rewardsOf: string; metaLabel: string; boxPreview: string
    missingToUnlock: string; itemsInsideBox: string
    quantityLabel: string; closeButton: string; registeringClaim: string
    closeModalLabel: string; scaleGridLabel: string
    items: Record<string, string>
  }
  admin: {
    menuLabel: string; brandShort: string; brandTitle: string
    baseLink: string; usersLink: string; ordersLink: string
    gameDeliveriesLink: string; auditLogsLink: string
    playerPanelLink: string; signOut: string; signingOut: string
    administrationLabel: string; panelTitle: string
    validating: string; accessDenied: string
    baseKicker: string; baseTitle: string; baseSubtitle: string
    sessionKicker: string; sessionTitle: string
    statusLabel: string; authorized: string; roleLabel: string
    usersKicker: string; usersTitle: string; usersSubtitle: string
    usersLoading: string; usersEmpty: string
    idLabel: string; nameLabel: string; emailLabel: string
    emailVerifiedLabel: string; roleUserLabel: string; statusUserLabel: string
    createdAtLabel: string; lastLoginLabel: string; yesLabel: string; noLabel: string
    ordersKicker: string; ordersTitle: string; ordersSubtitle: string
    ordersLoading: string; ordersEmpty: string
    orderNumberLabel: string; packageLabel: string; amountLabel: string
    orderStatusLabel: string; paidAtLabel: string
    deliveriesKicker: string; deliveriesTitle: string; deliveriesSubtitle: string
    deliveriesLoading: string; deliveriesEmpty: string
    typeLabel: string; deliveryStatusLabel: string; attemptsLabel: string
    deliveredAtLabel: string; lastErrorLabel: string
    auditKicker: string; auditTitle: string; auditSubtitle: string
    auditLoading: string; auditEmpty: string
    eventTypeLabel: string; actorLabel: string; successLabel: string
    reasonLabel: string; userLabel: string; orderLabel: string
    noDataLabel: string; loadError: string
    championsLink: string
    championsKicker: string; championsTitle: string; championsSubtitle: string
    championsLoading: string; championsEmpty: string
    championMonthLabel: string; championYearLabel: string; championViewButton: string
    championPositionLabel: string; championPlayerLabel: string; championClassLabel: string
    championPointsLabel: string; championWinsLabel: string; championLossesLabel: string
    championMvpsLabel: string; championPeriodLabel: string
  }
  home: {
    featuredClass: string; createAccount: string; signIn: string; download: string
    panelFallback: string; panelPrefix: string; prevClass: string; nextClass: string
  }
  validation: {
    emailRequired: string; emailInvalid: string; passwordRequired: string
    passwordStrength: string; passwordConfirmation: string; username: string
  }
  terms: { title: string }
  privacy: { title: string }
  languageSwitcher: { label: string }
}

const ptBR: Translations = {
  lang: { label: 'Português (Brasil)', short: 'PT' },

  nav: {
    home: 'Home',
    download: 'Download',
    hallOfFame: 'Hall da Fama',
    login: 'Login',
    register: 'Registro',
    dashboard: 'Painel',
    discord: 'Discord',
  },

  hallOfFame: {
    kicker: 'Ranking PvP',
    title: 'Hall da Fama',
    subtitle: 'Os 50 melhores jogadores da arena.',
    searchLabel: 'Buscar personagem',
    searchPlaceholder: 'Nome do personagem',
    loading: 'Carregando ranking...',
    empty: 'Nenhum jogador encontrado.',
    colPosition: '#',
    colClass: 'Classe',
    colPlayer: 'Personagem',
    colPoints: 'Pontos',
    colWins: 'Vitórias',
    colLosses: 'Derrotas',
    tabGeneral: 'Ranking Geral',
    tabMonthly: 'Ranking do Mês',
    monthlyUnavailable: 'Ranking mensal disponível a partir do dia 4 do próximo mês.',
  },

  auth: {
    email: 'E-mail',
    emailPlaceholder: 'seuemail@exemplo.com',
    password: 'Senha',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar senha',
    confirmNewPassword: 'Confirmar nova senha',
    passwordPlaceholder: 'Sua senha',
    newPasswordPlaceholder: 'Nova senha',
    confirmNewPasswordPlaceholder: 'Repita a nova senha',
    recaptchaRequired: 'Confirme o reCAPTCHA antes de continuar.',
  },

  login: {
    title: 'Universe Login',
    subtitle: 'Entre com seu e-mail e senha para acessar sua conta.',
    forgotPassword: 'Esqueci a senha',
    submit: 'Login',
    submitting: 'Entrando...',
    noAccount: 'Não tem uma conta?',
    signUp: 'Cadastre-se',
    oldAccount: 'Tem uma conta antiga?',
    updateAccount: 'Atualizar conta',
    resendEmail: 'Reenviar e-mail',
    resending: 'Reenviando...',
    resendIn: 'Reenviar em',
    resendSuccess: 'Código reenviado. Verifique seu e-mail.',
    verifyCodeInstruction: 'Digite o código enviado para seu e-mail.',
    verifyCodeLabel: 'Código de verificação',
    verifyCodeButton: 'Verificar código',
    verifyCodeSubmitting: 'Verificando...',
    verifyCodeSuccess: 'Código verificado com sucesso. Agora você já pode fazer login.',
    verifyCodeError: 'Código inválido, expirado ou já utilizado.',
  },

  register: {
    title: 'Registro Universe',
    subtitle: 'Crie sua conta para começar sua jornada no Site Universe.',
    usernameLabel: 'Nome de usuário',
    usernamePlaceholder: 'universeplayer',
    usernameLowercaseNotice: 'Convertemos para minúsculas: o login do jogo diferencia maiúsculas de minúsculas.',
    confirmPasswordLabel: 'Confirmar senha',
    confirmPasswordPlaceholder: 'Repita a senha',
    terms1: 'Li e aceito os',
    termsLink: 'Termos de Uso',
    terms2: 'e a',
    privacyLink: 'Política de Privacidade',
    submit: 'Registrar',
    submitting: 'Criando conta...',
    hasAccount: 'Já tem uma conta?',
    signIn: 'Entrar',
  },

  verifyEmail: {
    title: 'Verifique seu e-mail',
    subtitle: 'Digite o código enviado para seu e-mail.',
    codeLabel: 'Código de confirmação',
    codePlaceholder: '000000',
    submit: 'Confirmar e-mail',
    submitting: 'Confirmando...',
    resend: 'Reenviar e-mail',
    resending: 'Reenviando...',
    resendIn: 'Reenviar em',
    backToLogin: 'Voltar ao login',
    loading: 'Validando token de verificação...',
    codeSent: 'Enviamos um código de confirmação para seu e-mail. Confirme para liberar sua conta.',
    emailSuccess: 'E-mail verificado com sucesso.',
    tokenInvalid: 'Token inválido ou expirado.',
    noEmail: 'Informe o e-mail para reenviar a verificação.',
    noEmailCode: 'Informe o e-mail para confirmar o código.',
    codeInvalid: 'Informe o código de confirmação recebido por e-mail.',
  },

  forgotPassword: {
    title: 'Recuperar senha',
    subtitle: 'Informe seu e-mail para receber instruções de recuperação.',
    submit: 'Enviar instruções',
    submitting: 'Enviando...',
    rememberPassword: 'Lembrou a senha?',
    backToLogin: 'Voltar ao login',
  },

  resetPassword: {
    title: 'Redefinir senha',
    subtitle: 'Crie uma nova senha segura para sua conta.',
    passwordLabel: 'Nova senha',
    passwordPlaceholder: 'Nova senha',
    confirmLabel: 'Confirmar nova senha',
    confirmPlaceholder: 'Repita a nova senha',
    submit: 'Redefinir senha',
    submitting: 'Redefinindo...',
    backToLogin: 'Voltar ao login',
    invalidToken: 'Token inválido ou expirado.',
  },

  migration: {
    title: 'Atualizar conta antiga',
    subtitle: 'Use seu login e senha atuais do jogo para atualizar sua conta e adicionar um e-mail.',
    gameLoginLabel: 'Usuário do jogo',
    gameLoginPlaceholder: 'usuario123',
    currentPasswordLabel: 'Senha atual',
    currentPasswordPlaceholder: 'Senha atual do jogo',
    securityNote: 'Nunca compartilhe sua senha fora do site oficial.',
    submit: 'Continuar',
    submitting: 'Validando...',
    step2Title: 'Finalizar atualização da conta',
    step2Subtitle: 'Adicione um e-mail e defina uma nova senha para sua conta no Site Universe.',
    accountFound: 'Conta encontrada:',
    emailLabel: 'E-mail',
    emailPlaceholder: 'seuemail@exemplo.com',
    newPasswordLabel: 'Nova senha',
    newPasswordPlaceholder: 'Nova senha',
    confirmPasswordLabel: 'Confirmar nova senha',
    confirmPasswordPlaceholder: 'Repita a nova senha',
    finish: 'Finalizar atualização',
    finishing: 'Finalizando...',
    doneTitle: 'Conta atualizada com sucesso!',
    doneSubtitle: 'Acesse o site com seu e-mail e nova senha.',
    goToLogin: 'Ir para o login',
    loading: 'Carregando...',
    unavailable: 'A migração de contas está temporariamente indisponível.',
    gameLoginInvalid: 'Use apenas letras e números no usuário do jogo.',
    invalidCredentials: 'Usuário ou senha inválidos.',
    alreadyMigrated: 'Esta conta já foi atualizada. Acesse o site normalmente ou use a recuperação de senha.',
    weakPassword: 'Revise os requisitos da nova senha antes de continuar.',
    passwordsNotMatch: 'As senhas não coincidem.',
    passwordRequirementsTitle: 'Requisitos da nova senha:',
    passwordRuleMin: 'Mínimo 10 caracteres',
    passwordRuleLower: 'Apenas letras minúsculas (a-z)',
    passwordRuleDigits: 'Números (0-9) permitidos',
    passwordRuleNoSequence: 'Sem sequências óbvias (abc123...)',
    passwordRuleNoLogin: 'Não usar o mesmo que o usuário do jogo',
  },

  panel: {
    validating: 'Validando sessão...',
    playerArea: 'Área do jogador',
    userPanel: 'Painel do Usuário',
    logout: 'Sair',
    loggingOut: 'Saindo...',
    menuLabel: 'Menu da área logada',
    nav: {
      panel: 'Painel',
      store: 'Loja',
      rewards: 'Recompensas',
      support: 'Suporte',
    },
    homeLink: 'Home',
    loading: 'Carregando painel...',
    loadError: 'Não foi possível carregar os dados do painel.',
    dashboardKicker: 'Site Universe',
    dashboardTitle: 'Painel do jogador',
    dashboardSubtitle: 'Acompanhe os dados reais da sua conta, o status de verificação do e-mail e atalhos informativos da área do jogador.',
  },

  store: {
    kicker: 'Loja de Unicoin',
    title: 'Pacotes para evoluir',
    subtitle: 'Escolha um pacote de Unicoin. O pedido é criado com segurança e o pagamento é feito somente via Pix.',
    loading: 'Carregando pacotes...',
    loadError: 'Não foi possível carregar os pacotes de Unicoin. Tente novamente.',
    noPackages: 'Nenhum pacote disponível no momento.',
    retry: 'Tentar novamente',
    createError: 'Não foi possível criar o pedido Pix. Tente novamente.',
    emailNotVerified: 'Verifique seu e-mail antes de comprar Unicoin.',
    resendVerification: 'Reenviar verificação',
    orderCreated: 'Pedido criado',
    orderPaid: 'Pago',
    orderWaiting: 'Aguardando pagamento Pix',
    orderCreatedNote: 'criado com sucesso.',
    packageLabel: 'Pacote',
    unicoinLabel: 'Unicoin',
    valueLabel: 'Valor',
    statusLabel: 'Status',
    pixCopiaECola: 'Pix copia e cola',
    copyPix: 'Copiar código Pix',
    pixCopied: 'Código Pix copiado.',
    simulatePayment: 'Simular pagamento aprovado',
    simulating: 'Simulando...',
    simulateError: 'Não foi possível simular o pagamento agora.',
    confirm: 'Entendi',
    closeOrder: 'Fechar confirmação do pedido',
    pixWaiting: 'O Unicoin será creditado somente após confirmação real do pagamento Pix.',
    paidDescription: 'Pagamento confirmado. O saldo Unicoin será atualizado pelo servidor.',
    buy: 'Comprar Unicoin',
    buying: 'Criando pedido...',
    orderSummaryLabel: 'Resumo do pedido',
    pixQrAlt: 'QR Code Pix do pedido',
  },

  rewards: {
    loadError: 'Não foi possível carregar a escala de recompensas. Tente novamente.',
    loading: 'Carregando escala...',
    scaleKicker: 'Escala de recompensas',
    scaleTitle: 'Escala de recompensas',
    scaleDescription: 'A escala usa o Unicoin obtido em compras do site. O Unicoin gasto dentro do jogo não reduz este progresso.',
    youtubeNote: 'Para ver os visuais dos itens, confira no',
    youtubeLinkLabel: 'YouTube',
    noScaleData: 'Nenhum dado de escala disponível no momento.',
    claimSuccess: 'Resgate registrado. A entrega da caixa será processada para a conta vinculada.',
    claimError: 'Não foi possível registrar o resgate. Tente novamente.',
    retryButton: 'Tentar novamente',
    scaleCycleNote: 'Quando o Rank 6 for concluído, o sistema inicia um novo ciclo mantendo o Unicoin excedente em compras para a próxima escala.',
    progressTitle: 'Progresso da escala',
    progressSummary: '{current} / {max} Unicoin em compras',
    progressNote: 'Baseado nas compras de Unicoin registradas no site. Ao atingir a meta de cada rank, uma caixa de recompensas fica liberada para resgate.',
    nextRank: 'Próximo rank',
    missing: 'Faltam {amount} Unicoin',
    statusLocked: 'Bloqueado',
    statusEligible: 'Liberado',
    statusClaimed: 'Resgatado',
    statusDeliveryPending: 'Entrega pendente',
    statusDelivered: 'Entregue',
    goal: 'Meta: {amount} Unicoin',
    itemsInBox: '{count} itens na caixa',
    itemInBox: '{count} item na caixa',
    rewardBox: 'Caixa de recompensas',
    viewRewards: 'Ver recompensas',
    claimBox: 'Resgatar caixa',
    claiming: 'Registrando...',
    rewardsOf: 'Recompensas do {rank}',
    metaLabel: 'Meta',
    boxPreview: 'Caixa visual',
    missingToUnlock: 'Faltam {amount} Unicoin para liberar este rank.',
    itemsInsideBox: 'Itens dentro da caixa',
    quantityLabel: 'Quantidade: {qty}',
    closeButton: 'Fechar',
    registeringClaim: 'Registrando resgate...',
    closeModalLabel: 'Fechar detalhes do rank',
    scaleGridLabel: 'Ranks da escala de recompensas',
    items: {},
  },

  admin: {
    menuLabel: 'Menu administrativo do site',
    brandShort: 'SU',
    brandTitle: 'Admin',
    baseLink: 'Base Admin',
    usersLink: 'Usuários',
    ordersLink: 'Pedidos',
    gameDeliveriesLink: 'Entregas GF',
    auditLogsLink: 'Auditoria',
    playerPanelLink: 'Painel do jogador',
    signOut: 'Sair',
    signingOut: 'Saindo...',
    administrationLabel: 'Administração do site',
    panelTitle: 'Painel Admin',
    validating: 'Validando acesso admin...',
    accessDenied: 'Acesso negado.',
    baseKicker: 'Site Universe',
    baseTitle: 'Base Admin',
    baseSubtitle: 'Área inicial para administração segura dos fluxos do site.',
    sessionKicker: 'Sessão admin',
    sessionTitle: 'Acesso confirmado',
    statusLabel: 'Status',
    authorized: 'Autorizado',
    roleLabel: 'Role',
    usersKicker: 'Administração',
    usersTitle: 'Usuários',
    usersSubtitle: 'Lista de contas cadastradas no site.',
    usersLoading: 'Carregando usuários...',
    usersEmpty: 'Nenhum usuário encontrado.',
    idLabel: 'ID',
    nameLabel: 'Nome',
    emailLabel: 'E-mail',
    emailVerifiedLabel: 'E-mail verificado',
    roleUserLabel: 'Role',
    statusUserLabel: 'Status',
    createdAtLabel: 'Criado em',
    lastLoginLabel: 'Último login',
    yesLabel: 'Sim',
    noLabel: 'Não',
    ordersKicker: 'Administração',
    ordersTitle: 'Pedidos',
    ordersSubtitle: 'Pedidos recentes de Unicoin.',
    ordersLoading: 'Carregando pedidos...',
    ordersEmpty: 'Nenhum pedido encontrado.',
    orderNumberLabel: 'Nº do pedido',
    packageLabel: 'Pacote',
    amountLabel: 'Valor',
    orderStatusLabel: 'Status',
    paidAtLabel: 'Pago em',
    deliveriesKicker: 'Administração',
    deliveriesTitle: 'Entregas GF',
    deliveriesSubtitle: 'Entregas de itens para o jogo.',
    deliveriesLoading: 'Carregando entregas...',
    deliveriesEmpty: 'Nenhuma entrega encontrada.',
    typeLabel: 'Tipo',
    deliveryStatusLabel: 'Status',
    attemptsLabel: 'Tentativas',
    deliveredAtLabel: 'Entregue em',
    lastErrorLabel: 'Último erro',
    auditKicker: 'Administração',
    auditTitle: 'Auditoria',
    auditSubtitle: 'Logs de auditoria de pagamentos.',
    auditLoading: 'Carregando auditoria...',
    auditEmpty: 'Nenhum log encontrado.',
    eventTypeLabel: 'Tipo de evento',
    actorLabel: 'Ator',
    successLabel: 'Sucesso',
    reasonLabel: 'Motivo',
    userLabel: 'Usuário',
    orderLabel: 'Pedido',
    noDataLabel: '—',
    loadError: 'Erro ao carregar dados.',
    championsLink: 'Campeões',
    championsKicker: 'Administração',
    championsTitle: 'Campeões do mês',
    championsSubtitle: 'Top 10 campeões congelados de cada ciclo mensal do ranking.',
    championsLoading: 'Carregando campeões...',
    championsEmpty: 'Nenhum campeão registrado para este mês.',
    championMonthLabel: 'Mês',
    championYearLabel: 'Ano',
    championViewButton: 'Consultar',
    championPositionLabel: '#',
    championPlayerLabel: 'Personagem',
    championClassLabel: 'Classe',
    championPointsLabel: 'Pontos',
    championWinsLabel: 'Vitórias',
    championLossesLabel: 'Derrotas',
    championMvpsLabel: 'MVPs',
    championPeriodLabel: 'Período',
  },

  home: {
    featuredClass: 'Classe em destaque',
    createAccount: 'Criar conta',
    signIn: 'Entrar',
    download: 'Download',
    panelFallback: 'Ir para o painel',
    panelPrefix: 'Painel de',
    prevClass: 'Classe anterior',
    nextClass: 'Próxima classe',
  },

  validation: {
    emailRequired: 'E-mail obrigatório.',
    emailInvalid: 'Digite um e-mail válido.',
    passwordRequired: 'Senha obrigatória.',
    passwordStrength: 'A senha deve ter no mínimo 10 caracteres e usar apenas letras minúsculas e números.',
    passwordConfirmation: 'A confirmação de senha deve ser igual à senha.',
    username: 'Nome de usuário deve ter de 3 a 20 caracteres e conter apenas letras sem acento e números.',
  },

  terms: { title: 'Termos de Uso' },
  privacy: { title: 'Política de Privacidade' },

  languageSwitcher: { label: 'Idioma' },
}

export default ptBR
