import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.aniread.mobile',
  appName: 'ANIREAD',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
