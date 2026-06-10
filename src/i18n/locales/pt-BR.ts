export type Translations = {
  lang: { label: string; short: string }
  nav: {
    home: string; download: string; login: string; register: string
    dashboard: string; discord: string
  }
  auth: {
    email: string; emailPlaceholder: string; password: string
    newPassword: string; confirmPassword: string; confirmNewPassword: string
    passwordPlaceholder: string; newPasswordPlaceholder: string
    confirmNewPasswordPlaceholder: string
  }
  login: {
    title: string; subtitle: string; forgotPassword: string
    submit: string; submitting: string; noAccount: string; signUp: string
    oldAccount: string; updateAccount: string; resendEmail: string; resending: string
  }
  register: {
    title: string; subtitle: string; usernameLabel: string; usernamePlaceholder: string
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
  }
  rewards: { loadError: string; loading: string }
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
    login: 'Login',
    register: 'Registro',
    dashboard: 'Painel',
    discord: 'Discord',
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
  },

  register: {
    title: 'Registro Universe',
    subtitle: 'Crie sua conta para começar sua jornada no Site Universe.',
    usernameLabel: 'Nome de usuário',
    usernamePlaceholder: 'UniversePlayer',
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
    subtitle: 'Use o link de verificação enviado para concluir sua conta.',
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
  },

  rewards: {
    loadError: 'Não foi possível carregar a escala de recompensas. Tente novamente.',
    loading: 'Carregando escala...',
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
