export const loginLanguage = {
  es: {
    title: 'Bienvenido',
    subtitle: 'Divide gastos inteligentemente',
    form: {
      credentialLabel: 'Usuario o Email',
      credentialPlaceholder: 'Demo o demo@splitsmart.com',
      passwordLabel: 'Contraseña (Demo no requiere)',
      passwordPlaceholder: 'No requerida para Demo',
      loginButton: 'Iniciar Sesión',
      loginButtonLoading: 'Ingresando...'
    },
    demo: {
      title: '🎯 Datos de prueba',
      username: 'Usuario: Demo',
      email: 'Email: demo@splitsmart.com',
      passwordNote: '✨ Sin contraseña requerida'
    },
    errors: {
      credentialRequired: 'Por favor ingresa tu usuario o email',
      invalidCredentials: 'Credenciales incorrectas. Intenta con:\nUsuario: Demo (sin contraseña)',
      general: 'Error'
    },
    futureFeatures: {
      title: '🚀 Próximamente',
      description: 'Estará el desarrollo de nuevos usuarios y recupero de usuarios y password'
    },
    links: {
      signUp: '¿No tienes cuenta? Regístrate',
      forgotPassword: '¿Olvidaste tu contraseña?'
    }
  },
  en: {
    title: 'Welcome',
    subtitle: 'Split expenses intelligently',
    form: {
      credentialLabel: 'Username or Email',
      credentialPlaceholder: 'Demo or demo@splitsmart.com',
      passwordLabel: 'Password (Demo doesn\'t require)',
      passwordPlaceholder: 'Not required for Demo',
      loginButton: 'Sign In',
      loginButtonLoading: 'Signing In...'
    },
    demo: {
      title: '🎯 Test data',
      username: 'Username: Demo',
      email: 'Email: demo@splitsmart.com',
      passwordNote: '✨ No password required'
    },
    errors: {
      credentialRequired: 'Please enter your username or email',
      invalidCredentials: 'Invalid credentials. Try with:\nUsername: Demo (no password)',
      general: 'Error'
    },
    futureFeatures: {
      title: '🚀 Coming Soon',
      description: 'Development of new users and user/password recovery will be available'
    },
    links: {
      signUp: 'Don\'t have an account? Sign up',
      forgotPassword: 'Forgot your password?'
    }
  },
  pt: {
    title: 'Bem-vindo',
    subtitle: 'Divida despesas inteligentemente',
    form: {
      credentialLabel: 'Usuário ou Email',
      credentialPlaceholder: 'Demo ou demo@splitsmart.com',
      passwordLabel: 'Senha (Demo não requer)',
      passwordPlaceholder: 'Não necessária para Demo',
      loginButton: 'Entrar',
      loginButtonLoading: 'Entrando...'
    },
    demo: {
      title: '🎯 Dados de teste',
      username: 'Usuário: Demo',
      email: 'Email: demo@splitsmart.com',
      passwordNote: '✨ Sem senha necessária'
    },
    errors: {
      credentialRequired: 'Por favor digite seu usuário ou email',
      invalidCredentials: 'Credenciais inválidas. Tente com:\nUsuário: Demo (sem senha)',
      general: 'Erro'
    },
    futureFeatures: {
      title: '🚀 Em breve',
      description: 'Estará disponível o desenvolvimento de novos usuários e recuperação de usuário e senha'
    },
    links: {
      signUp: 'Não tem conta? Cadastre-se',
      forgotPassword: 'Esqueceu sua senha?'
    }
  }
};

