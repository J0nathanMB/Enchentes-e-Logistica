import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Enchentes-e-Logistica',
  webDir: 'www',
  server: {
    allowNavigation: ["*"], // Permite navegação em todas as origens
  },
  android: {
    allowMixedContent: true, // Permite carregar conteúdo misto (HTTP e HTTPS)
    backgroundColor: '#ffffff', // Define uma cor de fundo para evitar tela preta durante o carregamento
    webContentsDebuggingEnabled: true, // Habilita debugging no WebView
  },
  ios: {
    backgroundColor: '#ffffff', // Cor de fundo para iOS
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Tempo de exibição da Splash Screen (em ms)
      backgroundColor: '#ffffff', // Cor de fundo da Splash Screen
    },
    CapacitorCookies: {
      enabled: true, // Garante suporte a cookies em plugins
    },
    CapacitorHttp: {
      enabled: true, // Ativa o suporte a requisições HTTP nativas
    },
    Haptics: {
      enabled: true, // Garante que o Haptics está ativo
    },
  },
};

export default config;