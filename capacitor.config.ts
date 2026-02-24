import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitlynk.app',
  appName: 'Fitlynk',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1A73E8'
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Fitlynk'
  },
  android: {
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
