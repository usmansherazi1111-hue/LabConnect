import type { CapacitorConfig } from '@capacitor/cli';

const flavor = (process.env.VITE_APP_FLAVOR || 'patient').trim().toLowerCase();
const isCourier = flavor === 'courier';

const config: CapacitorConfig = {
  appId: isCourier ? 'pk.labconnect.courier' : 'pk.labconnect.patient',
  appName: isCourier ? 'LabConnect Courier' : 'LabConnect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
