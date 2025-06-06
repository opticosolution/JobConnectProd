const withCleartextTraffic = require('./withCleartextTraffic');

module.exports = {
  expo: {
    name: 'JobConnectProd',
    slug: 'JobConnectProd',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: 'Allow BarcodeScan to access your camera for barcode scanning.',
      },
    },
    android: {
      package: 'com.expopticosolutions.ConnectProd',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'CAMERA',
        'INTERNET',
        'android.permission.CAMERA',
        'RECORD_AUDIO'
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-notifications',
      withCleartextTraffic,
    ],
     "extra": {
      "eas": {
        "projectId": "f33e7a62-f71a-4976-a445-643d1db971f2"
      }
    },
    newArchEnabled: true,
  },
};