// SignUp translations
export const signUpLanguage = {
  es: {
    title: 'Crear Cuenta',
    subtitle: 'Únete a SplitSmart',
    form: {
      nameLabel: 'Nombre Completo',
      namePlaceholder: 'Tu nombre completo',
      usernameLabel: 'Nombre de Usuario',
      usernamePlaceholder: 'usuario123',
      emailLabel: 'Email',
      emailPlaceholder: 'tu@email.com',
      phoneLabel: 'Teléfono',
      phonePlaceholder: '+54 11 1234 5678',
      skipPasswordLabel: 'Crear usuario sin contraseña',
      basicSectionTitle: 'Información Básica',
      contactSectionTitle: 'Contacto',
      securitySectionTitle: 'Seguridad',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      confirmPasswordLabel: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Repite tu contraseña',
      signUpButton: 'Crear Cuenta',
      signUpButtonLoading: 'Creando cuenta...'
    },
    errors: {
      title: 'Error de Registro',
      nameRequired: 'El nombre es obligatorio',
      usernameRequired: 'El nombre de usuario es obligatorio',
      usernameMinLength: 'El nombre de usuario debe tener al menos 3 caracteres',
      usernameInvalid: 'Solo se permiten letras, números y guiones bajos',
      usernameExists: 'Este nombre de usuario ya existe',
      phoneRequired: 'El teléfono es obligatorio',
      emailInvalid: 'El email ingresado no es válido. Debe tener el formato usuario@dominio.com',
      emailExists: 'Este email ya está registrado',
      passwordRequired: 'La contraseña es obligatoria',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      phoneInvalid: 'Formato de teléfono inválido',
      general: 'Error al crear la cuenta. Inténtalo de nuevo.'
    },
    success: {
      title: '¡Cuenta creada!',
      message: '¡Bienvenido/a {name}! Tu cuenta se ha creado exitosamente.',
      messageLoginManual: 'Cuenta creada exitosamente. Por favor inicia sesión.',
      button: 'Continuar'
    },
    friendModal: {
      title: '¿Unirte como Amigo?',
      subtitle: 'Podemos crearte en tu lista de amigos con tus datos para que seas participante de los eventos.',
      nameLabel: 'Nombre',
      emailLabel: 'Email',
      phoneLabel: 'Teléfono',
      noEmail: 'Sin email',
      noPhone: 'Sin teléfono',
      note: 'ℹ️ Este amigo es independiente de tu perfil. Los cambios al perfil no lo actualizarán. Podés editarlo desde Amigos.',
      confirmButton: 'Sí, agregarme como Amigo',
      skipButton: 'Ahora no'
    },
    links: {
      backToLogin: '¿Ya tienes cuenta? Inicia sesión'
    },
    passwordStrength: {
      veryWeak: 'Muy débil',
      weak: 'Débil',
      fair: 'Regular',
      good: 'Buena',
      strong: 'Fuerte',
      veryStrong: 'Muy fuerte'
    },
    usernameValidation: {
      checking: 'Verificando...',
      available: 'Disponible',
      taken: 'No disponible',
      tooShort: 'Mínimo 3 caracteres',
      invalid: 'Solo letras, números y _',
      error: 'Error al verificar'
    }
  },
  en: {
    title: 'Create Account',
    subtitle: 'Join SplitSmart',
    form: {
      nameLabel: 'Full Name',
      namePlaceholder: 'Your full name',
      usernameLabel: 'Username',
      usernamePlaceholder: 'username123',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      phoneLabel: 'Phone',
      phonePlaceholder: '+1 555 1234 5678',
      skipPasswordLabel: 'Create user without password',
      basicSectionTitle: 'Basic Information',
      contactSectionTitle: 'Contact',
      securitySectionTitle: 'Security',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Repeat your password',
      signUpButton: 'Create Account',
      signUpButtonLoading: 'Creating account...'
    },
    errors: {
      title: 'Registration Error',
      nameRequired: 'Name is required',
      usernameRequired: 'Username is required',
      usernameMinLength: 'Username must be at least 3 characters',
      usernameInvalid: 'Only letters, numbers and underscores allowed',
      usernameExists: 'This username already exists',
      phoneRequired: 'Phone is required',
      emailInvalid: 'The email entered is not valid. It must have the format user@domain.com',
      emailExists: 'This email is already registered',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      phoneInvalid: 'Invalid phone format',
      general: 'Error creating account. Please try again.'
    },
    success: {
      title: 'Account created!',
      message: 'Welcome {name}! Your account has been created successfully.',
      messageLoginManual: 'Account created successfully. Please sign in.',
      button: 'Continue'
    },
    friendModal: {
      title: 'Add Yourself as a Friend?',
      subtitle: 'We can add you to your friends list so you can participate in events.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      noEmail: 'No email',
      noPhone: 'No phone',
      note: 'ℹ️ This friend is independent from your profile. Profile changes won\'t update it. You can edit it from Friends.',
      confirmButton: 'Yes, add me as a Friend',
      skipButton: 'Not now'
    },
    links: {
      backToLogin: 'Already have an account? Sign in'
    },
    passwordStrength: {
      veryWeak: 'Very weak',
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
      veryStrong: 'Very strong'
    },
    usernameValidation: {
      checking: 'Checking...',
      available: 'Available',
      taken: 'Not available',
      tooShort: 'Minimum 3 characters',
      invalid: 'Only letters, numbers and _',
      error: 'Error checking'
    }
  },
  pt: {
    title: 'Criar Conta',
    subtitle: 'Junte-se ao SplitSmart',
    form: {
      nameLabel: 'Nome Completo',
      namePlaceholder: 'Seu nome completo',
      usernameLabel: 'Nome de Usuário',
      usernamePlaceholder: 'usuario123',
      emailLabel: 'Email',
      emailPlaceholder: 'seu@email.com',
      phoneLabel: 'Telefone',
      phonePlaceholder: '+55 11 1234 5678',
      skipPasswordLabel: 'Criar usuário sem senha',
      basicSectionTitle: 'Informações Básicas',
      contactSectionTitle: 'Contato',
      securitySectionTitle: 'Segurança',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      confirmPasswordLabel: 'Confirmar Senha',
      confirmPasswordPlaceholder: 'Repita sua senha',
      signUpButton: 'Criar Conta',
      signUpButtonLoading: 'Criando conta...'
    },
    errors: {
      title: 'Erro de Cadastro',
      nameRequired: 'Nome é obrigatório',
      usernameRequired: 'Nome de usuário é obrigatório',
      usernameMinLength: 'Nome de usuário deve ter pelo menos 3 caracteres',
      usernameInvalid: 'Apenas letras, números e underscore permitidos',
      usernameExists: 'Este nome de usuário já existe',
      phoneRequired: 'Telefone é obrigatório',
      emailInvalid: 'O e-mail informado não é válido. Deve ter o formato usuario@dominio.com',
      emailExists: 'Este email já está cadastrado',
      passwordRequired: 'Senha é obrigatória',
      passwordMinLength: 'Senha deve ter pelo menos 6 caracteres',
      passwordMismatch: 'Senhas não coincidem',
      phoneInvalid: 'Formato de telefone inválido',
      general: 'Erro ao criar conta. Tente novamente.'
    },
    success: {
      title: 'Conta criada!',
      message: 'Bem-vindo/a {name}! Sua conta foi criada com sucesso.',
      messageLoginManual: 'Conta criada com sucesso. Por favor faça login.',
      button: 'Continuar'
    },
    friendModal: {
      title: 'Adicionar-se como Amigo?',
      subtitle: 'Podemos te adicionar à sua lista de amigos para que participe dos eventos.',
      nameLabel: 'Nome',
      emailLabel: 'Email',
      phoneLabel: 'Telefone',
      noEmail: 'Sem email',
      noPhone: 'Sem telefone',
      note: 'ℹ️ Este amigo é independente do seu perfil. Alterações no perfil não o atualizarão. Você pode editá-lo em Amigos.',
      confirmButton: 'Sim, me adicionar como Amigo',
      skipButton: 'Agora não'
    },
    links: {
      backToLogin: 'Já tem conta? Faça login'
    },
    passwordStrength: {
      veryWeak: 'Muito fraca',
      weak: 'Fraca',
      fair: 'Razoável',
      good: 'Boa',
      strong: 'Forte',
      veryStrong: 'Muito forte'
    },
    usernameValidation: {
      checking: 'Verificando...',
      available: 'Disponível',
      taken: 'Não disponível',
      tooShort: 'Mínimo 3 caracteres',
      invalid: 'Apenas letras, números e _',
      error: 'Erro ao verificar'
    }
  }
};

