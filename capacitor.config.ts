import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fitlynk.app',
  appName: 'Fitlynk',
  webDir: 'out',

  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1A73E8',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '', // optional for now (required only if using backend verification)
      forceCodeForRefreshToken: true,
    },
  },

  ios: {
    contentInset: 'automatic',
    scheme: 'com.fitlynk.app',
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
  },
}

export default config