// ForgotPassword translations
export const forgotPasswordLanguage = {
  es: {
    title: 'Recuperar Contraseña',
    subtitle: 'Te ayudamos a recuperar el acceso',
    form: {
      credentialLabel: 'Usuario o Email',
      credentialPlaceholder: 'Tu usuario o email registrado',
      resetButton: 'Generar Contraseña Temporal',
      resetButtonLoading: 'Generando...',
      sectionTitle: 'Recuperar Acceso',
      infoText: 'Ingresa tu usuario o email y generaremos una contraseña temporal para ti.'
    },
    errors: {
      title: 'Error',
      credentialRequired: 'Por favor ingresa tu usuario o email',
      userNotFound: 'No encontramos una cuenta con esos datos',
      general: 'Error al procesar la solicitud. Inténtalo de nuevo.',
      okButton: 'Entendido'
    },
    success: {
      title: 'Contraseña Restablecida ✅',
      message: 'Se generó una contraseña temporal para tu cuenta.',
      tempPassword: 'Tu nueva contraseña temporal',
      changePassword: 'Una vez que inicies sesión, ve a Perfil para cambiarla cuando quieras.',
      noteHint: '⚠️ Toma nota de esta contraseña antes de continuar. No se podrá recuperar después.',
      goToLogin: 'Entendido, ir al Login',
      sentMessage: 'Tu contraseña temporal fue generada.'
    },
    links: {
      backToLogin: 'Volver al login',
      createAccount: '¿No tienes cuenta? Regístrate'
    }
  },
  en: {
    title: 'Reset Password',
    subtitle: 'We help you regain access',
    form: {
      credentialLabel: 'Username or Email',
      credentialPlaceholder: 'Your registered username or email',
      resetButton: 'Generate Temporary Password',
      resetButtonLoading: 'Generating...',
      sectionTitle: 'Recover Access',
      infoText: 'Enter your username or email and we will generate a temporary password for you.'
    },
    errors: {
      title: 'Error',
      credentialRequired: 'Please enter your username or email',
      userNotFound: 'We could not find an account with that information',
      general: 'Error processing request. Please try again.',
      okButton: 'Got it'
    },
    success: {
      title: 'Password Reset ✅',
      message: 'A temporary password was generated for your account.',
      tempPassword: 'Your new temporary password',
      changePassword: 'Once signed in, go to Profile to change it whenever you want.',
      noteHint: '⚠️ Write down this password before continuing. It cannot be recovered after dismissing.',
      goToLogin: 'Got it, go to Login',
      sentMessage: 'Your temporary password was generated.'
    },
    links: {
      backToLogin: 'Back to login',
      createAccount: 'Don\'t have an account? Sign up'
    }
  },
  pt: {
    title: 'Recuperar Senha',
    subtitle: 'Vamos ajudá-lo a recuperar o acesso',
    form: {
      credentialLabel: 'Usuário ou Email',
      credentialPlaceholder: 'Seu usuário ou email cadastrado',
      resetButton: 'Gerar Senha Temporária',
      resetButtonLoading: 'Gerando...',
      sectionTitle: 'Recuperar Acesso',
      infoText: 'Digite seu usuário ou email e geraremos uma senha temporária para você.'
    },
    errors: {
      title: 'Erro',
      credentialRequired: 'Por favor digite seu usuário ou email',
      userNotFound: 'Não encontramos uma conta com esses dados',
      general: 'Erro ao processar solicitação. Tente novamente.',
      okButton: 'Entendi'
    },
    success: {
      title: 'Senha Redefinida ✅',
      message: 'Uma senha temporária foi gerada para sua conta.',
      tempPassword: 'Sua nova senha temporária',
      changePassword: 'Após entrar, acesse Perfil para alterar quando quiser.',
      noteHint: '⚠️ Anote essa senha antes de continuar. Não poderá ser recuperada depois.',
      goToLogin: 'Entendido, ir ao Login',
      sentMessage: 'Sua senha temporária foi gerada.'
    },
    links: {
      backToLogin: 'Voltar ao login',
      createAccount: 'Não tem conta? Cadastre-se'
    }
  }
};